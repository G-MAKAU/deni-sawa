import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { z } from 'zod';
import { requireAdmin, adminWriteClient, jsonAdminWriteError } from '@/lib/admin-auth';
import { runReportGeneration } from '@/lib/generate-report';
import { deliverReportByEmail, deliverReportByWhatsApp } from '@/lib/delivery';
import { sendEmail, buildBrandedEmailHtml, resolveSiteUrl } from '@/lib/email';

export const dynamic = 'force-dynamic';
export const maxDuration = 120;

const paramsSchema = z.object({ reportId: z.string().uuid() });
const bodySchema = z.object({
  plan: z.enum(['detailed', 'detailed_call']).optional().default('detailed'),
  sendEmail: z.boolean().optional().default(true),
});

/**
 * Admin-initiated upgrade: generates a detailed report from a summary session,
 * marks it as paid, and delivers it. No payment required — the admin is
 * manually granting access.
 */
export async function POST(request: NextRequest, { params }: { params: Promise<{ reportId: string }> }) {
  try {
    const context = await requireAdmin(request, 'update');
    const supabase = adminWriteClient(context);
    const { reportId } = paramsSchema.parse(await params);
    const body = bodySchema.parse(await request.json().catch(() => ({})));

    // Load the summary report to get the session.
    const { data: report } = await supabase.from('health_check_reports').select('*').eq('id', reportId).maybeSingle();
    if (!report) return NextResponse.json({ error: 'Report not found.' }, { status: 404 });
    if (report.report_type !== 'summary') {
      return NextResponse.json({ error: 'Only summary reports can be upgraded.' }, { status: 422 });
    }

    const { data: session } = await supabase
      .from('health_check_sessions')
      .select('id, health_check_id, full_name, business_name, email, whatsapp, preferred_delivery, is_complete, payment_status')
      .eq('id', report.session_id)
      .maybeSingle();
    if (!session) return NextResponse.json({ error: 'Session not found.' }, { status: 404 });
    if (!session.is_complete) {
      return NextResponse.json({ error: 'Session is not complete.' }, { status: 422 });
    }

    // Get pricing for the record.
    const { data: check } = await supabase
      .from('health_checks')
      .select('name, detailed_price, detailed_call_price')
      .eq('id', session.health_check_id)
      .maybeSingle();
    const isCall = body.plan === 'detailed_call';
    const amount = isCall ? Number((check as { detailed_call_price?: number })?.detailed_call_price ?? 0) : Number((check as { detailed_price?: number })?.detailed_price ?? 0);

    // Update session: mark as paid for the selected plan.
    await supabase
      .from('health_check_sessions')
      .update({
        report_selection: body.plan,
        requires_call: isCall,
        payment_amount: amount,
        payment_status: 'paid',
        payment_reference: `ADMIN-${Date.now()}`,
      })
      .eq('id', session.id);

    // Generate the detailed report (delivers via email/WhatsApp).
    const result = await runReportGeneration(supabase, session, 'detailed');

    // Mark the report as paid.
    await supabase.from('health_check_reports').update({ is_paid: true }).eq('id', result.report.id);

    // Send a payment confirmation email if requested.
    if (body.sendEmail && session.email) {
      const siteUrl = resolveSiteUrl();
      const reportUrl = `${siteUrl}/business-health-checks/report/${result.report.report_url_token}`;
      const planLabel = isCall ? 'Full Report + Advisory Call' : 'Full Report';
      const checkName = (check as { name?: string })?.name ?? 'Health Check';

      const bodyHtml = `
        <h1>Your upgraded report is ready</h1>
        <p>Hi ${session.full_name},</p>
        <p>Great news! Your <strong>${checkName}</strong> has been upgraded to the <strong>${planLabel}</strong>.</p>
        <p>Your full diagnostic report is ready to view:</p>
        <p><a href="${reportUrl}" style="display:inline-block;background:#E8510A;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none;font-weight:bold;">View Your Report</a></p>
        ${isCall ? '<p>Our advisory team will contact you shortly via WhatsApp to schedule your call.</p>' : ''}
        <p>If you have any questions, reply to this email or reach us on WhatsApp at +254 702 448 601.</p>
      `;

      try {
        await sendEmail({
          to: session.email,
          subject: `Your ${checkName} report has been upgraded`,
          html: buildBrandedEmailHtml(bodyHtml),
        });
      } catch (error) {
        console.error('Admin upgrade confirmation email failed:', error);
      }
    }

    return NextResponse.json({
      ok: true,
      report: result.report,
      report_url: `${process.env.NEXT_PUBLIC_SITE_URL ?? 'https://www.denisawa.co.ke'}/business-health-checks/report/${result.report.report_url_token}`,
    });
  } catch (error) {
    return jsonAdminWriteError(error, 'Failed to upgrade report');
  }
}
