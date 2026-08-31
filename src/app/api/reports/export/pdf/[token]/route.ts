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
      .select('*, session:health_check_sessions(full_name, business_name, health_check_id)')
      .eq('report_url_token', token)
      .maybeSingle();

    if (error) throw error;
    if (!report) return NextResponse.json({ error: 'Report not found.' }, { status: 404 });

    if (!report.lexical_state) {
      return NextResponse.json({ error: 'Report has no content to export.' }, { status: 400 });
    }

    const session = Array.isArray(report.session) ? report.session[0] : report.session;
    const healthCheckId = (session as { health_check_id?: string } | undefined)?.health_check_id ?? '';

    let checkType = 'business';
    let title = 'Health Check Report';
    if (healthCheckId) {
      const { data: hc } = await supabase
        .from('health_checks')
        .select('slug, name')
        .eq('id', healthCheckId)
        .maybeSingle();
      if (hc) {
        checkType = (hc as { slug?: string })?.slug?.startsWith('professional') ? 'professional' : 'business';
        title = (hc as { name?: string })?.name ?? title;
      }
    }

    const { data: prompt } = await supabase
      .from('health_check_report_prompts')
      .select('header_lexical, footer_lexical')
      .eq('health_check_id', healthCheckId)
      .eq('report_type', report.report_type)
      .maybeSingle();

    let model;
    try {
      model = lexicalStateToModel(
        report.lexical_state,
        checkType,
        title,
        (prompt as { header_lexical?: unknown } | null)?.header_lexical as Record<string, unknown> | string | null | undefined,
        (prompt as { footer_lexical?: unknown } | null)?.footer_lexical as Record<string, unknown> | string | null | undefined
      );
    } catch (modelError) {
      console.error('PDF model conversion failed:', modelError);
      return NextResponse.json({ error: 'Failed to process report content for PDF.' }, { status: 500 });
    }

    let buffer: Buffer;
    try {
      buffer = await renderToBuffer(HealthReportDocument({ model }));
    } catch (renderError) {
      console.error('PDF render failed:', renderError);
      const detail = renderError instanceof Error ? renderError.message : String(renderError);

      // Diagnostic: search raw lexical_state for the offending number
      const stateStr = JSON.stringify(report.lexical_state);
      const numMatch = stateStr.match(/-?2\.1773591117569993e\+?21/);
      let context = 'not found in raw state';
      if (numMatch && numMatch.index !== undefined) {
        const start = Math.max(0, numMatch.index - 80);
        const end = Math.min(stateStr.length, numMatch.index + numMatch[0].length + 80);
        context = stateStr.slice(start, end);
      }

      // Also search the serialized model
      const modelStr = JSON.stringify(model);
      const modelMatch = modelStr.match(/-?2\.1773591117569993e\+?21/);
      let modelContext = 'not found in model';
      if (modelMatch && modelMatch.index !== undefined) {
        const start = Math.max(0, modelMatch.index - 80);
        const end = Math.min(modelStr.length, modelMatch.index + modelMatch[0].length + 80);
        modelContext = modelStr.slice(start, end);
      }

      return NextResponse.json({ error: 'Failed to render PDF.', detail, stateContext: context, modelContext }, { status: 500 });
    }

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
    const detail = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: 'PDF generation failed.', detail }, { status: 500 });
  }
}
