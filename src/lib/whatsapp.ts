import type { SupabaseClient } from '@supabase/supabase-js';
import { decryptSecret, encryptSecret } from '@/lib/crypto';

// Re-exported so existing callers (e.g. whatsapp-config route) keep working.
export { decryptSecret, encryptSecret } from '@/lib/crypto';

export type WhatsAppProvider = 'twilio' | 'meta_cloud_api' | 'infobip';

export interface WhatsAppConfigRow {
  provider: WhatsAppProvider;
  phone_number_id: string | null;
  access_token_encrypted: string | null;
  account_sid: string | null;
  auth_token_encrypted: string | null;
  from_number: string | null;
  is_active: boolean;
}

export interface WhatsAppTemplateRow {
  template_key: string;
  name: string;
  body_text: string;
  available_variables: string[];
  approval_status: 'draft' | 'submitted' | 'approved' | 'rejected';
  rejection_reason: string | null;
  wa_template_id: string | null;
  category: string | null;
  language: string | null;
  is_active: boolean;
}

interface DecryptedCredentials {
  provider: WhatsAppProvider;
  accountSid?: string;
  authToken?: string;
  phoneNumberId?: string;
  accessToken?: string;
  fromNumber?: string;
}

export interface WhatsAppSendResult {
  ok: boolean;
  messageId?: string;
  error?: string;
}

/** Reads the single-row WhatsApp config (first row). */
export async function getWhatsAppConfig(supabase: SupabaseClient): Promise<WhatsAppConfigRow | null> {
  const { data, error } = await supabase.from('whatsapp_config').select('*').limit(1).maybeSingle();
  if (error) {
    console.error('Failed to load whatsapp_config:', error);
    return null;
  }
  return (data as WhatsAppConfigRow) ?? null;
}

/** Decrypts stored credentials into an in-memory plaintext object. */
export function decryptCredentials(config: WhatsAppConfigRow): DecryptedCredentials {
  return {
    provider: config.provider,
    accountSid: config.account_sid ?? undefined,
    authToken: config.auth_token_encrypted ? decryptSecret(config.auth_token_encrypted) : undefined,
    phoneNumberId: config.phone_number_id ?? undefined,
    accessToken: config.access_token_encrypted ? decryptSecret(config.access_token_encrypted) : undefined,
    fromNumber: config.from_number ?? undefined,
  };
}

async function sendTwilio(creds: DecryptedCredentials, to: string, body: string, templateName?: string, parameters?: string[]): Promise<WhatsAppSendResult> {
  const { accountSid, authToken, fromNumber } = creds;
  if (!accountSid || !authToken || !fromNumber) return { ok: false, error: 'Twilio credentials are incomplete.' };

  const url = `https://api.twilio.com/2010-04-01/Accounts/${encodeURIComponent(accountSid)}/Messages.json`;
  const params = new URLSearchParams();
  params.set('To', to.startsWith('whatsapp:') ? to : `whatsapp:${to}`);
  params.set('From', fromNumber);
  params.set('Body', body);

  const basic = Buffer.from(`${accountSid}:${authToken}`).toString('base64');
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: `Basic ${basic}`,
    },
    body: params.toString(),
  });

  const json = (await res.json().catch(() => ({}))) as { sid?: string; message?: string; error_message?: string };
  if (!res.ok || !json.sid) {
    return { ok: false, error: json.error_message ?? json.message ?? `Twilio error ${res.status}` };
  }
  return { ok: true, messageId: json.sid };
}

