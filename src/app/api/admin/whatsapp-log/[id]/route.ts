import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { requireAdmin, jsonAdminError } from '@/lib/admin-auth';
import { getWhatsAppConfig, decryptCredentials, sendWhatsAppMessage, type WhatsAppTemplateRow } from '@/lib/whatsapp';

export const dynamic = 'force-dynamic';

type RouteContext = { params: Promise<{ id: string }> };

async function loadEntry(supabase: Awaited<ReturnType<typeof requireAdmin>>['supabase'], id: string) {
  const { data, error } = await supabase.from('whatsapp_log').select('*').eq('id', id).maybeSingle();
  if (error) throw error;
  return data as Record<string, unknown> | null;
}

/** Re-sends the stored WhatsApp message for a log entry and updates that row in place. */
export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const { supabase } = await requireAdmin(request, 'update');
    const { id } = await context.params;

    const entry = await loadEntry(supabase, id);
    if (!entry) return NextResponse.json({ error: 'WhatsApp log entry not found' }, { status: 404 });

    const templateKey = entry.template_key ? String(entry.template_key) : '';
    if (!templateKey) {
      return NextResponse.json({ error: 'This message has no template to resend.' }, { status: 400 });
    }

    const { data: template } = await supabase
      .from('whatsapp_templates')
      .select('*')
      .eq('template_key', templateKey)
      .maybeSingle();
    if (!template) return NextResponse.json({ error: 'WhatsApp template not found' }, { status: 404 });

    const config = await getWhatsAppConfig(supabase);
    if (!config || !config.is_active) {
      return NextResponse.json({ error: 'WhatsApp is not configured or is inactive.' }, { status: 502 });
    }

    let creds;
    try {
      creds = decryptCredentials(config);
    } catch (error) {
      return NextResponse.json({ error: error instanceof Error ? error.message : 'Could not decrypt WhatsApp credentials.' }, { status: 502 });
    }

    const variables = (entry.variables_used ?? {}) as Record<string, unknown>;
    const waTemplate = template as unknown as WhatsAppTemplateRow;
    const parameters = waTemplate.available_variables
      .filter((name) => variables[name] !== undefined)
      .map((name) => String(variables[name]));

    const result = await sendWhatsAppMessage({
      creds,
      to: String(entry.to_number),
      body: String(entry.body_sent ?? ''),
      templateName: creds.provider === 'meta_cloud_api' && waTemplate.wa_template_id ? waTemplate.template_key : undefined,
      parameters: creds.provider === 'meta_cloud_api' ? parameters : undefined,
      language: creds.provider === 'meta_cloud_api' ? waTemplate.language ?? 'en' : undefined,
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
      update.delivered_at = null;
      update.read_at = null;
      update.provider_message_id = result.messageId ?? null;
    }

    const { data: updated, error: updateError } = await supabase.from('whatsapp_log').update(update).eq('id', id).select().single();
    if (updateError) throw updateError;

    if (!result.ok) {
      return NextResponse.json({ error: result.error ?? 'Failed to resend message.' }, { status: 502 });
    }
    return NextResponse.json({ entry: updated });
  } catch (error) {
    return jsonAdminError(error, 'Failed to retry WhatsApp message');
  }
}

/** Deletes a single WhatsApp log entry. */
export async function DELETE(request: NextRequest, context: RouteContext) {
  try {
    const { supabase } = await requireAdmin(request, 'delete');
    const { id } = await context.params;

    const { error } = await supabase.from('whatsapp_log').delete().eq('id', id);
    if (error) throw error;
    return NextResponse.json({ ok: true });
  } catch (error) {
    return jsonAdminError(error, 'Failed to delete WhatsApp log entry');
  }
}