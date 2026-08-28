import type { SupabaseClient } from '@supabase/supabase-js';
import { deliverReportByEmail, deliverReportByWhatsApp } from '@/lib/delivery';
import { runReportGeneration } from '@/lib/generate-report';
import { sendEmail, buildBrandedEmailHtml, resolveSiteUrl } from '@/lib/email';
import { getWhatsAppConfig, decryptCredentials, sendWhatsAppMessage } from '@/lib/whatsapp';
import { site } from '@/data/site';

/**
 * Marks a session as paid and releases the report:
 *  - flips payment_status -> 'paid'
 *  - generates the detailed report (if not already generated)
 *  - delivers via the session's preferred channel
 *  - sends a payment confirmation email to the user
 *  - for the Detailed + Advisory Call option, notifies the admin + sends
 *    user a call-scheduling confirmation
 */
export async function markPaidAndDeliver(supabase: SupabaseClient, sessionId: string, reference: string): Promise<void> {
  const { data: session } = await supabase
    .from('health_check_sessions')
    .select(
      'id, full_name, business_name, email, whatsapp, preferred_delivery, report_selection, requires_call, admin_notified, payment_amount, payment_status, health_check_id'
    )
    .eq('id', sessionId)
    .maybeSingle();
  if (!session) throw new Error('Session not found.');

  if (session.payment_status === 'paid') return;

  await supabase
    .from('health_check_sessions')
    .update({ payment_status: 'paid', payment_reference: reference })
    .eq('id', sessionId);

  // Check if a detailed report already exists (e.g. from a direct paid flow).
  const { data: existingReport } = await supabase
    .from('health_check_reports')
    .select('id, report_url_token')
    .eq('session_id', sessionId)
    .eq('report_type', 'detailed')
    .maybeSingle();

  const delivery = (session.preferred_delivery ?? 'email') as 'email' | 'whatsapp' | 'both';
  let reportUrlToken: string | null = null;
  let reportId: string | null = null;

  if (existingReport) {
    // Report already generated — deliver it directly.
    reportId = existingReport.id;
    reportUrlToken = existingReport.report_url_token;
    if (delivery === 'email' || delivery === 'both') await deliverReportByEmail(supabase, existingReport.id);
    if (delivery === 'whatsapp' || delivery === 'both') await deliverReportByWhatsApp(supabase, existingReport.id);
  } else {
    // No report yet — generate now and deliver.
    const result = await runReportGeneration(supabase, session, 'detailed');
    reportId = result.report.id;
    reportUrlToken = result.report.report_url_token;
  }

  if (reportId) {
    await supabase.from('health_check_reports').update({ is_paid: true }).eq('id', reportId);
  }

  // Send payment confirmation email to the user.
  await sendPaymentConfirmation(supabase, session, reportUrlToken);

  // Detailed + Advisory Call → notify admin + confirm call to user.
  if (session.requires_call && !session.admin_notified) {
    await notifyAdminOfCall(supabase, session, reportUrlToken);
    await supabase.from('health_check_sessions').update({ admin_notified: true }).eq('id', sessionId);
    await sendCallScheduledEmail(session, reportUrlToken);
  }
}

async function sendPaymentConfirmation(
  supabase: SupabaseClient,
  session: {
    full_name: string;
    email: string | null;
    whatsapp: string | null;
    payment_amount: number | null;
    health_check_id: string;
    requires_call: boolean | null;
  },
  reportUrlToken: string | null
): Promise<void> {
  if (!session.email) return;

  const { data: check } = await supabase.from('health_checks').select('name').eq('id', session.health_check_id).maybeSingle();
  const checkName = (check as { name?: string } | null)?.name ?? 'Health Check';
  const siteUrl = resolveSiteUrl();
  const reportUrl = reportUrlToken ? `${siteUrl}/business-health-checks/report/${reportUrlToken}` : '';

  const planLabel = session.requires_call ? 'Full Report + Advisory Call' : 'Full Report';
  const bodyHtml = `
    <h1>Payment confirmed — your report is ready</h1>
    <p>Hi ${session.full_name},</p>
    <p>Thank you for your payment of <strong>KES ${Number(session.payment_amount ?? 0).toLocaleString()}</strong> for the <strong>${planLabel}</strong> of your ${checkName}.</p>
    <p>Your full diagnostic report has been generated and is ready to view:</p>
    <p><a href="${reportUrl}" style="display:inline-block;background:#E8510A;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none;font-weight:bold;">View Your Report</a></p>
    ${session.requires_call ? '<p>Our advisory team will contact you shortly via WhatsApp to schedule your call.</p>' : ''}
    <p>If you have any questions, reply to this email or reach us on WhatsApp at +254 702 448 601.</p>
  `;

  try {
    await sendEmail({
      to: session.email,
      subject: `Your ${checkName} report is ready`,
      html: buildBrandedEmailHtml(bodyHtml),
    });
  } catch (error) {
    console.error('Payment confirmation email failed:', error);
  }
}

