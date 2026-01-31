'use client';

import { useRequireAuth } from '@/lib/use-require-auth';
import EventForm from '@/components/EventForm';
import PageShell from '@/components/PageShell';
import PageHeader from '@/components/PageHeader';

export default function StartPage() {
  const { user, loading } = useRequireAuth();

  if (loading || !user) {
    return null;
  }

  return (
    <PageShell>
      <PageHeader
        title="Create a New Event"
        subtitle="Fill in the details and we'll handle the rest."
      />
      <EventForm />
    </PageShell>
  );
}
