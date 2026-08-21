import type { SupabaseClient } from '@supabase/supabase-js';
import { sendTemplatedEmail, type EmailTemplateRow } from '@/lib/email';
import { sendTemplatedWhatsApp, type WhatsAppTemplateRow } from '@/lib/whatsapp';

interface DeliveryResult {
  ok: boolean;
  error?: string;
}

function siteUrl() {
  return process.env.NEXT_PUBLIC_SITE_URL ?? 'https://deni-sawa.vercel.app';
}

async function getCheckName(supabase: SupabaseClient, checkId: string): Promise<string> {
  const { data } = await supabase.from('health_checks').select('name').eq('id', checkId).maybeSingle();
  return (data as { name?: string } | null)?.name ?? 'Your Health Check';
}

/**
 * Best-effort notification sent to a user when their report could not be
 * generated. Uses the `health_check_report_failed` email/WhatsApp templates.
 */
export async function notifyReportFailed(
  supabase: SupabaseClient,
  session: { id: string; health_check_id: string; full_name: string; email: string | null; whatsapp: string | null; preferred_delivery: string }
): Promise<void> {
  const checkName = await getCheckName(supabase, session.health_check_id);
  const variables = { recipient_name: session.full_name, check_name: checkName };

  const wantsEmail = session.preferred_delivery === 'email' || session.preferred_delivery === 'both';
  const wantsWhatsApp = session.preferred_delivery === 'whatsapp' || session.preferred_delivery === 'both';

  if (wantsEmail && session.email) {
    try {
      const { data: template } = await supabase
        .from('email_templates')
        .select('*')
        .eq('template_key', 'health_check_report_failed')
        .maybeSingle();
      if (template?.is_active) {
        await sendTemplatedEmail(supabase, {
          template: template as unknown as EmailTemplateRow,
          to: session.email,
          toName: session.full_name,
          variables,
          sessionId: session.id,
        });
      }
    } catch (error) {
      console.error('Failed to send report-failed email:', error);
    }
  }

  if (wantsWhatsApp && session.whatsapp) {
    try {
      const { data: template } = await supabase
        .from('whatsapp_templates')
        .select('*')
        .eq('template_key', 'health_check_report_failed')
        .maybeSingle();
      if (template?.is_active) {
        await sendTemplatedWhatsApp(supabase, {
          template: template as unknown as WhatsAppTemplateRow,
          to: session.whatsapp,
          toName: session.full_name,
          variables,
          sessionId: session.id,
        });
      }
    } catch (error) {
      console.error('Failed to send report-failed WhatsApp message:', error);
    }
  }
}

/**
 * Delivers a generated report by email. Renders the active template for the
 * report type, sends it, logs to email_log and updates delivery_status.
 */
export async function deliverReportByEmail(supabase: SupabaseClient, reportId: string): Promise<DeliveryResult> {
  const { data: report, error: reportError } = await supabase
    .from('health_check_reports')
    .select('*')
    .eq('id', reportId)
    .maybeSingle();

  if (reportError || !report) return { ok: false, error: 'Report not found.' };

  const { data: session } = await supabase.from('health_check_sessions').select('*').eq('id', report.session_id).maybeSingle();
  if (!session) return { ok: false, error: 'Session not found.' };
  if (!session.email) return { ok: false, error: 'Session has no email address.' };

  const { data: template } = await supabase
    .from('email_templates')
    .select('*')
    .eq('template_key', `health_check_report_${report.report_type}`)
    .maybeSingle();
  if (!template || !template.is_active) return { ok: false, error: 'Email template is missing or inactive.' };

  const checkName = await getCheckName(supabase, session.health_check_id);
  const reportUrl = `${siteUrl()}/business-health-checks/report/${report.report_url_token}`;

  const result = await sendTemplatedEmail(supabase, {
    template: template as unknown as EmailTemplateRow,
    to: session.email,
    toName: session.full_name,
    variables: {
      recipient_name: session.full_name,
      check_name: checkName,
      report_url: reportUrl,
      report_type: report.report_type,
    },
    reportId: report.id,
    sessionId: session.id,
  });

  await supabase
    .from('health_check_reports')
    .update({ delivery_status: result.ok ? 'sent' : 'failed' })
    .eq('id', reportId);

  return result;
}

/**
 * Delivers a generated report via WhatsApp. Renders the approved template for
 * the report type, calls the configured provider, logs to whatsapp_log and
 * updates delivery_status.
 */
export async function deliverReportByWhatsApp(supabase: SupabaseClient, reportId: string): Promise<DeliveryResult> {
  const { data: report, error: reportError } = await supabase
    .from('health_check_reports')
    .select('*')
    .eq('id', reportId)
    .maybeSingle();

  if (reportError || !report) return { ok: false, error: 'Report not found.' };

  const { data: session } = await supabase.from('health_check_sessions').select('*').eq('id', report.session_id).maybeSingle();
  if (!session) return { ok: false, error: 'Session not found.' };
  if (!session.whatsapp) return { ok: false, error: 'Session has no WhatsApp number.' };

  const { data: template } = await supabase
    .from('whatsapp_templates')
    .select('*')
    .eq('template_key', `health_check_report_${report.report_type}`)
    .maybeSingle();
  if (!template) return { ok: false, error: 'WhatsApp template is missing.' };

  const checkName = await getCheckName(supabase, session.health_check_id);
  const reportUrl = `${siteUrl()}/business-health-checks/report/${report.report_url_token}`;

  const result = await sendTemplatedWhatsApp(supabase, {
    template: template as unknown as WhatsAppTemplateRow,
    to: session.whatsapp,
    toName: session.full_name,
    variables: {
      recipient_name: session.full_name,
      check_name: checkName,
      report_url: reportUrl,
    },
    reportId: report.id,
    sessionId: session.id,
  });

  await supabase
    .from('health_check_reports')
    .update({ delivery_status: result.ok ? 'sent' : 'failed' })
    .eq('id', reportId);

  return result;
}
