import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { z } from 'zod';
import { requireAdmin, adminWriteClient, jsonAdminWriteError } from '@/lib/admin-auth';
import { createReportStub, completeReportGeneration } from '@/lib/generate-report';

export const dynamic = 'force-dynamic';

const paramsSchema = z.object({ reportId: z.string().uuid() });
const bodySchema = z.object({ sendEmail: z.boolean().optional() });

/** Creates a stub, then regenerates in the background. Respects sendEmail=false. */
export async function POST(request: NextRequest, { params }: { params: Promise<{ reportId: string }> }) {
  try {
    const context = await requireAdmin(request, 'update');
    const supabase = adminWriteClient(context);
    const { reportId } = paramsSchema.parse(await params);
    const body = bodySchema.parse(await request.json().catch(() => ({})));

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

    const skipDelivery = body.sendEmail === false;

    // Create stub (force=true overwrites existing row).
    const { report: stub } = await createReportStub(supabase, session, report.report_type as 'summary' | 'detailed', { force: true });

    // Fire background generation — not awaited.
    completeReportGeneration(supabase, session, report.report_type as 'summary' | 'detailed', stub.id, { skipDelivery })
      .catch((err) => console.error(`Background regeneration failed for report ${stub.id}:`, err));

    return NextResponse.json({
      report: stub,
      regenerated: true,
      generating: true,
      report_url: `${process.env.NEXT_PUBLIC_SITE_URL ?? 'https://www.denisawa.co.ke'}/business-health-checks/report/${stub.report_url_token}`,
    }, { status: 202 });
  } catch (error) {
    return jsonAdminWriteError(error, 'Failed to regenerate report');
  }
}
