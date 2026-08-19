import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { requireAdmin, jsonAdminError } from '@/lib/admin-auth';
import { sendEmail } from '@/lib/email';

export const dynamic = 'force-dynamic';

type RouteContext = { params: Promise<{ id: string }> };

async function loadEntry(supabase: Awaited<ReturnType<typeof requireAdmin>>['supabase'], id: string) {
  const { data, error } = await supabase.from('email_log').select('*').eq('id', id).maybeSingle();
  if (error) throw error;
  return data as Record<string, unknown> | null;
}

/** Re-sends the stored email for a log entry and updates that row in place. */
export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const { supabase } = await requireAdmin(request, 'update');
    const { id } = await context.params;

    const entry = await loadEntry(supabase, id);
    if (!entry) return NextResponse.json({ error: 'Email log entry not found' }, { status: 404 });

    let fromName: string | undefined;
    let fromEmail: string | undefined;
    let replyTo: string | undefined;
    if (entry.template_key) {
      const { data: template } = await supabase
        .from('email_templates')
        .select('from_name,from_email,reply_to')
        .eq('template_key', String(entry.template_key))
        .maybeSingle();
      if (template) {
        fromName = template.from_name ?? undefined;
        fromEmail = template.from_email ?? undefined;
        replyTo = template.reply_to ?? undefined;
      }
    }

    const result = await sendEmail({
      to: String(entry.to_email),
      toName: entry.to_name ? String(entry.to_name) : undefined,
      subject: String(entry.subject ?? ''),
      html: String(entry.body_html ?? ''),
      fromName,
      fromEmail,
      replyTo,
    });

    const now = new Date().toISOString();
    const update: Record<string, unknown> = {
      attempts: Number(entry.attempts ?? 0) + 1,
      last_attempted_at: now,
      status: result.ok ? 'sent' : 'failed',
      error_message: result.error ?? null,
    };
    if (result.ok) {
      update.sent_at = now;
      update.smtp_message_id = result.messageId ?? null;
    }

    const { data: updated, error: updateError } = await supabase.from('email_log').update(update).eq('id', id).select().single();
    if (updateError) throw updateError;

    if (!result.ok) {
      return NextResponse.json({ error: result.error ?? 'Failed to resend email.' }, { status: 502 });
    }
    return NextResponse.json({ entry: updated });
  } catch (error) {
    return jsonAdminError(error, 'Failed to retry email');
  }
}

/** Deletes a single email log entry. */
export async function DELETE(request: NextRequest, context: RouteContext) {
  try {
    const { supabase } = await requireAdmin(request, 'delete');
    const { id } = await context.params;

    const { error } = await supabase.from('email_log').delete().eq('id', id);
    if (error) throw error;
    return NextResponse.json({ ok: true });
  } catch (error) {
    return jsonAdminError(error, 'Failed to delete email log entry');
  }
}