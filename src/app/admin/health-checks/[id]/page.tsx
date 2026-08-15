import type { Metadata } from 'next';
import { HealthCheckEditorClient } from '@/components/admin/health-checks/HealthCheckEditorClient';

export const metadata: Metadata = {
  title: 'Edit Health Check | Deni Sawa Admin',
  robots: { index: false, follow: false },
};

export default function HealthCheckDetailPage() {
  return <HealthCheckEditorClient />;
}
