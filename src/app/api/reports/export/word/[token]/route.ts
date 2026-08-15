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

    const document = lexicalStateToDocx(report.lexical_state, title);
    const buffer = await Packer.toBuffer(document);

    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'Content-Disposition': 'attachment; filename="deni-sawa-health-report.docx"',
        'Cache-Control': 'no-store',
      },
    });
  } catch (error) {
    console.error('Word export failed:', error);
    return NextResponse.json({ error: 'Word generation failed.' }, { status: 500 });
  }
}
