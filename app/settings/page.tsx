'use client';

import { useEffect, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { createSupabaseClient } from '@/lib/supabase';
import { useUser } from '@/lib/user-context';
import Skeleton from '@/components/Skeleton';

export default function SettingsPage() {
  const supabase = createSupabaseClient();
  const { user } = useUser();

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [birthday, setBirthday] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) {
        setLoading(false);
        return;
      }
      const { data, error, status } = await supabase
        .from('profiles')
        .select('first_name, last_name, birthday')
        .eq('id', user.id)
        .single();

      if (error && status !== 406) {
        console.error('[settings] Failed to fetch profile', { error, data });
        toast.error('Failed to load profile');
        setFirstName('');
        setLastName('');
        setBirthday('');
      } else if (data) {
        setFirstName(data.first_name || '');
        setLastName(data.last_name || '');
        setBirthday(data.birthday || '');
      }
      setLoading(false);
    };

    fetchProfile();
  }, [user, supabase]);

  const handleSave = async () => {
    if (!user) return;
    if (!firstName.trim()) {
      toast.error('First name is required');
      return;
    }

    setSaving(true);

    // Use the email from the user object directly
    const userEmail = user.email;

    const { error } = await supabase.from('profiles').upsert({
      id: user.id,
      first_name: firstName.trim(),
      last_name: lastName.trim() || null,
      birthday: birthday || null,
      email: userEmail,
      updated_at: new Date().toISOString(),
    });

    if (error) {
      console.error('Error updating profile:', error);
      toast.error('Failed to update profile');
    } else {
      toast.success('Profile updated!');
    }
    setSaving(false);
  };

  return (
    <div className="max-w-xl p-8 mx-auto mt-6 space-y-6 bg-white border shadow-sm rounded-xl">
      <h1 className="text-2xl font-bold">Profile Settings</h1>

      {loading ? (
        <div className="space-y-4">
          <Skeleton className="w-full h-10" />
          <Skeleton className="w-full h-10" />
          <Skeleton className="w-full h-10" />
        </div>
      ) : (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="first_name">First name</Label>
            <Input
              id="first_name"
              value={firstName}
              onChange={e => setFirstName(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="last_name">Last name</Label>
            <Input id="last_name" value={lastName} onChange={e => setLastName(e.target.value)} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="birthday">Birthday</Label>
            <Input
              id="birthday"
              type="date"
              value={birthday}
              onChange={e => setBirthday(e.target.value)}
            />
          </div>

          <Button onClick={handleSave} disabled={saving}>
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      )}
    </div>
  );
}
