'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import Logo from '@/components/Logo';
import { Check, X } from 'lucide-react';

export default function SignupPage() {
  const supabase = createClientComponentClient();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    birthday: '',
    email: '',
    password: '',
    phone: '',
  });
  const [passwordStrength, setPasswordStrength] = useState('');

  const passwordRequirements = [
    { label: 'At least 8 characters', test: (pw: string) => pw.length >= 8 },
    { label: 'One uppercase letter', test: (pw: string) => /[A-Z]/.test(pw) },
    { label: 'One lowercase letter', test: (pw: string) => /[a-z]/.test(pw) },
    { label: 'One number', test: (pw: string) => /\d/.test(pw) },
    { label: 'One special character', test: (pw: string) => /[^A-Za-z0-9]/.test(pw) },
  ];

  const getStrength = (password: string) => {
    const score = passwordRequirements.filter(req => req.test(password)).length;
    if (score <= 2) return 'Weak';
    if (score === 3 || score === 4) return 'Moderate';
    return 'Strong';
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
    if (name === 'password') {
      setPasswordStrength(getStrength(value));
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { email, password, firstName, lastName, birthday, phone } = form;

    // Signup user with email and password
    const { data, error } = await supabase.auth.signUp({ email, password, phone });

    if (error || !data.user) {
      toast.error(error?.message || 'Signup failed.');
      setLoading(false);
      return;
    }

    // Add the first name and last name as display name and profile details
    const { error: profileError } = await supabase.from('profiles').upsert([
      {
        id: data.user.id,
        first_name: firstName,
        last_name: lastName,
        birthday,
        phone,
      },
    ]);

    if (profileError) {
      console.error('Error creating profile:', profileError);
      toast.error('Profile creation failed.');
      setLoading(false);
      return;
    }

    // Optionally update display name in the auth system after profile creation
    const { error: updateError } = await supabase.auth.updateUser({
      data: {
        full_name: `${firstName} ${lastName}`, // Display name
      },
    });

    if (updateError) {
      console.error('Error updating display name:', updateError);
      toast.error('Failed to update display name.');
    }

    toast.success('Signup successful! Please check your email to verify.');
    setTimeout(() => router.push('/login'), 1500);
    setLoading(false);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] px-6">
      <div className="mb-6 text-center">
        <Logo size="lg" />
        <p className="mt-2 text-lg font-medium text-gray-600">
          Join us and keep your friends in the loop 🎉
        </p>
      </div>

      <form
        onSubmit={handleSignup}
        className="w-full max-w-md p-6 space-y-6 bg-white border rounded-lg shadow"
      >
        {/* First Name */}
        <div className="space-y-2">
          <Label htmlFor="firstName">First name</Label>
          <Input
            id="firstName"
            name="firstName"
            value={form.firstName}
            onChange={handleChange}
            required
          />
        </div>

        {/* Last Name */}
        <div className="space-y-2">
          <Label htmlFor="lastName">Last name (optional)</Label>
          <Input id="lastName" name="lastName" value={form.lastName} onChange={handleChange} />
        </div>

        {/* Phone Number */}
        <div className="space-y-2">
          <Label htmlFor="phone">Phone number</Label>
          <Input
            id="phone"
            name="phone"
            type="tel"
            value={form.phone}
            onChange={handleChange}
            required
          />
        </div>

        {/* Email */}
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            name="email"
            type="email"
            value={form.email}
            onChange={handleChange}
            required
          />
        </div>

        {/* Password */}
        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            name="password"
            type="password"
            value={form.password}
            onChange={handleChange}
            required
          />
        </div>

        {/* Birthday */}
        <div className="space-y-2">
          <Label htmlFor="birthday">Birthday (optional)</Label>
          <Input
            id="birthday"
            name="birthday"
            type="date"
            value={form.birthday}
            onChange={handleChange}
          />
        </div>

        {/* Password Strength Indicators */}
        {form.password && (
          <div className="mt-4 space-y-2">
            <p className="text-sm font-medium">
              Strength:{' '}
              <span
                className={
                  passwordStrength === 'Strong'
                    ? 'text-green-600'
                    : passwordStrength === 'Moderate'
                      ? 'text-yellow-600'
                      : 'text-red-600'
                }
              >
                {passwordStrength}
              </span>
            </p>
            <ul className="mt-2 space-y-1 text-sm text-gray-600">
              {passwordRequirements.map(req => {
                const isMet = req.test(form.password);
                return (
                  <li key={req.label} className="flex items-center gap-2">
                    {isMet ? (
                      <Check className="w-4 h-4 text-green-600" />
                    ) : (
                      <X className="w-4 h-4 text-red-500" />
                    )}
                    <span>{req.label}</span>
                  </li>
                );
              })}
            </ul>
          </div>
        )}

        {/* Submit Button */}
        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? 'Signing up...' : 'Sign Up'}
        </Button>
      </form>

      {/* After Submit: Move to the next section */}
      <div className="mt-6 space-y-4 text-sm text-center text-gray-600">
        <p>
          Already have an account?{' '}
          <a href="/login" className="text-blue-600 hover:underline">
            Log in
          </a>
        </p>
        <p>
          By signing up, you agree to our{' '}
          <a href="/terms" className="text-blue-600 hover:underline">
            Terms of Service
          </a>{' '}
          and{' '}
          <a href="/privacy" className="text-blue-600 hover:underline">
            Privacy Policy
          </a>
        </p>
      </div>
    </div>
  );
}
