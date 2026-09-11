import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { z } from 'zod';
import { requireAdmin, adminWriteClient } from '@/lib/admin-auth';
import { autoFailStaleGenerating } from '@/lib/generate-report';

export const dynamic = 'force-dynamic';

const paramsSchema = z.object({ reportId: z.string().uuid() });

/** Polls the generation status of a report. Returns status + report data when complete. */
export async function GET(request: NextRequest, { params }: { params: Promise<{ reportId: string }> }) {
  try {
    const context = await requireAdmin(request, 'read');
    const { reportId } = paramsSchema.parse(await params);

    const supabase = adminWriteClient(context);
    const { data, error } = await supabase
      .from('health_check_reports')
      .select('id, generation_status, report_url_token, lexical_state, model_used, tokens_used, generation_seconds, generation_error')
      .eq('id', reportId)
      .maybeSingle();

    if (error || !data) {
      return NextResponse.json({ error: 'Report not found.' }, { status: 404 });
    }

    let status = (data.generation_status as string) ?? 'completed';

    // If still generating, check if stale — if so, auto-fail and re-fetch.
    if (status === 'generating') {
      const fixed = await autoFailStaleGenerating(supabase, reportId);
      if (fixed) {
        const { data: refreshed } = await supabase
          .from('health_check_reports')
          .select('id, generation_status, report_url_token, lexical_state, model_used, tokens_used, generation_seconds, generation_error')
          .eq('id', reportId)
          .maybeSingle();
        if (refreshed) {
          return NextResponse.json({
            status: refreshed.generation_status ?? 'completed',
            report_url_token: refreshed.report_url_token,
            model_used: refreshed.model_used,
            tokens_used: refreshed.tokens_used,
            generation_seconds: refreshed.generation_seconds,
            generation_error: refreshed.generation_error,
            has_content: refreshed.lexical_state && Object.keys(refreshed.lexical_state as Record<string, unknown>).length > 0,
          });
        }
      }
    }

    return NextResponse.json({
      status,
      report_url_token: data.report_url_token,
      model_used: data.model_used,
      tokens_used: data.tokens_used,
      generation_seconds: data.generation_seconds,
      generation_error: data.generation_error,
      has_content: data.lexical_state && Object.keys(data.lexical_state as Record<string, unknown>).length > 0,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
