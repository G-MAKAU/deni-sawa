import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getServiceClient } from '@/lib/supabase/service';

export const dynamic = 'force-dynamic';

/** Public report fetch by unguessable token — the token IS the access control. */
export async function GET(_request: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  try {
    const { token } = await params;
    const supabase = getServiceClient();

    const { data: report, error } = await supabase
      .from('health_check_reports')
      .select('*, session:health_check_sessions(full_name, business_name, health_check_id), checks:health_check_sessions!inner(health_checks(name))')
      .eq('report_url_token', token)
      .maybeSingle();

    if (error) throw error;
    if (!report) return NextResponse.json({ error: 'Report not found.' }, { status: 404 });

    // Track access.
    await supabase.from('health_check_reports').update({ accessed_at: new Date().toISOString() }).eq('id', report.id);

    const session = Array.isArray(report.session) ? report.session[0] : report.session;
    const checks = Array.isArray(report.checks) ? report.checks : [];
    const checkName = (checks[0] as { health_checks?: { name?: string } } | undefined)?.health_checks?.name ?? 'Health Check';

    return NextResponse.json({
      report: {
        id: report.id,
        session_id: report.session_id,
        report_type: report.report_type,
        lexical_state: report.lexical_state,
        is_paid: report.is_paid,
        delivery_status: report.delivery_status,
        created_at: report.created_at,
        session_name: (session as { full_name?: string } | undefined)?.full_name ?? 'Guest',
        check_name: checkName,
      },
    });
  } catch (error) {
    console.error('Failed to load report:', error);
    return NextResponse.json({ error: 'Failed to load report.' }, { status: 500 });
  }
}
