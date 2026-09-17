import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { z } from 'zod';
import { requireAdmin, adminWriteClient } from '@/lib/admin-auth';

export const dynamic = 'force-dynamic';

const querySchema = z.object({
  receipt: z.string().optional(),
  phone: z.string().optional(),
  session_id: z.string().uuid().optional(),
  health_check_id: z.string().uuid().optional(),
  status: z.enum(['pending', 'success', 'failed', 'timeout']).optional(),
  from: z.string().optional(), // ISO date
  to: z.string().optional(),   // ISO date
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(50),
});

/**
 * Admin-only endpoint to look up M-Pesa payment records with summary stats,
 * health check filtering, and date range support.
 */
export async function GET(request: NextRequest) {
  try {
    const context = await requireAdmin(request, 'read');
    const supabase = adminWriteClient(context);

    const params = Object.fromEntries(request.nextUrl.searchParams);
    const parsed = querySchema.safeParse(params);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid query', details: parsed.error.flatten() }, { status: 422 });
    }

    const { receipt, phone, session_id, health_check_id, status, from, to, page, pageSize } = parsed.data;

    // Build the summary query (all matching rows, not paginated).
    let summaryQuery = supabase
      .from('mpesa_payments')
      .select('id, amount, status, created_at, session:health_check_sessions(id, health_check_id, full_name, business_name, check_name)', { count: 'exact' });

    if (receipt) summaryQuery = summaryQuery.ilike('mpesa_receipt', `%${receipt}%`);
    if (phone) summaryQuery = summaryQuery.ilike('phone_number', `%${phone.replace(/\D/g, '')}%`);
    if (session_id) summaryQuery = summaryQuery.eq('session_id', session_id);
    if (status) summaryQuery = summaryQuery.eq('status', status);
    if (from) summaryQuery = summaryQuery.gte('created_at', from);
    if (to) summaryQuery = summaryQuery.lte('created_at', to);

    // Filter by health check via the session relation.
    if (health_check_id) {
      // We'll filter after fetch since PostgREST doesn't support filtering on joined tables.
    }

    const { data: allPayments, error: fetchError, count } = await summaryQuery.order('created_at', { ascending: false });
    if (fetchError) throw fetchError;

    // Apply health check filter in JS if needed (PostgREST can't filter on joins).
    let filtered = allPayments ?? [];
    if (health_check_id && filtered.length > 0) {
      filtered = filtered.filter((p) => {
        const sess = p.session as { health_check_id?: string } | null;
        return sess?.health_check_id === health_check_id;
      });
    }

    // Compute summary stats from the FULL filtered set (not paginated).
    const totalAmount = filtered.reduce((sum, p) => sum + Number(p.amount ?? 0), 0);
    const successCount = filtered.filter((p) => p.status === 'success').length;
    const failedCount = filtered.filter((p) => p.status === 'failed').length;
    const pendingCount = filtered.filter((p) => p.status === 'pending').length;
    const successAmount = filtered
      .filter((p) => p.status === 'success')
      .reduce((sum, p) => sum + Number(p.amount ?? 0), 0);

    // Breakdown by health check name.
    const byCheck: Record<string, { count: number; amount: number }> = {};
    for (const p of filtered) {
      const sess = p.session as { check_name?: string; health_check_id?: string } | null;
      const name = sess?.check_name ?? 'Unknown';
      if (!byCheck[name]) byCheck[name] = { count: 0, amount: 0 };
      byCheck[name].count += 1;
      byCheck[name].amount += Number(p.amount ?? 0);
    }

    // Paginated results.
    const fromIdx = (page - 1) * pageSize;
    const paginated = filtered.slice(fromIdx, fromIdx + pageSize);

    return NextResponse.json({
      payments: paginated,
      summary: {
        total: filtered.length,
        totalAmount,
        successCount,
        failedCount,
        pendingCount,
        successAmount,
        byCheck: Object.entries(byCheck)
          .map(([name, v]) => ({ name, count: v.count, amount: v.amount }))
          .sort((a, b) => b.amount - a.amount),
      },
      pagination: {
        page,
        pageSize,
        total: filtered.length,
        pages: Math.ceil(filtered.length / pageSize),
      },
    });
  } catch (error) {
    console.error('Payment lookup failed:', error);
    const detail = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: `Payment lookup failed: ${detail}` }, { status: 500 });
  }
}
