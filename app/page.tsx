import Link from 'next/link';
import React from 'react';
import Logo from '@/components/Logo';

export default function LandingPage() {
  return (
    <div className="py-8 space-y-8 text-center">
      <div className="max-w-2xl mx-auto space-y-4">
        <h1 className="text-5xl font-bold text-blue-600">Plans change.</h1>
        <div className="flex items-baseline justify-center">
          <Logo size="md" />
          <span className="ml-2 text-xl">keeps your friends in the loop—automatically.</span>
        </div>
      </div>
      <div className="space-y-6">
        <div className="grid grid-cols-1 gap-6 text-left md:grid-cols-3">
          <div className="p-6 rounded-lg bg-blue-50">
            <h3 className="text-lg font-medium">Quick Updates</h3>
            <p>Change plans without the hassle of messaging everyone individually.</p>
          </div>
          <div className="p-6 rounded-lg bg-blue-50">
            <h3 className="text-lg font-medium">Smart AI</h3>
            <p>Our AI crafts personalized messages for your contacts.</p>
          </div>
          <div className="p-6 rounded-lg bg-blue-50">
            <h3 className="text-lg font-medium">Seamless Experience</h3>
            <p>SMS and email options keep everyone informed your way.</p>
          </div>
        </div>

        <div className="mt-10">
          <Link
            href="/start"
            className="px-6 py-3 text-lg text-white transition-colors bg-blue-600 rounded-md hover:bg-blue-700"
          >
            Get Started
          </Link>
          <Link
            href="/dashboard"
            className="px-6 py-3 ml-4 text-lg text-blue-600 transition-colors border border-blue-600 rounded-md hover:bg-blue-50"
          >
            View Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
