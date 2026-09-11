import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { z } from 'zod';
import { getServiceClient } from '@/lib/supabase/service';
import { createReportStub, completeReportGeneration } from '@/lib/generate-report';
import { notifyReportFailed } from '@/lib/delivery';

const generateSchema = z.object({
  report_type: z.enum(['summary', 'detailed']).default('summary'),
});

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const parsed = generateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Validation failed', details: parsed.error.flatten() }, { status: 422 });
  }

  const supabase = getServiceClient();
  const { id: sessionId } = await params;

  const { data: session, error: sessionError } = await supabase
    .from('health_check_sessions')
    .select(
      'id, health_check_id, full_name, business_name, email, whatsapp, preferred_delivery, is_complete, report_selection, payment_status, payment_amount'
    )
    .eq('id', sessionId)
    .maybeSingle();

  if (sessionError) {
    return NextResponse.json({ error: 'Failed to load the session.' }, { status: 500 });
  }
  if (!session) return NextResponse.json({ error: 'Session not found.' }, { status: 404 });
  if (!session.is_complete) {
    return NextResponse.json({ error: 'Session must be completed before generating a report.' }, { status: 422 });
  }

  const selection = (session.report_selection as 'summary' | 'detailed' | 'detailed_call' | null | undefined) ?? 'summary';
  const reportType = selection === 'detailed' || selection === 'detailed_call' ? 'detailed' : parsed.data.report_type;

  const requiresPayment = reportType === 'detailed';
  const paid = session.payment_status === 'paid';
  const skipDelivery = requiresPayment && !paid;

  try {
    // Create stub immediately.
    const { report, alreadyComplete } = await createReportStub(supabase, session, reportType);

    if (alreadyComplete) {
      const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://www.denisawa.co.ke';
      return NextResponse.json({
        report_id: report.id,
        report_url_token: report.report_url_token,
        report_url: `${siteUrl}/business-health-checks/report/${report.report_url_token}`,
        report_type: reportType,
        generating: false,
        requires_payment: requiresPayment && !paid,
        payment_status: session.payment_status,
        payment_amount: requiresPayment ? Number(session.payment_amount ?? 0) : 0,
        session_id: sessionId,
      });
    }

    // Fire background generation — not awaited.
    completeReportGeneration(supabase, session, reportType, report.id, { skipDelivery })
      .catch(async (err) => {
        console.error(`Background generation failed for report ${report.id}:`, err);
        await notifyReportFailed(supabase, session);
      });

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://www.denisawa.co.ke';
    return NextResponse.json({
      report_id: report.id,
      report_url_token: report.report_url_token,
      report_url: `${siteUrl}/business-health-checks/report/${report.report_url_token}`,
      report_type: reportType,
      generating: true,
      requires_payment: requiresPayment && !paid,
      payment_status: session.payment_status,
      payment_amount: requiresPayment ? Number(session.payment_amount ?? 0) : 0,
      session_id: sessionId,
    }, { status: 202 });
  } catch (error) {
    console.error('Failed to generate report:', error);
    await notifyReportFailed(supabase, session);
    return NextResponse.json({ error: 'Failed to generate report.' }, { status: 500 });
  }
}
