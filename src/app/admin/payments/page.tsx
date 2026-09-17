import type { Metadata } from 'next';
import { PaymentsClient } from '@/components/admin/PaymentsClient';

export const metadata: Metadata = {
  title: 'Payments | Deni Sawa Admin',
  robots: { index: false, follow: false },
};

export default function PaymentsPage() {
  return <PaymentsClient />;
}
