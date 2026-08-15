import type { Metadata } from 'next';
import { HealthChecksListClient } from '@/components/admin/health-checks/HealthChecksListClient';

export const metadata: Metadata = {
  title: 'Health Checks | Deni Sawa Admin',
  robots: { index: false, follow: false },
};

export default function HealthChecksPage() {
  return <HealthChecksListClient />;
}
