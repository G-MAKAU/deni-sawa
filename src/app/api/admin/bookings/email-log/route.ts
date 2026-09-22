import { NextRequest } from 'next/server';
import { requireAdmin, jsonAdminError } from '@/lib/admin-auth';
import { dbQuery } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    await requireAdmin(request, 'read');

    const url = new URL(request.url);
    const page = Math.max(1, parseInt(url.searchParams.get('page') || '1'));
    const pageSize = Math.min(100, Math.max(1, parseInt(url.searchParams.get('pageSize') || '25')));
    const status = url.searchParams.get('status') || 'all';
    const emailType = url.searchParams.get('type') || 'all';
    const search = url.searchParams.get('search') || '';
    const dateFrom = url.searchParams.get('from') || '';
    const dateTo = url.searchParams.get('to') || '';
    const offset = (page - 1) * pageSize;

    const conditions: string[] = [];
    const params: unknown[] = [];

    if (status !== 'all') {
      conditions.push('e.status = ?');
      params.push(status);
    }
    if (emailType !== 'all') {
      conditions.push('e.email_type = ?');
      params.push(emailType);
    }
    if (search) {
      conditions.push('(e.booking_reference LIKE ? OR e.recipient_email LIKE ? OR e.subject LIKE ?)');
      const term = `%${search}%`;
      params.push(term, term, term);
    }
    if (dateFrom) {
      conditions.push('e.sent_at >= ?');
      params.push(dateFrom);
    }
    if (dateTo) {
      conditions.push('e.sent_at <= ?');
      params.push(`${dateTo}T23:59:59`);
    }

    const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const countResult = await dbQuery<{ total: number }[]>(
      `SELECT COUNT(*) as total FROM email_logs e ${where}`,
      params
    );
    const total = countResult[0]?.total || 0;

    const entries = await dbQuery(
      `SELECT
        e.id,
        e.booking_reference,
        e.email_type,
        e.subject,
        e.recipient_email,
        e.sent_at,
        e.status,
        e.error_message,
        b.customer_name,
        b.customer_phone,
        s.name as service_name
      FROM email_logs e
      LEFT JOIN bookings b ON e.booking_reference = b.reference
      LEFT JOIN services s ON b.service_id = s.id
      ${where}
      ORDER BY e.sent_at DESC
      LIMIT ? OFFSET ?`,
      [...params, pageSize, offset]
    );

    return Response.json({
      entries: entries ?? [],
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    });
  } catch (error) {
    return jsonAdminError(error, 'Failed to load booking email log');
  }
}
