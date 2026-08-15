import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { requireAdmin, jsonAdminError } from '@/lib/admin-auth';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { supabase } = await requireAdmin(request, 'read');

    const url = request.nextUrl;
    const page = Math.max(1, Number(url.searchParams.get('page') ?? '1'));
    const pageSize = Math.min(100, Math.max(1, Number(url.searchParams.get('pageSize') ?? '20')));
    const reportType = url.searchParams.get('report_type') ?? 'all';
    const delivery = url.searchParams.get('delivery') ?? 'all';

    let query = supabase
      .from('health_check_reports')
      .select('*, session:health_check_sessions(full_name, health_check_id, business_name), checks:health_check_sessions!inner(health_checks(name))', {
        count: 'exact',
      })
      .order('created_at', { ascending: false });

    if (reportType === 'summary' || reportType === 'detailed') query = query.eq('report_type', reportType);
    if (delivery === 'sent' || delivery === 'failed' || delivery === 'pending' || delivery === 'skipped') query = query.eq('delivery_status', delivery);

    const from = (page - 1) * pageSize;
    const { data, error, count } = await query.range(from, from + pageSize - 1);

    if (error) throw error;

    const reports = (data ?? []).map((row: Record<string, unknown>) => {
      const session = Array.isArray(row.session) ? row.session[0] : row.session;
      const checks = Array.isArray(row.checks) ? row.checks : [];
      const checkRow = checks[0];
      const checkName = (checkRow as { health_checks?: { name?: string } })?.health_checks?.name;
      return {
        ...row,
        session_name: (session as { full_name?: string } | undefined)?.full_name ?? '—',
        check_name: checkName ?? '—',
      };
    });

    return NextResponse.json({
      reports,
      pagination: { page, pageSize, total: count ?? 0, pages: Math.ceil((count ?? 0) / pageSize) },
    });
  } catch (error) {
    return jsonAdminError(error, 'Failed to load reports');
  }
}
