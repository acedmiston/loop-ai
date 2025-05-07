'use client';

import { useRequireAuth } from '@/lib/use-require-auth';
import DashboardContent from './DashboardContent'; 

export default function DashboardPage() {
  // Use the authentication check to ensure user is logged in
  const { user, loading } = useRequireAuth(); // if loading or no user, it'll redirect to login

  if (loading || !user) {
    return null;
  }

  // Once user is authenticated, show the dashboard content.
  return <DashboardContent />;
}
