import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { z } from 'zod';
import { requireAdmin, adminReadClient } from '@/lib/admin-auth';

export const dynamic = 'force-dynamic';

const paramsSchema = z.object({ reportId: z.string().uuid() });

/** Polls the generation status of a report. Returns status + report data when complete. */
export async function GET(request: NextRequest, { params }: { params: Promise<{ reportId: string }> }) {
  try {
    await requireAdmin(request, 'read');
    const { reportId } = paramsSchema.parse(await params);

    const supabase = adminReadClient();
    const { data, error } = await supabase
      .from('health_check_reports')
      .select('id, generation_status, report_url_token, lexical_state, model_used, tokens_used, generation_seconds, generation_error')
      .eq('id', reportId)
      .maybeSingle();

    if (error || !data) {
      return NextResponse.json({ error: 'Report not found.' }, { status: 404 });
    }

    const status = (data.generation_status as string) ?? 'completed';

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
