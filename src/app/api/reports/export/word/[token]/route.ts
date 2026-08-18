import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { Packer } from 'docx';
import { getServiceClient } from '@/lib/supabase/service';
import { lexicalStateToDocx } from '@/lib/lexical-to-docx';

export const maxDuration = 60;

/** Exports a report to a branded Word document by its unguessable token. */
export async function POST(_request: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  try {
    const { token } = await params;
    const supabase = getServiceClient();

    const { data: report, error } = await supabase
      .from('health_check_reports')
      .select('*, session:health_check_sessions(*), checks:health_check_sessions!inner(health_checks(name))')
      .eq('report_url_token', token)
      .maybeSingle();

    if (error) throw error;
    if (!report) return NextResponse.json({ error: 'Report not found.' }, { status: 404 });

    const checks = Array.isArray(report.checks) ? report.checks : [];
    const check = (checks[0] as { health_checks?: { name?: string } } | undefined)?.health_checks;
    const title = check?.name ?? 'Health Check Report';

    const session = Array.isArray(report.session) ? report.session[0] : report.session;
    const { data: prompt } = await supabase
      .from('health_check_report_prompts')
      .select('header_lexical, footer_lexical')
      .eq('health_check_id', (session as { health_check_id?: string } | undefined)?.health_check_id ?? '')
      .eq('report_type', report.report_type)
      .maybeSingle();

    const document = lexicalStateToDocx(
      report.lexical_state,
      title,
      (prompt as { header_lexical?: unknown } | null)?.header_lexical as Record<string, unknown> | null | undefined,
      (prompt as { footer_lexical?: unknown } | null)?.footer_lexical as Record<string, unknown> | null | undefined
    );
    const buffer = await Packer.toBuffer(document);

    // Filename = "<business> - <full name>" (falls back to a generic name).
    const business = (session as { business_name?: string | null } | undefined)?.business_name ?? '';
    const fullName = (session as { full_name?: string | null } | undefined)?.full_name ?? '';
    const fileBase = [business, fullName].filter(Boolean).join(' - ') || 'deni-sawa-health-report';
    const fileName = `${fileBase.replace(/[^\w\- ]+/g, '').replace(/\s+/g, ' ').trim()}.docx`;

    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'Content-Disposition': `attachment; filename="${fileName}"`,
        'Cache-Control': 'no-store',
      },
    });
  } catch (error) {
    console.error('Word export failed:', error);
    return NextResponse.json({ error: 'Word generation failed.' }, { status: 500 });
  }
}
