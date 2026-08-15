import type { Metadata } from 'next';
import { DeliveryClient } from '@/components/admin/health-checks/DeliveryClient';

export const metadata: Metadata = {
  title: 'Delivery | Deni Sawa Admin',
  robots: { index: false, follow: false },
};

export default function DeliveryPage() {
  return <DeliveryClient />;
}
