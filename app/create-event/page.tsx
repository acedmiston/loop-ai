'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { useRequireAuth } from '@/lib/use-require-auth';
import EventForm from '@/components/EventForm';

export default function StartPage() {
  const { user, loading } = useRequireAuth();

  if (loading || !user) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <div className="mb-8 space-y-1 text-center">
        <h1 className="text-2xl font-bold">Create a New Event</h1>
        <p className="text-sm text-muted-foreground">
          Fill in the details and we&apos;ll handle the rest.
        </p>
      </div>
      <EventForm />
    </motion.div>
  );
}
