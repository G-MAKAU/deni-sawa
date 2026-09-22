import { NextRequest } from 'next/server';
import { requireAdmin, jsonAdminError } from '@/lib/admin-auth';
import { dbQuery } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    await requireAdmin(request, 'read');
    
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page') || '1');
    const pageSize = parseInt(url.searchParams.get('pageSize') || '20');
    const search = url.searchParams.get('search') || '';
    const status = url.searchParams.get('status') || '';
    const serviceId = url.searchParams.get('service_id') || '';
    const dateFrom = url.searchParams.get('date_from') || '';
    const dateTo = url.searchParams.get('date_to') || '';
    
    const offset = (page - 1) * pageSize;
    
    // Build WHERE clause
    const conditions: string[] = [];
    const params: unknown[] = [];
    
    if (search) {
      conditions.push(`(
        b.reference LIKE ? OR 
        b.customer_name LIKE ? OR 
        b.customer_email LIKE ? OR 
        b.customer_phone LIKE ?
      )`);
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm, searchTerm, searchTerm);
    }
    
    if (status) {
      conditions.push('b.status = ?');
      params.push(status);
    }
    
    if (serviceId) {
      conditions.push('b.service_id = ?');
      params.push(parseInt(serviceId));
    }
    
    if (dateFrom) {
      conditions.push('b.created_at >= ?');
      params.push(dateFrom);
    }
    
    if (dateTo) {
      conditions.push('b.created_at <= ?');
      params.push(`${dateTo}T23:59:59Z`);
    }
    
    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    
    // Get total count
    const countResult = await dbQuery<{ total: number }[]>(
      `SELECT COUNT(*) as total FROM bookings b ${whereClause}`,
      params
    );
    const total = countResult[0]?.total || 0;
    
    // Get bookings with service info
    const bookings = await dbQuery(
      `SELECT 
        b.*,
        s.name as service_name,
        s.duration_minutes,
        p.mpesa_receipt,
        p.status as payment_status
      FROM bookings b
      LEFT JOIN services s ON b.service_id = s.id
      LEFT JOIN payments p ON b.reference = p.booking_reference
      ${whereClause}
      ORDER BY b.created_at DESC
      LIMIT ? OFFSET ?`,
      [...params, pageSize, offset]
    );
    
    // Get summary stats
    const stats = await dbQuery<{
      total_bookings: number;
      pending_payment: number;
      paid: number;
      booked: number;
      cancelled: number;
      total_revenue: number;
    }[]>(
      `SELECT 
        COUNT(*) as total_bookings,
        SUM(CASE WHEN status = 'pending_payment' THEN 1 ELSE 0 END) as pending_payment,
        SUM(CASE WHEN status = 'paid' THEN 1 ELSE 0 END) as paid,
        SUM(CASE WHEN status = 'booked' THEN 1 ELSE 0 END) as booked,
        SUM(CASE WHEN status = 'cancelled' THEN 1 ELSE 0 END) as cancelled,
        SUM(CASE WHEN status IN ('paid', 'booked') THEN amount ELSE 0 END) as total_revenue
      FROM bookings`
    );
    
    return Response.json({
      ok: true,
      bookings,
      stats: stats[0] || {
        total_bookings: 0,
        pending_payment: 0,
        paid: 0,
        booked: 0,
        cancelled: 0,
        total_revenue: 0
      },
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize)
      }
    });
  } catch (error) {
    return jsonAdminError(error, 'Failed to load bookings');
  }
}