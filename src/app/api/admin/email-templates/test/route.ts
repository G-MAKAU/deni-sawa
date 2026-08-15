import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { z } from 'zod';
import { requireAdmin, jsonAdminError } from '@/lib/admin-auth';
import { sendEmail, renderTemplateText, buildBrandedEmailHtml, type EmailTemplateRow } from '@/lib/email';
import { getServiceClient } from '@/lib/supabase/service';

export const dynamic = 'force-dynamic';

const testSchema = z.object({
  template_key: z.string().min(1),
  send_to: z.string().email(),
  variables: z.record(z.string(), z.union([z.string(), z.number()])).default({}),
});

export async function POST(request: NextRequest) {
  try {
    const { currentAdmin } = await requireAdmin(request, 'create');

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
    }

    const parsed = testSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Validation failed', details: parsed.error.flatten() }, { status: 422 });
    }

    const supabase = getServiceClient();
    const { data: template, error } = await supabase
      .from('email_templates')
      .select('*')
      .eq('template_key', parsed.data.template_key)
      .maybeSingle();

    if (error) throw error;
    if (!template) return NextResponse.json({ error: 'Email template not found' }, { status: 404 });

    const row = template as unknown as EmailTemplateRow;
    const subject = renderTemplateText(row.subject, parsed.data.variables);
    const bodyHtml = buildBrandedEmailHtml(renderTemplateText(row.body_html ?? '', parsed.data.variables));

    const result = await sendEmail({
      to: parsed.data.send_to,
      toName: parsed.data.send_to,
      templateKey: row.template_key,
      subject: `[Test] ${subject}`,
      html: bodyHtml,
      variables: parsed.data.variables,
      replyTo: row.reply_to ?? undefined,
    });

    // Log the test to email_log for the audit trail.
    try {
      await supabase.from('email_log').insert({
        template_key: row.template_key,
        to_email: parsed.data.send_to,
        to_name: currentAdmin.full_name,
        subject: `[Test] ${subject}`,
        body_html: bodyHtml,
        variables_used: parsed.data.variables,
        smtp_message_id: result.messageId,
        status: result.ok ? 'sent' : 'failed',
        error_message: result.error,
        attempts: 1,
        last_attempted_at: new Date().toISOString(),
        ...(result.ok ? { sent_at: new Date().toISOString() } : {}),
      });
    } catch (logError) {
      console.error('Failed to log test email:', logError);
    }

    if (!result.ok) {
      return NextResponse.json({ error: result.error ?? 'Failed to send test email.' }, { status: 502 });
    }

    return NextResponse.json({ success: true, messageId: result.messageId });
  } catch (error) {
    return jsonAdminError(error, 'Failed to send test email');
  }
}
