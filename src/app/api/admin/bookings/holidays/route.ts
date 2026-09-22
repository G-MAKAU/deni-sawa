import { NextRequest } from 'next/server';
import { requireAdmin, jsonAdminError } from '@/lib/admin-auth';
import { dbQuery } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    await requireAdmin(request, 'read');

    const holidays = await dbQuery(
      `SELECT id, holiday_date, name, is_recurring, created_at FROM holidays ORDER BY holiday_date ASC`
    );

    return Response.json({ ok: true, holidays });
  } catch (error) {
    return jsonAdminError(error, 'Failed to load holidays');
  }
}

export async function POST(request: NextRequest) {
  try {
    const ctx = await requireAdmin(request, 'create');

    const body = await request.json();
    const { date, name, is_recurring } = body;

    if (!date || typeof date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return Response.json(
        { ok: false, error: 'A valid date in YYYY-MM-DD format is required' },
        { status: 400 }
      );
    }

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return Response.json(
        { ok: false, error: 'A holiday name is required' },
        { status: 400 }
      );
    }

    const existing = await dbQuery(
      `SELECT id FROM holidays WHERE holiday_date = ?`,
      [date]
    );

    if ((existing as any[]).length > 0) {
      return Response.json(
        { ok: false, error: 'A holiday already exists for this date' },
        { status: 400 }
      );
    }

    const result = await dbQuery(
      `INSERT INTO holidays (holiday_date, name, is_recurring) VALUES (?, ?, ?)`,
      [date, name.trim(), is_recurring ? 1 : 0]
    );

    return Response.json({
      ok: true,
      message: 'Holiday added successfully',
      id: (result as any).insertId,
    });
  } catch (error) {
    return jsonAdminError(error, 'Failed to add holiday');
  }
}

export async function DELETE(request: NextRequest) {
  try {
    await requireAdmin(request, 'delete');

    const url = new URL(request.url);
    const id = url.searchParams.get('id');

    if (!id) {
      return Response.json(
        { ok: false, error: 'Holiday ID is required' },
        { status: 400 }
      );
    }

    await dbQuery(`DELETE FROM holidays WHERE id = ?`, [parseInt(id)]);

    return Response.json({ ok: true, message: 'Holiday deleted successfully' });
  } catch (error) {
    return jsonAdminError(error, 'Failed to delete holiday');
  }
}

export async function PUT(request: NextRequest) {
  try {
    await requireAdmin(request, 'update');

    const body = await request.json();
    const { id, date, name, is_recurring } = body;

    if (!id) {
      return Response.json({ ok: false, error: 'Holiday ID is required' }, { status: 400 });
    }

    if (!date || typeof date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return Response.json({ ok: false, error: 'A valid date in YYYY-MM-DD format is required' }, { status: 400 });
    }

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return Response.json({ ok: false, error: 'A holiday name is required' }, { status: 400 });
    }

    const existing = await dbQuery(
      `SELECT id FROM holidays WHERE holiday_date = ? AND id != ?`,
      [date, parseInt(id)]
    );

    if ((existing as any[]).length > 0) {
      return Response.json({ ok: false, error: 'A holiday already exists for this date' }, { status: 400 });
    }

    await dbQuery(
      `UPDATE holidays SET holiday_date = ?, name = ?, is_recurring = ? WHERE id = ?`,
      [date, name.trim(), is_recurring ? 1 : 0, parseInt(id)]
    );

    return Response.json({ ok: true, message: 'Holiday updated successfully' });
  } catch (error) {
    return jsonAdminError(error, 'Failed to update holiday');
  }
}
