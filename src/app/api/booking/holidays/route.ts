import { NextRequest } from 'next/server';
import { dbQuery } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const date = url.searchParams.get('date');

    if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return Response.json(
        { ok: false, error: 'A valid date in YYYY-MM-DD format is required' },
        { status: 400 }
      );
    }

    // 1. Check exact match on holiday_date
    const exactMatch = await dbQuery<{ id: number; holiday_date: string; name: string; is_recurring: number }[]>(
      `SELECT id, holiday_date, name, is_recurring FROM holidays WHERE holiday_date = ? LIMIT 1`,
      [date]
    );

    if (exactMatch.length > 0) {
      return Response.json({ ok: true, isHoliday: true, name: exactMatch[0].name });
    }

    // 2. Check recurring holidays: month+day match where is_recurring = 1
    const month = date.substring(5, 7); // MM
    const day = date.substring(8, 10);  // DD
    const recurringMatch = await dbQuery<{ name: string }[]>(
      `SELECT name FROM holidays WHERE is_recurring = 1 AND MONTH(holiday_date) = ? AND DAY(holiday_date) = ? LIMIT 1`,
      [parseInt(month), parseInt(day)]
    );

    if (recurringMatch.length > 0) {
      return Response.json({ ok: true, isHoliday: true, name: recurringMatch[0].name });
    }

    return Response.json({ ok: true, isHoliday: false });
  } catch (error) {
    console.error('Failed to check holiday:', error);
    return Response.json(
      { ok: false, error: 'Failed to check holiday status' },
      { status: 500 }
    );
  }
}
