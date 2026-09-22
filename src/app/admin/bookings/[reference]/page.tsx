import type { Metadata } from 'next';
import { BookingDetailClient } from '@/components/admin/BookingDetailClient';

export const metadata: Metadata = {
  title: 'Booking Details | Deni Sawa Admin',
  robots: { index: false, follow: false },
};

export default async function BookingDetailPage({ params }: { params: Promise<{ reference: string }> }) {
  const { reference } = await params;
  return <BookingDetailClient reference={reference} />;
}