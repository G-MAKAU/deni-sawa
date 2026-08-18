import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { z } from 'zod';
import { requireAdmin, adminWriteClient, jsonAdminWriteError } from '@/lib/admin-auth';
import { runReportGeneration } from '@/lib/generate-report';

export const dynamic = 'force-dynamic';
export const maxDuration = 120;

const paramsSchema = z.object({ reportId: z.string().uuid() });

/** Regenerates a report (Claude + delivery) and updates it in place. */
export async function POST(request: NextRequest, { params }: { params: Promise<{ reportId: string }> }) {
  try {
    const context = await requireAdmin(request, 'update');
    const supabase = adminWriteClient(context);
    const { reportId } = paramsSchema.parse(await params);

    const { data: report } = await supabase.from('health_check_reports').select('*').eq('id', reportId).maybeSingle();
    if (!report) return NextResponse.json({ error: 'Report not found.' }, { status: 404 });

    const { data: session } = await supabase
      .from('health_check_sessions')
      .select('id, health_check_id, full_name, business_name, email, whatsapp, preferred_delivery, is_complete')
      .eq('id', report.session_id)
      .maybeSingle();
    if (!session) return NextResponse.json({ error: 'Session not found.' }, { status: 404 });
    if (!session.is_complete) {
      return NextResponse.json({ error: 'Session is not complete.' }, { status: 422 });
    }

    const result = await runReportGeneration(supabase, session, report.report_type as 'summary' | 'detailed', { force: true });

    return NextResponse.json({
      report: result.report,
      regenerated: true,
      report_url: `${process.env.NEXT_PUBLIC_SITE_URL ?? 'https://denisawa.co.ke'}/business-health-checks/report/${result.report.report_url_token}`,
    });
  } catch (error) {
    return jsonAdminWriteError(error, 'Failed to regenerate report');
  }
}
