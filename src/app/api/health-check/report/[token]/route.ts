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
      .select(
        '*, session:health_check_sessions(full_name, business_name, health_check_id, whatsapp, report_selection, payment_status, payment_amount), checks:health_check_sessions!inner(health_checks(name, detailed_price, detailed_call_price))'
      )
      .eq('report_url_token', token)
      .maybeSingle();

    if (error) throw error;
    if (!report) return NextResponse.json({ error: 'Report not found.' }, { status: 404 });

    // Block access to expired reports (summary = 30 days).
    if (report.expires_at && new Date(report.expires_at) < new Date()) {
      return NextResponse.json(
        {
          error: 'expired',
          message: 'This summary report has expired. Upgrade to the Full Report to keep your results for 12 months.',
          expires_at: report.expires_at,
          report_type: report.report_type,
        },
        { status: 410 },
      );
    }

    // Track access.
    await supabase.from('health_check_reports').update({ accessed_at: new Date().toISOString() }).eq('id', report.id);

    const session = Array.isArray(report.session) ? report.session[0] : report.session;
    const checks = Array.isArray(report.checks) ? report.checks : [];
    const check = (checks[0] as { health_checks?: { name?: string; detailed_price?: number | null; detailed_call_price?: number | null } } | undefined)?.health_checks;
    const checkName = check?.name ?? 'Health Check';

    // Header/Footer come live from the prompt template (health_check_report_prompts).
    const { data: prompt } = await supabase
      .from('health_check_report_prompts')
      .select('header_lexical, footer_lexical')
      .eq('health_check_id', (session as { health_check_id?: string } | undefined)?.health_check_id ?? '')
      .eq('report_type', report.report_type)
      .maybeSingle();

    return NextResponse.json({
      report: {
        id: report.id,
        session_id: report.session_id,
        report_type: report.report_type,
        lexical_state: report.lexical_state,
        header_lexical: (prompt as { header_lexical?: unknown } | null)?.header_lexical ?? null,
        footer_lexical: (prompt as { footer_lexical?: unknown } | null)?.footer_lexical ?? null,
        is_paid: report.is_paid,
        delivery_status: report.delivery_status,
        model_used: report.model_used,
        generation_error: report.generation_error,
        created_at: report.created_at,
        expires_at: report.expires_at ?? null,
        session_name: (session as { full_name?: string } | undefined)?.full_name ?? 'Guest',
        check_name: checkName,
        // Payment / upgrade info for the summary → paid-upgrade flow.
        session_whatsapp: (session as { whatsapp?: string | null } | undefined)?.whatsapp ?? null,
        report_selection: (session as { report_selection?: string | null } | undefined)?.report_selection ?? 'summary',
        payment_status: (session as { payment_status?: string | null } | undefined)?.payment_status ?? 'none',
        payment_amount: Number((session as { payment_amount?: number | null } | undefined)?.payment_amount ?? 0),
        detailed_price: Number(check?.detailed_price ?? 0),
        detailed_call_price: Number(check?.detailed_call_price ?? 0),
      },
    });
  } catch (error) {
    console.error('Failed to load report:', error);
    return NextResponse.json({ error: 'Failed to load report.' }, { status: 500 });
  }
}
