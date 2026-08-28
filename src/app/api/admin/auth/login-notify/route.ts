import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { sendEmail, buildBrandedEmailHtml } from '@/lib/email';
import { site } from '@/data/site';

export const dynamic = 'force-dynamic';

/** In-memory throttle: max 1 email per admin per 10 minutes. Resets on cold start. */
const lastNotified = new Map<string, number>();
const THROTTLE_MS = 10 * 60 * 1000;

function parseUserAgent(ua: string | null): string {
  if (!ua) return 'Unknown browser';
  // Simple heuristic extraction
  const browsers: [RegExp, string][] = [
    [/Edg[e\/]([\d.]+)/, 'Edge'],
    [/OPR\/([\d.]+)/, 'Opera'],
    [/Chrome\/([\d.]+)/, 'Chrome'],
    [/Firefox\/([\d.]+)/, 'Firefox'],
    [/Version\/([\d.]+).*Safari/, 'Safari'],
  ];
  const oses: [RegExp, string][] = [
    [/Windows NT 10\.0/, 'Windows 10/11'],
    [/Windows NT 6\.1/, 'Windows 7'],
    [/Mac OS X ([\d_]+)/, 'macOS'],
    [/Android ([\d.]+)/, 'Android'],
    [/iPhone OS ([\d_]+)/, 'iOS'],
    [/Linux/, 'Linux'],
  ];

  let browser = 'Unknown browser';
  for (const [re, name] of browsers) {
    if (re.test(ua)) { browser = name; break; }
  }
  let os = 'Unknown OS';
  for (const [re, name] of oses) {
    if (re.test(ua)) { os = name; break; }
  }
  return `${browser} on ${os}`;
}

function getClientIp(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0].trim();
  const real = request.headers.get('x-real-ip');
  if (real) return real;
  return 'Unknown';
}

/**
 * Sends a login notification email to the admin and CCs ADMIN_NOTIFY_EMAIL.
 * Throttled to max 1 per 10 minutes per admin email (in-memory).
 */
export async function POST(request: NextRequest) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey =
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY;

    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json({ ok: true, skipped: true });
    }

    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');
    if (!token) return NextResponse.json({ ok: true, skipped: true });

    const authClient = createClient(supabaseUrl, supabaseKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
    const { data: { user } } = await authClient.auth.getUser(token);
    if (!user?.email) return NextResponse.json({ ok: true, skipped: true });

    const email = user.email.toLowerCase();

    // Throttle check
    const last = lastNotified.get(email);
    if (last && Date.now() - last < THROTTLE_MS) {
      return NextResponse.json({ ok: true, throttled: true });
    }
    lastNotified.set(email, Date.now());

    // Build email content
    const ip = getClientIp(request);
    const browser = parseUserAgent(request.headers.get('user-agent'));
    const now = new Date();
    const timeStr = now.toLocaleString('en-KE', {
      timeZone: 'Africa/Nairobi',
      dateStyle: 'medium',
      timeStyle: 'short',
    });

    const adminEmail = process.env.ADMIN_NOTIFY_EMAIL ?? site.email;

    const bodyHtml = `
      <h1>Admin login recorded</h1>
      <p>A successful login was recorded for your admin account on <strong>Deni Sawa Partners</strong>.</p>
      <table style="width:100%;border-collapse:collapse;margin:16px 0;">
        <tr>
          <td style="padding:8px 12px;font-weight:600;color:#555;border-bottom:1px solid #eee;">Time</td>
          <td style="padding:8px 12px;border-bottom:1px solid #eee;">${timeStr} EAT</td>
        </tr>
        <tr>
          <td style="padding:8px 12px;font-weight:600;color:#555;border-bottom:1px solid #eee;">IP Address</td>
          <td style="padding:8px 12px;border-bottom:1px solid #eee;">${ip}</td>
        </tr>
        <tr>
          <td style="padding:8px 12px;font-weight:600;color:#555;border-bottom:1px solid #eee;">Browser</td>
          <td style="padding:8px 12px;border-bottom:1px solid #eee;">${browser}</td>
        </tr>
      </table>
      <p style="color:#999;font-size:12px;">If this wasn't you, reset your password immediately and contact the system administrator.</p>
    `;

    // Send to the admin who logged in + CC the admin notification email
    const recipients = [email];
    if (adminEmail && adminEmail.toLowerCase() !== email) {
      recipients.push(adminEmail);
    }

    await sendEmail({
      to: recipients.join(','),
      subject: `Admin login — ${site.name}`,
      html: buildBrandedEmailHtml(bodyHtml, 'Admin login recorded'),
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    // Don't fail the login flow if email fails
    console.error('Login notification failed:', error);
    return NextResponse.json({ ok: true, error: 'Notification failed' });
  }
}
