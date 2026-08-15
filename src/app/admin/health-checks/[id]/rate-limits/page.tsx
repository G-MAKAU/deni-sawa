import type { Metadata } from 'next';
import { RateLimitsClient } from '@/components/admin/health-checks/RateLimitsClient';

export const metadata: Metadata = {
  title: 'Rate Limits | Deni Sawa Admin',
  robots: { index: false, follow: false },
};

export default function RateLimitsPage() {
  return <RateLimitsClient />;
}
