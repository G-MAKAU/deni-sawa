import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { z } from 'zod';
import { requireAdmin, adminWriteClient, jsonAdminWriteError } from '@/lib/admin-auth';
import { createReportStub, completeReportGeneration } from '@/lib/generate-report';

export const dynamic = 'force-dynamic';

const paramsSchema = z.object({ sessionId: z.string().uuid() });
const bodySchema = z.object({ report_type: z.enum(['summary', 'detailed']).default('summary') });

/** Creates a report stub immediately, then generates in the background. */
export async function POST(request: NextRequest, { params }: { params: Promise<{ sessionId: string }> }) {
  try {
    const context = await requireAdmin(request, 'create');
    const supabase = adminWriteClient(context);
    const { sessionId } = paramsSchema.parse(await params);

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
    }
    const parsed = bodySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Validation failed', details: parsed.error.flatten() }, { status: 422 });
    }

    const { data: session } = await supabase
      .from('health_check_sessions')
      .select('id, health_check_id, full_name, business_name, email, whatsapp, preferred_delivery, is_complete, report_selection, payment_status')
      .eq('id', sessionId)
      .maybeSingle();
    if (!session) return NextResponse.json({ error: 'Session not found.' }, { status: 404 });
    if (!session.is_complete) {
      return NextResponse.json({ error: 'Session is not complete.' }, { status: 422 });
    }

    const selection = (session.report_selection as 'summary' | 'detailed' | 'detailed_call' | null | undefined) ?? 'summary';
    const paidSelection = selection === 'detailed' || selection === 'detailed_call';
    const paid = session.payment_status === 'paid';
    const skipDelivery = paidSelection && !paid;

    // Create stub immediately — returns in <100ms.
    const { report, alreadyComplete } = await createReportStub(supabase, session, parsed.data.report_type);

    if (alreadyComplete) {
      return NextResponse.json({
        report,
        regenerated: false,
        generating: false,
        report_url: `${process.env.NEXT_PUBLIC_SITE_URL ?? 'https://www.denisawa.co.ke'}/business-health-checks/report/${report.report_url_token}`,
      });
    }

    // Fire background generation — not awaited, won't block the response.
    completeReportGeneration(supabase, session, parsed.data.report_type, report.id, { skipDelivery })
      .catch((err) => console.error(`Background generation failed for report ${report.id}:`, err));

    return NextResponse.json({
      report,
      regenerated: true,
      generating: true,
      report_url: `${process.env.NEXT_PUBLIC_SITE_URL ?? 'https://www.denisawa.co.ke'}/business-health-checks/report/${report.report_url_token}`,
    }, { status: 202 });
  } catch (error) {
    return jsonAdminWriteError(error, 'Failed to generate report');
  }
}
