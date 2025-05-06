'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from './user-context';

export function useRequireAuth(redirectPath = '/login') {
  const { user, loading } = useUser();
  const router = useRouter();

  useEffect(() => {
    // If no user is found and the loading is done, redirect to the login page.
    if (!loading && !user) {
      router.replace(redirectPath);
    }
  }, [user, loading, router, redirectPath]);

  return { user, loading };
}
