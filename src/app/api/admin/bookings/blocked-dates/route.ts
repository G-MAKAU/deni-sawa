import { NextRequest } from 'next/server';
import { requireAdmin, jsonAdminError } from '@/lib/admin-auth';
import { dbQuery } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    await requireAdmin(request, 'read');

    const blocked = await dbQuery(
      `SELECT id, blocked_date, reason, created_at FROM blocked_dates ORDER BY blocked_date ASC`
    );

    return Response.json({ ok: true, blocked_dates: blocked });
  } catch (error) {
    return jsonAdminError(error, 'Failed to load blocked dates');
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireAdmin(request, 'create');

    const body = await request.json();
    const { date, reason } = body;

    if (!date || typeof date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return Response.json(
        { ok: false, error: 'A valid date in YYYY-MM-DD format is required' },
        { status: 400 }
      );
    }

    const existing = await dbQuery(
      `SELECT id FROM blocked_dates WHERE blocked_date = ?`,
      [date]
    );

    if ((existing as any[]).length > 0) {
      return Response.json(
        { ok: false, error: 'This date is already blocked' },
        { status: 400 }
      );
    }

    const result = await dbQuery(
      `INSERT INTO blocked_dates (blocked_date, reason) VALUES (?, ?)`,
      [date, reason || null]
    );

    return Response.json({
      ok: true,
      message: 'Date blocked successfully',
      id: (result as any).insertId,
    });
  } catch (error) {
    return jsonAdminError(error, 'Failed to block date');
  }
}

export async function DELETE(request: NextRequest) {
  try {
    await requireAdmin(request, 'delete');

    const url = new URL(request.url);
    const id = url.searchParams.get('id');

    if (!id) {
      return Response.json(
        { ok: false, error: 'Blocked date ID is required' },
        { status: 400 }
      );
    }

    await dbQuery(`DELETE FROM blocked_dates WHERE id = ?`, [parseInt(id)]);

    return Response.json({ ok: true, message: 'Blocked date removed successfully' });
  } catch (error) {
    return jsonAdminError(error, 'Failed to remove blocked date');
  }
}

export async function PUT(request: NextRequest) {
  try {
    await requireAdmin(request, 'update');

    const body = await request.json();
    const { id, date, reason } = body;

    if (!id) {
      return Response.json({ ok: false, error: 'Blocked date ID is required' }, { status: 400 });
    }

    if (!date || typeof date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return Response.json({ ok: false, error: 'A valid date in YYYY-MM-DD format is required' }, { status: 400 });
    }

    const existing = await dbQuery(
      `SELECT id FROM blocked_dates WHERE blocked_date = ? AND id != ?`,
      [date, parseInt(id)]
    );

    if ((existing as any[]).length > 0) {
      return Response.json({ ok: false, error: 'This date is already blocked' }, { status: 400 });
    }

    await dbQuery(
      `UPDATE blocked_dates SET blocked_date = ?, reason = ? WHERE id = ?`,
      [date, reason || null, parseInt(id)]
    );

    return Response.json({ ok: true, message: 'Blocked date updated successfully' });
  } catch (error) {
    return jsonAdminError(error, 'Failed to update blocked date');
  }
}
