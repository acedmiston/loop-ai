// app/dashboard/page.tsx (client component)
'use client';

import { useRequireAuth } from '@/lib/use-require-auth'; // Ensure the path is correct
import DashboardContentServer from './DashboardContentServer'; // Import the server component

export default function DashboardPage() {
  // Use the authentication check to ensure user is logged in
  const { user, loading } = useRequireAuth(); // if loading or no user, it'll redirect to login

  if (loading || !user) {
    // While loading or when no user is authenticated, show loading state.
    return (
      <div className="flex items-center justify-center h-[50vh] text-gray-500">
        Loading your dashboard...
      </div>
    );
  }

  // Once user is authenticated, show the dashboard content.
  return <DashboardContentServer />;
}
