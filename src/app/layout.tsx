import type { Metadata } from 'next';
import '@/index.css';
import { AppShell } from './AppShell';

export const metadata: Metadata = {
  title: 'Deni Sawa — Financial Coaching & Debt Management',
  description:
    'Deni Sawa — Debt Management & Financial Coaching. A Social Enterprise offering practical one-on-one advisory and management services to help you achieve financial freedom.',
  icons: {
    icon: '/favicon.svg',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