async function sendCallScheduledEmail(
  session: {
    full_name: string;
    email: string | null;
    whatsapp: string | null;
    payment_amount: number | null;
    health_check_id: string;
  },
  reportUrlToken: string | null
): Promise<void> {
  if (!session.email) return;

  const siteUrl = resolveSiteUrl();
  const reportUrl = reportUrlToken ? `${siteUrl}/business-health-checks/report/${reportUrlToken}` : '';

  const bodyHtml = `
    <h1>Your advisory call is being scheduled</h1>
    <p>Hi ${session.full_name},</p>
    <p>Along with your full diagnostic report, you&apos;ve selected the <strong>Advisory Call</strong> option.</p>
    <p>One of our senior business advisors will contact you via WhatsApp at <strong>${session.whatsapp ?? 'the number on file'}</strong> within the next 24 hours to schedule your 30-minute session.</p>
    ${reportUrl ? `<p>In the meantime, you can review your report here: <a href="${reportUrl}">${reportUrl}</a></p>` : ''}
    <p>If you need to reschedule or have any questions, reply to this email or call us at +254 702 448 601.</p>
  `;

  try {
    await sendEmail({
      to: session.email,
      subject: 'Your advisory call is being scheduled',
      html: buildBrandedEmailHtml(bodyHtml),
    });
  } catch (error) {
    console.error('Call scheduled email failed:', error);
  }
}

async function notifyAdminOfCall(
  supabase: SupabaseClient,
  session: {
    full_name: string;
    email: string | null;
    whatsapp: string | null;
    payment_amount: number | null;
    health_check_id: string;
  },
  reportToken: string | null
): Promise<void> {
  const adminEmail = process.env.ADMIN_NOTIFY_EMAIL ?? site.email;
  const adminWhatsApp = process.env.ADMIN_NOTIFY_WHATSAPP;

  const { data: check } = await supabase.from('health_checks').select('name').eq('id', session.health_check_id).maybeSingle();
  const checkName = (check as { name?: string } | null)?.name ?? 'Health Check';
  const siteUrl = resolveSiteUrl();
  const reportUrl = reportToken ? `${siteUrl}/business-health-checks/report/${reportToken}` : 'not generated';

  const bodyHtml = `
    <h1>Advisory call requested</h1>
    <p>A client completed the <strong>${checkName}</strong> and selected the <strong>Detailed + Advisory Call</strong> option.</p>
    <ul>
      <li><strong>Name:</strong> ${session.full_name}</li>
      <li><strong>Email:</strong> ${session.email ?? 'Not provided'}</li>
      <li><strong>WhatsApp:</strong> ${session.whatsapp ?? 'Not provided'}</li>
      <li><strong>Paid amount:</strong> KES ${Number(session.payment_amount ?? 0).toLocaleString()}</li>
      <li><strong>Report:</strong> <a href="${reportUrl}">${reportUrl}</a></li>
    </ul>
    <p>Please reach out to schedule the advisory call.</p>
  `;

  if (adminEmail) {
    try {
      await sendEmail({
        to: adminEmail,
        subject: `Advisory call requested — ${checkName}`,
        html: buildBrandedEmailHtml(bodyHtml),
      });
    } catch (error) {
      console.error('Admin call-request email failed:', error);
    }
  }

  if (adminWhatsApp) {
    try {
      const config = await getWhatsAppConfig(supabase);
      if (config) {
        const creds = decryptCredentials(config);
        const text = `Advisory call requested: ${session.full_name} (${session.whatsapp ?? 'no WA'}) completed ${checkName} and paid KES ${Number(
          session.payment_amount ?? 0
        ).toLocaleString()}. Report: ${reportUrl}`;
        await sendWhatsAppMessage({ creds, to: adminWhatsApp, body: text });
      }
    } catch (error) {
      console.error('Admin call-request WhatsApp failed:', error);
    }
  }
}
