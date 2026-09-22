import { NextRequest } from 'next/server';
import { dbQuery } from '@/lib/db';

export const dynamic = 'force-dynamic';

interface BookingRow {
  id: number;
  reference: string;
  status: string;
  amount: number;
  booked_date: string | null;
  booked_time: string | null;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  service_name: string;
  service_slug: string;
  duration_minutes: number;
  created_at: string;
  updated_at: string;
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ reference: string }> }
) {
  const { reference } = await params;

  if (!reference || reference.length > 36) {
    return Response.json({ ok: false, error: 'Invalid reference.' }, { status: 400 });
  }

  try {
    const rows = await dbQuery<BookingRow[]>(
      `SELECT b.id, b.reference, b.status, b.amount, b.booked_date, b.booked_time,
              b.customer_name, b.customer_email, b.customer_phone,
              s.name AS service_name, s.slug AS service_slug, s.duration_minutes,
              b.created_at, b.updated_at
       FROM bookings b
       JOIN services s ON s.id = b.service_id
       WHERE b.reference = ?`,
      [reference]
    );

    if (rows.length === 0) {
      return Response.json({ ok: false, error: 'Booking not found.' }, { status: 404 });
    }

    const row = rows[0];
    return Response.json({
      ok: true,
      booking: {
        ...row,
        booking_services: {
          name: row.service_name,
          slug: row.service_slug,
          duration_minutes: row.duration_minutes,
        },
      },
    }, { status: 200 });
  } catch (err) {
    console.error('booking/[reference]: error:', err);
    return Response.json({ ok: false, error: 'Internal server error.' }, { status: 500 });
  }
}