async function sendMeta(creds: DecryptedCredentials, to: string, body: string, templateName?: string, parameters?: string[], language = 'en'): Promise<WhatsAppSendResult> {
  const { phoneNumberId, accessToken } = creds;
  if (!phoneNumberId || !accessToken) return { ok: false, error: 'Meta Cloud API credentials are incomplete.' };

  const url = `https://graph.facebook.com/v20.0/${phoneNumberId}/messages`;

  let payload: Record<string, unknown>;
  if (templateName && parameters) {
    payload = {
      messaging_product: 'whatsapp',
      to,
      type: 'template',
      template: {
        name: templateName,
        language: { code: language },
        components: parameters.length ? [{ type: 'body', parameters: parameters.map((p) => ({ type: 'text', text: p })) }] : [],
      },
    };
  } else {
    payload = { messaging_product: 'whatsapp', to, type: 'text', text: { body } };
  }

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(payload),
  });

  const json = (await res.json().catch(() => ({}))) as { messages?: Array<{ id: string }>; error?: { message: string; code?: number } };
  if (!res.ok || !json.messages?.[0]?.id) {
    return { ok: false, error: json.error?.message ?? `Meta API error ${res.status}` };
  }
  return { ok: true, messageId: json.messages[0].id };
}

async function sendInfobip(creds: DecryptedCredentials, to: string, body: string): Promise<WhatsAppSendResult> {
  // account_sid doubles as the Infobip base URL (e.g. xyz.api.infobip.com),
  // access_token as the API key.
  const { accountSid, accessToken, fromNumber } = creds;
  if (!accountSid || !accessToken || !fromNumber) return { ok: false, error: 'Infobip credentials are incomplete.' };

  const base = accountSid.includes('://') ? accountSid : `https://${accountSid}`;
  const res = await fetch(`${base}/whatsapp/1/message/text`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `App ${accessToken}`,
    },
    body: JSON.stringify({ from: fromNumber, to, text: body }),
  });

  const json = (await res.json().catch(() => ({}))) as { messages?: Array<{ messageId: string }>; requestError?: { serviceException?: { message: string } } };
  if (!res.ok || !json.messages?.[0]?.messageId) {
    return { ok: false, error: json.requestError?.serviceException?.message ?? `Infobip error ${res.status}` };
  }
  return { ok: true, messageId: json.messages[0].messageId };
}

export interface SendWhatsAppPayload {
  creds: DecryptedCredentials;
  to: string;
  body: string;
  templateName?: string;
  parameters?: string[];
  language?: string;
}

/** Dispatches to the configured WhatsApp provider. */
export async function sendWhatsAppMessage(payload: SendWhatsAppPayload): Promise<WhatsAppSendResult> {
  const { creds, to, body, templateName, parameters, language } = payload;
  switch (creds.provider) {
    case 'twilio':
      return sendTwilio(creds, to, body, templateName, parameters);
    case 'meta_cloud_api':
      return sendMeta(creds, to, body, templateName, parameters, language);
    case 'infobip':
      return sendInfobip(creds, to, body);
    default:
      return { ok: false, error: 'Unsupported WhatsApp provider.' };
  }
}

/** Pings the provider to verify credentials (used by the config page). */
export async function testProviderConnection(creds: DecryptedCredentials): Promise<WhatsAppSendResult> {
  switch (creds.provider) {
    case 'twilio': {
      const { accountSid, authToken } = creds;
      if (!accountSid || !authToken) return { ok: false, error: 'Twilio credentials are incomplete.' };
      const basic = Buffer.from(`${accountSid}:${authToken}`).toString('base64');
      const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${encodeURIComponent(accountSid)}.json`, {
        headers: { Authorization: `Basic ${basic}` },
      });
      const json = (await res.json().catch(() => ({}))) as { status?: string; message?: string };
      return res.ok ? { ok: true, messageId: json.status } : { ok: false, error: json.message ?? `Twilio error ${res.status}` };
    }
    case 'meta_cloud_api': {
      const { phoneNumberId, accessToken } = creds;
      if (!phoneNumberId || !accessToken) return { ok: false, error: 'Meta Cloud API credentials are incomplete.' };
      const res = await fetch(`https://graph.facebook.com/v20.0/${phoneNumberId}?fields=name,display_phone_number`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const json = (await res.json().catch(() => ({}))) as { name?: string; error?: { message: string } };
      return res.ok ? { ok: true } : { ok: false, error: json.error?.message ?? `Meta API error ${res.status}` };
    }
    case 'infobip': {
      const { accountSid, accessToken } = creds;
      if (!accountSid || !accessToken) return { ok: false, error: 'Infobip credentials are incomplete.' };
      const base = accountSid.includes('://') ? accountSid : `https://${accountSid}`;
      const res = await fetch(`${base}/whatsapp/1/contacts`, {
        method: 'GET',
        headers: { Authorization: `App ${accessToken}` },
      });
      return res.ok ? { ok: true } : { ok: false, error: `Infobip error ${res.status}` };
    }
    default:
      return { ok: false, error: 'Unsupported WhatsApp provider.' };
  }
}

