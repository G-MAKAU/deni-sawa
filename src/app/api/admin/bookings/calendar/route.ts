import { NextRequest } from 'next/server';
import { requireAdmin, jsonAdminError } from '@/lib/admin-auth';
import { dbQuery } from '@/lib/db';

export const dynamic = 'force-dynamic';

interface CalendarBooking {
  reference: string;
  date: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  amount: number;
  status: string;
  booked_time: string | null;
  service_name: string;
  meet_link: string | null;
}

interface DayBookings {
  date: string;
  count: number;
  bookings: CalendarBooking[];
}

export async function GET(request: NextRequest) {
  try {
    await requireAdmin(request, 'read');

    const url = new URL(request.url);
    const monthParam = url.searchParams.get('month');

    const now = new Date();
    let year: number;
    let month: number;

    if (monthParam && /^\d{4}-\d{2}$/.test(monthParam)) {
      [year, month] = monthParam.split('-').map(Number);
    } else {
      year = now.getFullYear();
      month = now.getMonth() + 1;
    }

    const firstDay = new Date(Date.UTC(year, month - 1, 1));
    const lastDay = new Date(Date.UTC(year, month, 0));

    const firstDayStr = firstDay.toISOString().split('T')[0];
    const lastDayStr = lastDay.toISOString().split('T')[0];

    const rows = await dbQuery<CalendarBooking[]>(
      `SELECT
        b.reference,
        DATE(b.booked_date) as date,
        b.customer_name,
        b.customer_email,
        b.customer_phone,
        b.amount,
        b.status,
        b.booked_time,
        s.name as service_name,
        b.google_event_id,
        b.meet_link
      FROM bookings b
      LEFT JOIN services s ON b.service_id = s.id
      WHERE b.booked_date >= ? AND b.booked_date <= ?
      ORDER BY b.booked_date ASC, b.booked_time ASC`,
      [firstDayStr, lastDayStr]
    );

    const bookingsByDate = new Map<string, CalendarBooking[]>();
    for (const row of rows) {
      const dateKey = String(row.date).split('T')[0];
      if (!bookingsByDate.has(dateKey)) {
        bookingsByDate.set(dateKey, []);
      }
      bookingsByDate.get(dateKey)!.push({
        reference: row.reference,
        date: dateKey,
        customer_name: row.customer_name,
        customer_email: row.customer_email,
        customer_phone: row.customer_phone,
        amount: row.amount,
        status: row.status,
        booked_time: row.booked_time,
        service_name: row.service_name,
        meet_link: row.meet_link,
      });
    }

    const days: DayBookings[] = [];
    const cursor = new Date(firstDay);
    while (cursor <= lastDay) {
      const dateStr = cursor.toISOString().split('T')[0];
      const dayBookings = bookingsByDate.get(dateStr) ?? [];
      days.push({
        date: dateStr,
        count: dayBookings.length,
        bookings: dayBookings,
      });
      cursor.setUTCDate(cursor.getUTCDate() + 1);
    }

    return Response.json({ ok: true, days });
  } catch (error) {
    return jsonAdminError(error, 'Failed to load calendar data');
  }
}
