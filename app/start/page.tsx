'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { useRequireAuth } from '@/lib/use-require-auth';
import EventForm from '@/components/EventForm';
import Skeleton from '@/components/Skeleton';

export default function StartPage() {
  const { user, loading } = useRequireAuth();

  if (loading || !user) {
    return (
      <div className="max-w-2xl p-6 mx-auto">
        <div className="space-y-4">
          <Skeleton className="w-1/3 h-8" />
          <Skeleton className="w-2/3 h-5" />
          <Skeleton className="w-full h-16" />
          <Skeleton className="w-full h-16" />
          <Skeleton className="w-1/2 h-10" />
        </div>
      </div>
    );
  }

  return (
    <motion.div
      className="max-w-2xl p-6 mx-auto bg-white border rounded-lg shadow-sm"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-center">Where dreams come true...</h1>
      </div>

      <EventForm />
      <div className="pt-6 mt-8 text-center border-t">
        <Link href="/dashboard" className="text-blue-600 hover:underline">
          View My Dashboard →
        </Link>
      </div>
    </motion.div>
  );
}
