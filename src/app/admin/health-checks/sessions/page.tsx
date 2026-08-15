import type { Metadata } from 'next';
import { SessionsViewer } from '@/components/admin/health-checks/SessionsViewer';

export const metadata: Metadata = {
  title: 'Sessions | Deni Sawa Admin',
  robots: { index: false, follow: false },
};

export default function SessionsPage() {
  return <SessionsViewer />;
}
