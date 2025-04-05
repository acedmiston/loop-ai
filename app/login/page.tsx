'use client';

import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import Logo from '@/components/Logo';
import Link from 'next/link';

export default function LoginPage() {
  const supabase = createClientComponentClient();
  const router = useRouter();

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_, session) => {
      if (session) {
        router.push('/start');
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase, router]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] px-4 sm:px-6">
      <div className="mb-6 text-center">
        <Logo size="lg" />
        <p className="mt-2 text-lg font-medium text-gray-600">
          The app that keeps your friends in the loop 🎉
        </p>
      </div>

      <div className="w-full max-w-md p-6 bg-white border rounded-lg shadow">
        <h2 className="mb-4 text-xl font-semibold text-center text-gray-800">
          Sign in to your account
        </h2>
        <Auth
          supabaseClient={supabase}
          appearance={{
            theme: ThemeSupa,
          }}
          theme="light"
          providers={[]}
        />
        <p className="mt-4 text-sm text-center text-gray-600">
          Don&apos;t have an account?{' '}
          <Link href="/sign-up" className="text-blue-600 hover:underline">
            Sign up here
          </Link>
        </p>
      </div>
    </div>
  );
}
