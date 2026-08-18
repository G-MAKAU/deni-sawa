import type { SupabaseClient } from '@supabase/supabase-js';
import { deliverReportByEmail, deliverReportByWhatsApp } from '@/lib/delivery';
import { runReportGeneration } from '@/lib/generate-report';
import { sendEmail, buildBrandedEmailHtml, resolveSiteUrl } from '@/lib/email';
import { getWhatsAppConfig, decryptCredentials, sendWhatsAppMessage } from '@/lib/whatsapp';
import { site } from '@/data/site';

/**
 * Marks a session as paid and releases the report:
 *  - flips payment_status -> 'paid'
 *  - delivers the generated report via the session's preferred channel
 *  - for the Detailed + Advisory Call option, notifies the admin (email +
 *    WhatsApp) once so a call can be scheduled.
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

  const { data: report } = await supabase
    .from('health_check_reports')
    .select('id, report_url_token')
    .eq('session_id', sessionId)
    .eq('report_type', 'detailed')
    .maybeSingle();

  const delivery = (session.preferred_delivery ?? 'email') as 'email' | 'whatsapp' | 'both';
  let reportUrlToken: string | null = null;
  let reportId: string | null = null;

  if (report) {
    // Report already generated (direct paid flow, delivery was deferred).
    reportId = report.id;
    if (delivery === 'email' || delivery === 'both') await deliverReportByEmail(supabase, report.id);
    if (delivery === 'whatsapp' || delivery === 'both') await deliverReportByWhatsApp(supabase, report.id);
    reportUrlToken = report.report_url_token;
  } else {
    // Upgrade from summary: generate the detailed report now (which also
    // delivers it via the session's preferred channel).
    const result = await runReportGeneration(supabase, session, 'detailed');
    reportId = result.report.id;
    reportUrlToken = result.report.report_url_token;
  }

  if (reportId) {
    await supabase.from('health_check_reports').update({ is_paid: true }).eq('id', reportId);
  }

  // Detailed + Advisory Call → notify the admin once.
  if (session.requires_call && !session.admin_notified) {
    await notifyAdminOfCall(supabase, session, reportUrlToken);
    await supabase.from('health_check_sessions').update({ admin_notified: true }).eq('id', sessionId);
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
