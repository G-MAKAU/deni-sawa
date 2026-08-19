import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getServiceClient } from '@/lib/supabase/service';

export const dynamic = 'force-dynamic';
export const maxDuration = 30;

/**
 * Public WhatsApp webhook used by the Meta Cloud API.
 *
 * GET  — responds to Meta's subscription verification handshake
 *        (hub.mode / hub.verify_token / hub.challenge).
 * POST — receives message status updates (delivered / read / failed) and
 *        template status updates (APPROVED / REJECTED / PENDING).
 *
 * Configure this URL in the Meta developer app webhook settings:
 *   https://<site>/api/whatsapp/webhook
 */
async function loadVerifyToken(): Promise<string | null> {
  try {
    const supabase = getServiceClient();
    const { data } = await supabase.from('whatsapp_config').select('webhook_verify_token').limit(1).maybeSingle();
    return data?.webhook_verify_token ?? null;
  } catch {
    return null;
  }
}

export async function GET(request: NextRequest) {
  const search = request.nextUrl.searchParams;
  const mode = search.get('hub.mode');
  const token = search.get('hub.verify_token');
  const challenge = search.get('hub.challenge');

  if (mode === 'subscribe' && token) {
    const stored = await loadVerifyToken();
    if (stored && token === stored) {
      return new NextResponse(challenge ?? '', {
        status: 200,
        headers: { 'Content-Type': 'text/plain' },
      });
    }
  }

  return NextResponse.json({ error: 'Verification failed' }, { status: 403 });
}

export async function POST(request: NextRequest) {
  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
  }

  const body = payload as {
    entry?: Array<{ changes?: Array<{ field?: string; value?: Record<string, unknown> }> }>;
  };

  const supabase = getServiceClient();
  const changes = body.entry ?? [];
  const seen = new Set<string>();

  for (const entry of changes) {
    for (const change of entry.changes ?? []) {
      const field = change.field ?? '';
      const value = change.value ?? {};

      if (field === 'messages') {
        const statuses = Array.isArray(value.statuses) ? value.statuses : [];
        for (const status of statuses) {
          const wamId = String(status.wamid ?? '');
          const metaStatus = String(status.status ?? '');
          const errorReason = extractMetaError(status.errors);
          if (!wamId || seen.has(`m:${wamId}`)) continue;
          seen.add(`m:${wamId}`);

          const next = normalizeMessageStatus(metaStatus);
          const update: Record<string, unknown> = { status: next.status };
          if (next.status !== 'sent') update.error_message = errorReason;
          if (next.status === 'delivered') update.delivered_at = new Date().toISOString();
          if (next.status === 'read') update.read_at = new Date().toISOString();

          await supabase.from('whatsapp_log').update(update).eq('provider_message_id', wamId);
        }
      }

      if (field === 'message_template_status_update') {
        const event = String(value.event ?? '');
        const templateName = String(value.template_name ?? '');
        const language = String(value.language ?? '');
        if (!templateName || seen.has(`t:${templateName}:${language}`)) continue;
        seen.add(`t:${templateName}:${language}`);

        await applyTemplateStatus(supabase, templateName, language, event, value);
      }
    }
  }

  // Always acknowledge the webhook promptly so Meta does not retry.
  return NextResponse.json({ received: true });
}

function normalizeMessageStatus(metaStatus: string): { status: 'sent' | 'delivered' | 'read' | 'failed' } {
  switch (metaStatus) {
    case 'delivered':
      return { status: 'delivered' };
    case 'read':
      return { status: 'read' };
    case 'failed':
      return { status: 'failed' };
    default:
      return { status: 'sent' };
  }
}

function extractMetaError(errors: unknown): string | null {
  if (!Array.isArray(errors) || errors.length === 0) return null;
  const first = errors[0] as { code?: number; title?: string; message?: string } | undefined;
  if (!first) return null;
  return first.title ?? first.message ?? `Meta error ${first.code ?? 'unknown'}`;
}

async function applyTemplateStatus(
  supabase: ReturnType<typeof getServiceClient>,
  templateName: string,
  language: string,
  event: string,
  value: Record<string, unknown>
) {
  let status: 'draft' | 'submitted' | 'approved' | 'rejected';
  switch (event) {
    case 'APPROVED':
      status = 'approved';
      break;
    case 'REJECTED':
      status = 'rejected';
      break;
    case 'PENDING':
    case 'IN_APPEAL':
      status = 'submitted';
      break;
    default:
      return;
  }

  const payload: Record<string, unknown> = { approval_status: status };
  if (status === 'rejected') {
    const reasons = Array.isArray(value.reason)
      ? (value.reason as unknown[])
          .map((r) => (typeof r === 'string' ? r : (r as { description?: string })?.description))
          .filter(Boolean)
          .join('; ')
      : null;
    payload.rejection_reason = reasons ?? 'Rejected by WhatsApp';
  }
  if (status === 'approved' && typeof value.id === 'string' && value.id) {
    payload.wa_template_id = value.id;
  }

  let query = supabase
    .from('whatsapp_templates')
    .update(payload)
    .eq('template_key', templateName);
  if (language) query = query.eq('language', language);

  await query;
}