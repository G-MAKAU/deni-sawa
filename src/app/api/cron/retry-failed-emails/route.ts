import { NextResponse } from 'next/server';
import { getServiceClient } from '@/lib/supabase/service';
import { sendEmail, buildBrandedEmailHtml } from '@/lib/email';
import { site } from '@/data/site';

export const dynamic = 'force-dynamic';

const MAX_RETRIES = 5;

/**
 * Cron: Retry failed/pending email_log entries (attempts < MAX_RETRIES).
 * After MAX_RETRIES, marks as 'failed' and notifies admin.
 *
 * Schedule: every 30 minutes (vercel_.json or cron-job.org)
 * Auth: requires CRON_SECRET header.
 */
export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization');
  const secret = process.env.CRON_SECRET;
  if (!secret || authHeader !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const supabase = getServiceClient();

    // Fetch retryable emails: pending or failed, with attempts < MAX_RETRIES
    const { data: emails, error: fetchError } = await supabase
      .from('email_log')
      .select('*')
      .in('status', ['pending', 'failed'])
      .lt('attempts', MAX_RETRIES)
      .order('created_at', { ascending: true })
      .limit(50);

    if (fetchError) throw fetchError;
    if (!emails || emails.length === 0) {
      return NextResponse.json({ ok: true, retried: 0, failed: 0 });
    }

    let retried = 0;
    let permanentlyFailed = 0;
    const failuresToNotify: Array<{ id: string; to: string; subject: string; error: string }> = [];

    for (const email of emails) {
      const newAttempts = email.attempts + 1;

      const result = await sendEmail({
        to: email.to_email,
        toName: email.to_name ?? undefined,
        subject: email.subject,
        html: email.body_html,
      });

      if (result.ok) {
        // Success — update the existing row
        await supabase
          .from('email_log')
          .update({
            status: 'sent',
            attempts: newAttempts,
            last_attempted_at: new Date().toISOString(),
            sent_at: new Date().toISOString(),
            smtp_message_id: result.messageId ?? null,
            error_message: null,
          })
          .eq('id', email.id);
        retried++;
      } else {
        // Failed — check if we've hit max retries
        if (newAttempts >= MAX_RETRIES) {
          await supabase
            .from('email_log')
            .update({
              status: 'failed',
              attempts: newAttempts,
              last_attempted_at: new Date().toISOString(),
              error_message: result.error ?? 'Max retries exceeded',
            })
            .eq('id', email.id);

          permanentlyFailed++;
          failuresToNotify.push({
            id: email.id,
            to: email.to_email,
            subject: email.subject,
            error: result.error ?? 'Unknown error',
          });
        } else {
          // Increment attempts, stay in failed/pending
          await supabase
            .from('email_log')
            .update({
              attempts: newAttempts,
              last_attempted_at: new Date().toISOString(),
              error_message: result.error ?? null,
            })
            .eq('id', email.id);
        }
      }
    }

    // Notify admin about permanently failed emails
    if (failuresToNotify.length > 0) {
      const adminEmail = process.env.ADMIN_NOTIFY_EMAIL ?? site.email;
      if (adminEmail) {
        const rows = failuresToNotify
          .map(
            (f) =>
              `<tr><td style="padding:8px;border:1px solid #e0e0e0;">${f.to}</td><td style="padding:8px;border:1px solid #e0e0e0;">${f.subject}</td><td style="padding:8px;border:1px solid #e0e0e0;font-size:12px;">${f.error}</td></tr>`
          )
          .join('');

        const html = buildBrandedEmailHtml(`
          <h1>Email delivery failed after ${MAX_RETRIES} attempts</h1>
          <p>The following emails could not be delivered after ${MAX_RETRIES} retry attempts:</p>
          <table style="width:100%;border-collapse:collapse;margin:16px 0;">
            <thead><tr style="background:#F9F7F5;"><th style="padding:8px;border:1px solid #e0e0e0;text-align:left;">Recipient</th><th style="padding:8px;border:1px solid #e0e0e0;text-align:left;">Subject</th><th style="padding:8px;border:1px solid #e0e0e0;text-align:left;">Error</th></tr></thead>
            <tbody>${rows}</tbody>
          </table>
          <p>These emails have been marked as permanently failed in the email log.</p>
          <p><a href="${site.url}/admin/email-log">View email log →</a></p>
        `);

        await sendEmail({
          to: adminEmail,
          subject: `[Alert] ${failuresToNotify.length} email(s) failed after ${MAX_RETRIES} retries`,
          html,
        });
      }
    }

    return NextResponse.json({
      ok: true,
      retried,
      permanentlyFailed,
      total: emails.length,
    });
  } catch (error) {
    console.error('Email retry cron failed:', error);
    return NextResponse.json({ error: 'Retry cron failed' }, { status: 500 });
  }
}
