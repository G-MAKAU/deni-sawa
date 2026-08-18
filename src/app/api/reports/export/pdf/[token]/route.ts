import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { renderToBuffer } from '@react-pdf/renderer';
import { getServiceClient } from '@/lib/supabase/service';
import { lexicalStateToModel } from '@/features/health-check/lexical-to-model';
import { HealthReportDocument } from '@/features/health-check/pdf-document';

export const maxDuration = 60;

/** Exports a report to branded A4 PDF by its unguessable token. */
export async function POST(_request: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  try {
    const { token } = await params;
    const supabase = getServiceClient();

    const { data: report, error } = await supabase
      .from('health_check_reports')
      .select('*, session:health_check_sessions(*), checks:health_check_sessions!inner(health_checks(slug, name))')
      .eq('report_url_token', token)
      .maybeSingle();

    if (error) throw error;
    if (!report) return NextResponse.json({ error: 'Report not found.' }, { status: 404 });

    const checks = Array.isArray(report.checks) ? report.checks : [];
    const check = (checks[0] as { health_checks?: { slug?: string; name?: string } } | undefined)?.health_checks;
    const checkType = check?.slug?.startsWith('professional') ? 'professional' : 'business';
    const title = check?.name ?? 'Health Check Report';

    const session = Array.isArray(report.session) ? report.session[0] : report.session;
    const { data: prompt } = await supabase
      .from('health_check_report_prompts')
      .select('header_lexical, footer_lexical')
      .eq('health_check_id', (session as { health_check_id?: string } | undefined)?.health_check_id ?? '')
      .eq('report_type', report.report_type)
      .maybeSingle();

    const model = lexicalStateToModel(
      report.lexical_state,
      checkType,
      title,
      (prompt as { header_lexical?: unknown } | null)?.header_lexical as Record<string, unknown> | string | null | undefined,
      (prompt as { footer_lexical?: unknown } | null)?.footer_lexical as Record<string, unknown> | string | null | undefined
    );

    const buffer = await renderToBuffer(HealthReportDocument({ model }));

    // Filename = "<business> - <full name>" (falls back to a generic name).
    const business = (session as { business_name?: string | null } | undefined)?.business_name ?? '';
    const fullName = (session as { full_name?: string | null } | undefined)?.full_name ?? '';
    const fileBase = [business, fullName].filter(Boolean).join(' - ') || 'deni-sawa-health-report';
    const fileName = `${fileBase.replace(/[^\w\- ]+/g, '').replace(/\s+/g, ' ').trim()}.pdf`;

    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${fileName}"`,
        'Cache-Control': 'no-store',
      },
    });
  } catch (error) {
    console.error('PDF export failed:', error);
    return NextResponse.json({ error: 'PDF generation failed.' }, { status: 500 });
  }
}
