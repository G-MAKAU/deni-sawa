import type { Metadata } from 'next';
import { AcademyPage } from '@/views/AcademyPage';
import { business } from '@/data/content';

export const metadata: Metadata = {
  title: 'Academy & Financial Learning | Deni Sawa',
  description:
    'Coaching programmes, workshops, seminars and webinars for financial literacy — plus our free online learning portal. Build the knowledge to achieve lasting financial freedom.',
  alternates: {
    canonical: `${business.website}/academy`,
  },
};

export default function Page() {
  return <AcademyPage />;
}