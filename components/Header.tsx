'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Button } from '@/components/ui/button';
import Logo from '@/components/Logo';
import { useUser } from '@/lib/user-context';
import { toast } from 'sonner';

export default function Header() {
  const router = useRouter();
  const pathname = usePathname();
  const { user, loading } = useUser();
  const supabase = createClientComponentClient();

  const [userProfile, setUserProfile] = useState<any>(null); // State to hold profile data

  useEffect(() => {
    const getProfile = async () => {
      console.log('User:', user); // Check if the user is being set correctly
      if (user) {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id) // Use the user id to fetch the profile
          .single();

        if (!error && data) {
          console.log('Profile Data:', data); // Ensure the profile data is being fetched
          setUserProfile(data); // Save profile data in the state
        } else {
          toast.error('Error fetching profile');
        }
      }
    };

    if (user) {
      getProfile(); // Fetch the profile when user is authenticated
    }
  }, [user, supabase]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast.success('Signed out successfully');
    setTimeout(() => router.push('/login'), 800);
  };

  if (loading) {
    return (
      <header className="sticky top-0 z-50 flex items-center justify-between px-4 py-1 bg-white border-b shadow-sm">
        Checking authentication...
      </header>
    );
  }

  return (
    <header className="sticky top-0 z-50 flex items-center justify-between px-4 py-1 bg-white border-b shadow-sm">
      <div className="flex items-center gap-6">
        <Logo size="md" />
        {user && (
          <nav className="hidden gap-4 text-sm text-gray-600 sm:flex">
            <a
              href="/dashboard"
              className={`transition hover:text-blue-600 ${
                pathname === '/dashboard' ? 'text-blue-600 font-medium' : ''
              }`}
            >
              Dashboard
            </a>
            <a
              href="/start"
              className={`transition hover:text-blue-600 ${
                pathname === '/start' ? 'text-blue-600 font-medium' : ''
              }`}
            >
              New Event
            </a>
            <a
              href="/settings"
              className={`transition hover:text-blue-600 ${
                pathname === '/settings' ? 'text-blue-600 font-medium' : ''
              }`}
            >
              Settings
            </a>
          </nav>
        )}
      </div>
      {user && (
        <div className="flex items-center gap-4 text-sm">
          {/* Show first name from the profile, fallback to email */}
          <span className="text-gray-700">
            Signed in as {userProfile?.first_name || user.email}
          </span>
          <Button variant="outline" size="sm" onClick={handleLogout}>
            Log out
          </Button>
        </div>
      )}
    </header>
  );
}
