import type { Metadata } from 'next';
import { ServicesClient } from '@/components/admin/ServicesClient';

export const metadata: Metadata = {
  title: 'Booking Services | Deni Sawa Admin',
  robots: { index: false, follow: false },
};

export default function ServicesPage() {
  return <ServicesClient />;
}