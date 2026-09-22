import type { Metadata } from 'next';
import { BookingsClient } from '@/components/admin/BookingsClient';

export const metadata: Metadata = {
  title: 'Bookings | Deni Sawa Admin',
  robots: { index: false, follow: false },
};

export default function BookingsPage() {
  return <BookingsClient />;
}