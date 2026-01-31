'use client';

import { useRequireAuth } from '@/lib/use-require-auth';
import DashboardContent from '@/app/dashboard/DashboardContent';

export default function HomePage() {
  const { user, loading } = useRequireAuth();
  if (loading || !user) {
    return null;
  }
  return <DashboardContent />;
}
