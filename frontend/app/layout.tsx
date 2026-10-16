import type { Metadata } from 'next';
import React from 'react';

export const metadata: Metadata = {
  title: 'EduNexus Academy — Enterprise Learning Platform',
  description: 'Enterprise Learning Management System - Phase 1 Foundation Architecture',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-950 text-slate-100 antialiased font-sans">
        {children}
      </body>
    </html>
  );
}
