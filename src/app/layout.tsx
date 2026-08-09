import type { Metadata } from 'next';
import '@/index.css';
import { AppShell } from './AppShell';
import { Geist } from "next/font/google";
import { cn } from "@/lib/utils";

const geist = Geist({subsets:['latin'],variable:'--font-sans'});

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
    <html lang="en" className={cn("font-sans", geist.variable)}>
      <body>
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