async function logWhatsApp(
  supabase: SupabaseClient | null,
  entry: {
    templateKey?: string;
    toNumber: string;
    toName?: string;
    bodySent: string;
    variables?: Record<string, unknown>;
    provider: string;
    messageId?: string;
    status: 'pending' | 'sent' | 'delivered' | 'failed' | 'read';
    error?: string;
    reportId?: string;
    sessionId?: string;
  }
) {
  if (!supabase) return;
  try {
    await supabase.from('whatsapp_log').insert({
      template_key: entry.templateKey,
      to_number: entry.toNumber,
      to_name: entry.toName,
      body_sent: entry.bodySent,
      variables_used: entry.variables ?? {},
      provider: entry.provider,
      provider_message_id: entry.messageId,
      status: entry.status,
      error_message: entry.error,
      report_id: entry.reportId,
      session_id: entry.sessionId,
      attempts: 1,
      last_attempted_at: new Date().toISOString(),
      ...(entry.status === 'sent' ? { sent_at: new Date().toISOString() } : {}),
    });
  } catch (error) {
    console.error('Failed to log whatsapp message:', error);
  }
}

export interface TemplatedWhatsAppOptions {
  template: WhatsAppTemplateRow;
  to: string;
  toName?: string;
  variables?: Record<string, unknown>;
  reportId?: string;
  sessionId?: string;
}

/**
 * Renders a WhatsApp template, sends it via the configured provider and logs
 * the attempt. Returns the provider result.
 */
export async function sendTemplatedWhatsApp(
  supabase: SupabaseClient | null,
  options: TemplatedWhatsAppOptions
): Promise<WhatsAppSendResult> {
  const { template, to, toName, variables = {}, reportId, sessionId } = options;

  const body = template.body_text.replace(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g, (match, key: string) =>
    variables[key] !== undefined && variables[key] !== null ? String(variables[key]) : match
  );

  const config = supabase ? await getWhatsAppConfig(supabase) : null;
  if (!config || !config.is_active) {
    await logWhatsApp(supabase, {
      templateKey: template.template_key,
      toNumber: to,
      toName,
      bodySent: body,
      variables,
      provider: config?.provider ?? 'none',
      status: 'failed',
      error: 'WhatsApp is not configured or is inactive.',
      reportId,
      sessionId,
    });
    return { ok: false, error: 'WhatsApp is not configured or is inactive.' };
  }

  let creds: DecryptedCredentials;
  try {
    creds = decryptCredentials(config);
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : 'Could not decrypt WhatsApp credentials.' };
  }

  // Positional parameters in available_variables order (Meta template format).
  const parameters = template.available_variables
    .filter((name) => variables[name] !== undefined)
    .map((name) => String(variables[name]));

  const result = await sendWhatsAppMessage({
    creds,
    to,
    body,
    templateName: creds.provider === 'meta_cloud_api' && template.wa_template_id ? template.template_key : undefined,
    parameters: creds.provider === 'meta_cloud_api' ? parameters : undefined,
    language: creds.provider === 'meta_cloud_api' ? template.language ?? 'en' : undefined,
  });

  await logWhatsApp(supabase, {
    templateKey: template.template_key,
    toNumber: to,
    toName,
    bodySent: body,
    variables,
    provider: config.provider,
    messageId: result.messageId,
    status: result.ok ? 'sent' : 'failed',
    error: result.error,
    reportId,
    sessionId,
  });

  return result;
}
