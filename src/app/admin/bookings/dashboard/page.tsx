import type { Metadata } from 'next';
import { BookingsDashboardClient } from '@/components/admin/BookingsDashboardClient';

export const metadata: Metadata = {
  title: 'Bookings Dashboard | Deni Sawa Admin',
  robots: { index: false, follow: false },
};

export default function BookingsDashboardPage() {
  return <BookingsDashboardClient />;
}
