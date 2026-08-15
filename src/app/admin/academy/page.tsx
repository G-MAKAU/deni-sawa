import type { Metadata } from 'next';
import { AcademyClient } from '@/components/admin/academy/AcademyClient';

export const metadata: Metadata = {
  title: 'Academy | Deni Sawa Admin',
  robots: { index: false, follow: false },
};

export default function AcademyPage() {
  return <AcademyClient />;
}
