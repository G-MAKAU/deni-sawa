import type { Metadata } from 'next';
import { ContactPage } from '@/views/ContactPage';
import { business } from '@/data/content';

export const metadata: Metadata = {
  title: 'Contact Us | Deni Sawa',
  description:
    'Book a free, confidential consultation with the Deni Sawa advisory team. Call, email, or use the booking form — we are here to help without judgement.',
  alternates: {
    canonical: `${business.website}/contact`,
  },
};

export default function Page() {
  return <ContactPage />;
}