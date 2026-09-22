import type { Metadata } from 'next';
import BookingEmailLogClient from '@/components/admin/BookingEmailLogClient';

export const metadata: Metadata = {
  title: 'Booking Email Log | Deni Sawa Admin',
  robots: { index: false, follow: false },
};

export default function BookingEmailLogPage() {
  return <BookingEmailLogClient />;
}