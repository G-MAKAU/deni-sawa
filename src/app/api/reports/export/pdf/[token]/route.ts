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

    const model = lexicalStateToModel(report.lexical_state, checkType, title);

    const buffer = await renderToBuffer(HealthReportDocument({ model }));

    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'attachment; filename="deni-sawa-health-report.pdf"',
        'Cache-Control': 'no-store',
      },
    });
  } catch (error) {
    console.error('PDF export failed:', error);
    return NextResponse.json({ error: 'PDF generation failed.' }, { status: 500 });
  }
}
