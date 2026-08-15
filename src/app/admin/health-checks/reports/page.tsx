import type { Metadata } from 'next';
import { ReportsViewer } from '@/components/admin/health-checks/ReportsViewer';

export const metadata: Metadata = {
  title: 'Reports | Deni Sawa Admin',
  robots: { index: false, follow: false },
};

export default function ReportsPage() {
  return <ReportsViewer />;
}
