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
    const search = url.searchParams.get('search')?.trim() ?? '';
    const checkId = url.searchParams.get('check_id') ?? '';
    const status = url.searchParams.get('status') ?? 'all';

    let query = supabase
      .from('health_check_sessions')
      .select('*, health_checks(name)', { count: 'exact' })
      .order('started_at', { ascending: false });

    if (search) {
      query = query.or(`full_name.ilike.%${search}%,email.ilike.%${search}%,business_name.ilike.%${search}%`);
    }
    if (checkId) {
      query = query.eq('health_check_id', checkId);
    }
    if (status === 'complete') query = query.eq('is_complete', true);
    if (status === 'incomplete') query = query.eq('is_complete', false);

    const from = (page - 1) * pageSize;
    const { data, error, count } = await query.range(from, from + pageSize - 1);

    if (error) throw error;

    const sessions: any[] = (data ?? []).map((row: Record<string, unknown>) => {
      const check = Array.isArray(row.health_checks) ? row.health_checks[0] : row.health_checks;
      return { ...row, check_name: (check as { name?: string } | undefined)?.name ?? '—' };
    });

    // Report counts for the page.
    const ids = sessions.map((s) => s.id);
    let reportCounts = new Map<string, number>();
    if (ids.length > 0) {
      const { data: reports } = await supabase.from('health_check_reports').select('session_id').in('session_id', ids);
      reportCounts = new Map<string, number>();
      (reports ?? []).forEach((r) => reportCounts.set(r.session_id, (reportCounts.get(r.session_id) ?? 0) + 1));
    }

    const withCounts = sessions.map((s) => ({ ...s, report_count: reportCounts.get(s.id) ?? 0 }));

    return NextResponse.json({
      sessions: withCounts,
      pagination: { page, pageSize, total: count ?? 0, pages: Math.ceil((count ?? 0) / pageSize) },
    });
  } catch (error) {
    return jsonAdminError(error, 'Failed to load sessions');
  }
}
