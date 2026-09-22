import type { Metadata } from 'next';
import { site } from '@/data/site';

export const metadata: Metadata = {
  title: 'Book a Consultation',
  description:
    'Schedule a consultation with Deni Sawa Partners. Choose your service, pay via M-Pesa, and pick a time that works for you.',
  alternates: { canonical: `${site.url}/booking` },
  openGraph: {
    title: 'Book a Consultation | Deni Sawa Partners',
    description: 'Schedule a consultation with Deni Sawa Partners.',
    url: `${site.url}/booking`,
    type: 'website',
  },
};

export default function BookingLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
