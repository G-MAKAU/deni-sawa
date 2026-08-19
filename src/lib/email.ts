import nodemailer from 'nodemailer';
import juice from 'juice';
import type { SupabaseClient } from '@supabase/supabase-js';
import { site } from '@/data/site';

export interface EmailTemplateRow {
  template_key: string;
  name: string;
  subject: string;
  preview_text: string | null;
  body_lexical: unknown;
  body_html: string | null;
  from_name: string;
  from_email: string;
  reply_to: string | null;
  is_active: boolean;
  available_variables: string[];
}

export interface EmailSendPayload {
  to: string;
  toName?: string;
  templateKey?: string;
  subject: string;
  html: string;
  text?: string;
  variables?: Record<string, unknown>;
  replyTo?: string;
  reportId?: string;
  sessionId?: string;
  fromName?: string;
  fromEmail?: string;
}

export interface EmailSendResult {
  ok: boolean;
  messageId?: string;
  error?: string;
}

function resolveSiteUrl() {
  return process.env.NEXT_PUBLIC_SITE_URL ?? 'https://denisawa.co.ke';
}

/** Replace {{variable_name}} tokens with values from `variables`. */
export function renderTemplateText(template: string, variables: Record<string, unknown>): string {
  return template.replace(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g, (match, key: string) => {
    const value = variables[key];
    if (value === undefined || value === null) return match;
    return String(value);
  });
}

/** Renders a template's HTML body (already-generated body_html cache). */
export function renderTemplateHtml(bodyHtml: string | null | undefined, variables: Record<string, unknown>): string {
  return renderTemplateText(bodyHtml ?? '', variables);
}

/**
 * Generates a plain-text version from HTML for multipart emails.
 */
