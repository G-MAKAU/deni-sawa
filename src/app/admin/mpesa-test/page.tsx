import type { Metadata } from 'next';
import { MpesaTestClient } from '@/components/admin/MpesaTestClient';

export const metadata: Metadata = {
  title: 'M-Pesa Test | Deni Sawa Admin',
  robots: { index: false, follow: false },
};

export default function MpesaTestPage() {
  return <MpesaTestClient />;
}
