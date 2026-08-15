import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { requireAdmin, jsonAdminError } from '@/lib/admin-auth';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { supabase } = await requireAdmin(request, 'read');

    const url = request.nextUrl;
    const page = Math.max(1, Number(url.searchParams.get('page') ?? '1'));
    const pageSize = Math.min(100, Math.max(1, Number(url.searchParams.get('pageSize') ?? '25')));
    const status = url.searchParams.get('status') ?? 'all';
    const dateFrom = url.searchParams.get('from') ?? '';
    const dateTo = url.searchParams.get('to') ?? '';

    let query = supabase.from('whatsapp_log').select('*', { count: 'exact' }).order('created_at', { ascending: false });

    if (['pending', 'sent', 'delivered', 'failed', 'read'].includes(status)) query = query.eq('status', status);
    if (dateFrom) query = query.gte('created_at', dateFrom);
    if (dateTo) query = query.lte('created_at', dateTo);

    const from = (page - 1) * pageSize;
    const { data, error, count } = await query.range(from, from + pageSize - 1);

    if (error) throw error;

    return NextResponse.json({
      entries: data ?? [],
      pagination: { page, pageSize, total: count ?? 0, pages: Math.ceil((count ?? 0) / pageSize) },
    });
  } catch (error) {
    return jsonAdminError(error, 'Failed to load WhatsApp log');
  }
}