export function htmlToText(html: string): string {
  return html
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<[^>]+>/g, '\n')
    .replace(/&nbsp;/g, ' ')
    .replace(/&/g, '&')
    .replace(/</g, '<')
    .replace(/>/g, '>')
    .replace(/"/g, '"')
    .replace(/'/g, "'")
    .replace(/\n\s*\n/g, '\n\n')
    .trim();
}

/**
 * Branded email shell — table layout with inline CSS (email-client safe).
 * The `juice` package inlines the stylesheet so no `<style>` block survives.
 * `previewText` (optional) renders as a hidden preheader inside the body cell.
 */
export function buildBrandedEmailHtml(bodyHtml: string, previewText?: string): string {
  const siteUrl = resolveSiteUrl();
  const year = new Date().getFullYear();

  const preheader = previewText?.trim()
    ? `<div style="display:none;max-height:0;overflow:hidden;mso-hide:all;">${previewText.trim()}</div>\n`
    : '';

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<meta name="color-scheme" content="light" />
<title>Deni Sawa Partners</title>
<style>
  .ds-outer { background:#F9F7F5; padding:24px 0; }
  .ds-shell { width:100%; max-width:600px; margin:0 auto; border-collapse:collapse; }
  .ds-header-bar { background:#E8510A; height:6px; }
  .ds-header { background:#FFFFFF; text-align:center; padding:28px 32px 20px; border-bottom:1px solid #F0EAE4; }
  .ds-header img { display:inline-block; width:200px; max-width:220px; height:auto; border:0; outline:none; text-decoration:none; }
  .ds-tagline { color:#8A857F; font-family:Arial,sans-serif; font-size:10px; letter-spacing:0.32em; text-transform:uppercase; margin-top:6px; }
  .ds-body { background:#FFFFFF; padding:32px; font-family:Arial,Helvetica,sans-serif; color:#1A1A1A; font-size:15px; line-height:1.7; }
  .ds-body a { color:#E8510A; font-weight:600; }
  .ds-body p { margin:0 0 16px; }
  .ds-body h1 { font-family:Georgia,'Times New Roman',serif; font-size:24px; line-height:1.3; margin:0 0 16px; }
  .ds-body h2 { font-family:Georgia,'Times New Roman',serif; font-size:18px; margin:0 0 12px; }
  .ds-body ul, .ds-body ol { margin:0 0 16px; padding-left:24px; }
  .ds-body blockquote { margin:0 0 16px; padding:12px 16px; border-left:3px solid #E8510A; background:#FDF3EC; }
  .ds-body img { max-width:100%; height:auto; }
  .ds-button { display:inline-block; background:#E8510A; color:#FFFFFF !important; text-decoration:none; font-family:Arial,sans-serif; font-size:15px; font-weight:bold; padding:13px 28px; border-radius:6px; margin:8px 0 16px; }
  .ds-footer { background:#F9F7F5; text-align:center; padding:24px 32px; font-family:Arial,sans-serif; color:#6B7280; font-size:12px; line-height:1.7; }
  .ds-footer a { color:#E8510A; }
  .ds-divider { height:1px; background:#E5E5E5; margin:20px 0; }
</style>
</head>
<body style="margin:0;padding:0;background:#F9F7F5;">
  <table class="ds-outer" role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
    <tr><td align="center">
      <table class="ds-shell" role="presentation" cellpadding="0" cellspacing="0" border="0">
        <tr><td class="ds-header-bar"></td></tr>
        <tr><td class="ds-header">
          <img
            src="${siteUrl}/Deni-sawa-main-logo.webp"
            alt="Deni Sawa Partners"
            width="200"
            style="display:inline-block; width:200px; max-width:220px; height:auto; border:0; outline:none;"
          />
          <div class="ds-tagline">Partners</div>
        </td></tr>
        <tr><td class="ds-body">${preheader}${bodyHtml}</td></tr>
        <tr><td class="ds-footer">
          <p style="margin:0 0 8px;">Deni Sawa Partners · Financial coaching, advisory &amp; debt solutions.</p>
          <p style="margin:0 0 8px;">Nairobi, Kenya</p>
          <p style="margin:0 0 10px;">
            <a href="${site.social.facebook}">Facebook</a> &nbsp;·&nbsp;
            <a href="${site.social.instagram}">Instagram</a> &nbsp;·&nbsp;
            <a href="${site.social.linkedin}">LinkedIn</a> &nbsp;·&nbsp;
            <a href="${site.social.tiktok}">TikTok</a> &nbsp;·&nbsp;
            <a href="${site.social.youtube}">YouTube</a>
          </p>
          <p style="margin:0;"><a href="${siteUrl}">${siteUrl}</a></p>
          <div class="ds-divider"></div>
          <p style="margin:0;">&copy; ${year} Deni Sawa Partners. All rights reserved.</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

  try {
    return juice(html, { removeStyleTags: true, preserveMediaQueries: false });
  } catch {
    return html;
  }
}

export interface SmtpStatus {
  ok: boolean;
  error?: string;
  host?: string;
  port?: number;
  secure?: boolean;
  user?: string;
}

/** Reads the SMTP connection settings from env. EMAIL_* are canonical; SMTP_* legacy. */
export function smtpConfig() {
  const host = process.env.EMAIL_HOST ?? process.env.SMTP_HOST;
  const user = process.env.EMAIL_USER ?? process.env.SMTP_USER;
  const pass = process.env.EMAIL_PASS ?? process.env.SMTP_PASSWORD;
  const port = Number(process.env.EMAIL_PORT ?? process.env.SMTP_PORT ?? 587);
  const secure = (process.env.EMAIL_SECURE ?? process.env.SMTP_SECURE ?? '').toLowerCase() === 'true';
  return { host, user, pass, port, secure };
}

let smtpTransporter: ReturnType<typeof nodemailer.createTransport> | null = null;
let smtpChecked: string | null = null;

/** Verifies the SMTP connection and caches the result (per host/user). Never throws. */
export async function verifySmtpConnection(): Promise<SmtpStatus> {
  const { host, user, pass, port, secure } = smtpConfig();
  if (!host || !user || !pass) {
    return { ok: false, error: 'SMTP is not configured.', host, port, secure, user };
  }

  const cacheKey = `${host}:${port}:${user}`;
  if (smtpTransporter && smtpChecked === cacheKey) {
    return { ok: true, host, port, secure, user };
  }

  const transporter = nodemailer.createTransport({ host, port, secure, auth: { user, pass } });
  try {
    await transporter.verify();
    smtpTransporter = transporter;
    smtpChecked = cacheKey;
    return { ok: true, host, port, secure, user };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown SMTP error';
    try {
      transporter.close();
    } catch {
      /* ignore */
    }
    return { ok: false, error: message, host, port, secure, user };
  }
}

/** True for transient SMTP errors worth retrying (network/TLS issues, not auth rejections). */
function isTransientSmtpError(error: unknown): boolean {
  const message = (error instanceof Error ? error.message : String(error)).toLowerCase();
  if (message.includes('535') || message.includes('authentication') || message.includes('invalid login')) return false;
  return (
    message.includes('econn') ||
    message.includes('etimedout') ||
    message.includes('eai') ||
    message.includes('socket') ||
    message.includes('tls') ||
    message.includes('ssl') ||
    message.includes('530')
  );
}

/** Sends email via Nodemailer + domain SMTP. Best-effort — never throws. */
export async function sendEmail(payload: EmailSendPayload): Promise<EmailSendResult> {
  const { host, user, pass, port, secure } = smtpConfig();
  if (!host || !user || !pass) {
    return { ok: false, error: 'SMTP is not configured.' };
  }

  const transporter = smtpTransporter && smtpChecked === `${host}:${port}:${user}` ? smtpTransporter : nodemailer.createTransport({ host, port, secure, auth: { user, pass } });

  try {
    await transporter.verify();
    if (!smtpTransporter) {
      smtpTransporter = transporter;
      smtpChecked = `${host}:${port}:${user}`;
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown SMTP error';
    console.error(`SMTP verify failed (${user}@${host}:${port}):`, message);
    return { ok: false, error: `SMTP connection failed: ${message}` };
  }

  const attemptSend = async (): Promise<EmailSendResult> => {
    try {
      const info = await transporter.sendMail({
        from: {
          name: payload.fromName ?? process.env.SMTP_FROM_NAME ?? 'Deni Sawa Partners',
          address: payload.fromEmail ?? process.env.SMTP_FROM_EMAIL ?? 'noreply@denisawa.co.ke',
        },
        replyTo: payload.replyTo,
        to: payload.toName ? `"${payload.toName}" <${payload.to}>` : payload.to,
        subject: payload.subject,
        html: payload.html,
        text: payload.text,
      });
      return { ok: true, messageId: info.messageId };
    } catch (error) {
      return { ok: false, error: error instanceof Error ? error.message : 'Unknown SMTP error' };
    }
  };

  const first = await attemptSend();
  if (first.ok || !isTransientSmtpError(first.error)) return first;

  const retry = await attemptSend();
  if (retry.ok) return retry;
  console.error('sendEmail failed (after retry):', retry.error);
  return retry;
}

async function logEmail(
  supabase: SupabaseClient | null,
  entry: {
    templateKey?: string;
    toEmail: string;
    toName?: string;
    subject: string;
    bodyHtml: string;
    variables?: Record<string, unknown>;
    messageId?: string;
    status: 'pending' | 'sent' | 'failed' | 'bounced';
    error?: string;
    reportId?: string;
    sessionId?: string;
  }
) {
  if (!supabase) return;
  try {
    await supabase.from('email_log').insert({
      template_key: entry.templateKey,
      to_email: entry.toEmail,
      to_name: entry.toName,
      subject: entry.subject,
      body_html: entry.bodyHtml,
      variables_used: entry.variables ?? {},
      smtp_message_id: entry.messageId,
      status: entry.status,
      error_message: entry.error,
      report_id: entry.reportId,
      session_id: entry.sessionId,
      attempts: 1,
      last_attempted_at: new Date().toISOString(),
      ...(entry.status === 'sent' ? { sent_at: new Date().toISOString() } : {}),
    });
  } catch (error) {
    console.error('Failed to log email:', error);
  }
}

export interface TemplatedEmailOptions {
  template: EmailTemplateRow;
  to: string;
  toName?: string;
  variables?: Record<string, unknown>;
  reportId?: string;
  sessionId?: string;
}

/**
 * Renders a template (subject + branded HTML body), sends it, and logs the
 * attempt to email_log. Returns the send result.
 */
export async function sendTemplatedEmail(
  supabase: SupabaseClient | null,
  options: TemplatedEmailOptions
): Promise<EmailSendResult> {
  const { template, to, toName, variables = {}, reportId, sessionId } = options;

  const subject = renderTemplateText(template.subject, variables);
  const previewText = renderTemplateText(template.preview_text ?? '', variables).trim() || undefined;
  const body = buildBrandedEmailHtml(renderTemplateHtml(template.body_html, variables), previewText);
  const text = htmlToText(body);

  const result = await sendEmail({
    to,
    toName,
    templateKey: template.template_key,
    subject,
    html: body,
    text,
    variables,
    replyTo: template.reply_to ?? undefined,
    fromName: template.from_name,
    fromEmail: template.from_email,
    reportId,
    sessionId,
  });

  await logEmail(supabase, {
    templateKey: template.template_key,
    toEmail: to,
    toName,
    subject,
    bodyHtml: body,
    variables,
    messageId: result.messageId,
    status: result.ok ? 'sent' : 'failed',
    error: result.error,
    reportId,
    sessionId,
  });

  return result;
}

export { resolveSiteUrl };
