import { NextRequest } from 'next/server';
import { dbQuery } from '@/lib/db';
import { getCalendarBusyTimes, type BusyBlock } from '@/lib/google-calendar';

export const dynamic = 'force-dynamic';

interface Slot {
  time: string;
  available: boolean;
}

interface SlotsResponse {
  ok: boolean;
  date: string;
  slots: Slot[];
  holiday?: string;
  blocked?: boolean;
  blockedReason?: string;
  weekend?: boolean;
}

function slotsOverlap(slotStart: string, slotEnd: string, busyStart: string, busyEnd: string): boolean {
  return slotStart < busyEnd && slotEnd > busyStart;
}

function timeToMinutes(t: string): number {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
}

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ reference: string }> }
): Promise<Response> {
  const { reference } = await context.params;
  const date = req.nextUrl.searchParams.get('date');

  if (!reference || reference.length > 36) {
    return Response.json({ ok: false, error: 'Invalid reference.' }, { status: 400 });
  }
  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return Response.json({ ok: false, error: 'Please provide a valid date (YYYY-MM-DD).' }, { status: 400 });
  }

  try {
    const bkRows = await dbQuery<Array<{ id: number; status: string }>>(
      'SELECT id, status FROM bookings WHERE reference = ?',
      [reference]
    );

    if (bkRows.length === 0) {
      return Response.json({ ok: false, error: 'Booking not found.' }, { status: 404 });
    }
    if (bkRows[0].status !== 'paid' && bkRows[0].status !== 'booked') {
      return Response.json({ ok: false, error: 'Booking must be paid before selecting a slot.' }, { status: 400 });
    }

    const dateObj = new Date(`${date}T12:00:00Z`);
    const dayOfWeek = dateObj.getUTCDay();

    // Weekend check
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      return Response.json({
        ok: true,
        date,
        slots: [],
        weekend: true,
      } satisfies SlotsResponse, { status: 200 });
    }

    // Holiday check (exact date + recurring)
    const holidayRows = await dbQuery<Array<{ name: string }>>(
      `SELECT name FROM holidays WHERE holiday_date = ?
       UNION
       SELECT name FROM holidays WHERE is_recurring = 1 AND MONTH(holiday_date) = MONTH(?) AND DAY(holiday_date) = DAY(?)`,
      [date, date, date]
    );

    if (holidayRows.length > 0) {
      return Response.json({
        ok: true,
        date,
        slots: [],
        holiday: holidayRows[0].name,
      } satisfies SlotsResponse, { status: 200 });
    }

    // Blocked date check
    const blockedRows = await dbQuery<Array<{ reason: string | null }>>(
      'SELECT reason FROM blocked_dates WHERE blocked_date = ?',
      [date]
    );

    if (blockedRows.length > 0) {
      return Response.json({
        ok: true,
        date,
        slots: [],
        blocked: true,
        blockedReason: blockedRows[0].reason ?? undefined,
      } satisfies SlotsResponse, { status: 200 });
    }

    // Generate 1-hour slots: 8:00–16:00, skip 13:00 (lunch)
    const allSlots: string[] = [];
    for (let h = 8; h <= 16; h++) {
      if (h === 13) continue;
      allSlots.push(`${String(h).padStart(2, '0')}:00`);
    }

    // DB bookings conflict check
    const bookedRows = await dbQuery<Array<{ booked_time: string }>>(
      `SELECT booked_time FROM bookings WHERE booked_date = ? AND status = 'booked' AND booked_time IS NOT NULL`,
      [date]
    );

    const bookedTimes = new Set(
      bookedRows.map((r) => {
        const t = r.booked_time;
        return t.length > 5 ? t.slice(0, 5) : t;
      })
    );

    // Google Calendar busy check
    let busyBlocks: BusyBlock[] = [];
    try {
      busyBlocks = await getCalendarBusyTimes(date);
    } catch {
      // Graceful: proceed without calendar data
    }

    const slots: Slot[] = allSlots.map((time) => {
      if (bookedTimes.has(time)) {
        return { time, available: false };
      }

      const slotStartMin = timeToMinutes(time);
      const slotEndMin = slotStartMin + 60;

      for (const block of busyBlocks) {
        const busyStartMin = timeToMinutes(block.start);
        const busyEndMin = timeToMinutes(block.end);
        if (slotsOverlap(
          String(slotStartMin).padStart(3, '0'),
          String(slotEndMin).padStart(3, '0'),
          String(busyStartMin).padStart(3, '0'),
          String(busyEndMin).padStart(3, '0')
        )) {
          return { time, available: false };
        }
      }

      return { time, available: true };
    });

    return Response.json({ ok: true, date, slots } satisfies SlotsResponse, { status: 200 });
  } catch (err) {
    console.error('booking/slots: error:', err);
    return Response.json({ ok: false, error: 'Internal server error.' }, { status: 500 });
  }
}
