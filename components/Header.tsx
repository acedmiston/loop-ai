'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { createSupabaseClient } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import Logo from '@/components/Logo';
import { useUser } from '@/lib/user-context';
import { toast } from 'sonner';

export default function Header() {
  const router = useRouter();
  const pathname = usePathname();
  const { user } = useUser();
  const supabase = createSupabaseClient();
  const [userProfile, setUserProfile] = useState<any>(null);

  useEffect(() => {
    const getProfile = async () => {
      if (user) {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();
        if (!error && data) setUserProfile(data);
        else toast.error('Error fetching profile');
      }
    };
    if (user) getProfile();
  }, [user, supabase]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast.success('Signed out successfully');
    setTimeout(() => router.push('/login'), 800);
  };

  return (
    <header className="sticky top-0 z-50 w-full bg-white border-b shadow-sm">
      <div className="flex items-center justify-between px-4 py-2 mx-auto">
        <div className="relative flex items-center gap-8">
          <span className="absolute -top-3">
            <Logo size="sm" />
          </span>
          {user && (
            <nav className="items-center hidden gap-6 text-sm text-gray-600 sm:flex ml-[60px]">
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
                href="/contacts"
                className={`transition hover:text-blue-600 ${
                  pathname === '/contacts' ? 'text-blue-600 font-medium' : ''
                }`}
              >
                Contacts
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
            <span className="text-gray-700">
              Signed in as {userProfile?.first_name?.trim() ? userProfile.first_name : user.email}
            </span>
            <Button variant="outline" size="sm" onClick={handleLogout}>
              Log out
            </Button>
          </div>
        )}
      </div>
    </header>
  );
}
