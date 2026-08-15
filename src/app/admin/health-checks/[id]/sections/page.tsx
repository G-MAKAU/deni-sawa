import type { Metadata } from 'next';
import { SectionsManager } from '@/components/admin/health-checks/SectionsManager';

export const metadata: Metadata = {
  title: 'Sections | Deni Sawa Admin',
  robots: { index: false, follow: false },
};

export default function SectionsPage() {
  return <SectionsManager />;
}
