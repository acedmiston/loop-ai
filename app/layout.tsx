import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import React from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Toaster } from 'sonner';
import { UserProvider } from '@/lib/user-context';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'L∞P - Keep Your Friends in the Loop',
  description: 'Automatically update your contacts when plans change',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable}`}>
      <body className="min-h-screen text-gray-900 bg-white">
        <UserProvider>
          <div className="flex flex-col min-h-screen">
            <Header />
            <main className="flex-1 px-4 py-6 sm:py-8">
              <div className="w-full max-w-5xl mx-auto">{children}</div>
            </main>
            <Footer />
          </div>
          <Toaster position="bottom-right" richColors />
        </UserProvider>
      </body>
    </html>
  );
}
