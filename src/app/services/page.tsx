import type { Metadata } from 'next';
import { ServicesPage } from '@/views/ServicesPage';
import { business, services } from '@/data/content';

export const metadata: Metadata = {
  title: 'Services & Programmes | Deni Sawa',
  description:
    'Debt management, financial coaching, financial literacy, corporate financial wellness, business advisory and money mindset — plus structured 12, 24 and 48-week programmes.',
  alternates: {
    canonical: `${business.website}/services`,
  },
  openGraph: {
    title: 'Services & Programmes | Deni Sawa',
    description:
      'Debt management, financial coaching, financial literacy, corporate wellness, business advisory and money mindset — structured programmes from 12 to 48 weeks.',
    images: [services[0].image],
  },
};

export default function Page() {
  return <ServicesPage />;
}