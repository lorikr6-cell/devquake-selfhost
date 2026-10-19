import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { APP } from '@/generated/app';
import { PoweredBy } from '@/components/powered-by';
import { TimeZoneSync } from '@/components/time-zone-sync';
import { getLocale } from '@/lib/context';
import './globals.css';

export const metadata: Metadata = {
  // The app's pages set their own full titles; the shell's pages use instance/layout.tsx.
  title: APP.name,
  description: APP.tagline,
  icons: { icon: [{ url: '/instance/icon.svg', type: 'image/svg+xml' }] },
  // A private instance: search engines stay out unless the owner wants otherwise.
  robots: { index: false, follow: false },
};

export default async function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang={await getLocale()}>
      {/* A column, so the DevQuake footer stays at the bottom of short pages. */}
      <body className="flex min-h-dvh flex-col antialiased">
        <TimeZoneSync />
        {children}
        <PoweredBy />
      </body>
    </html>
  );
}
