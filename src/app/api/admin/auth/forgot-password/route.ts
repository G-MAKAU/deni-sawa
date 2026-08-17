import { NextResponse } from 'next/server';
import { z } from 'zod';
import crypto from 'node:crypto';
import { getServiceClient } from '@/lib/supabase/service';
import { sendEmail, buildBrandedEmailHtml, resolveSiteUrl } from '@/lib/email';
import { site } from '@/data/site';

export const dynamic = 'force-dynamic';

const RESET_TTL_MS = 60 * 60 * 1000; // 1 hour

const forgotSchema = z.object({ email: z.string().email() });

/**
 * Starts a password reset for an admin user. Looks up the email in admin_users,
 * issues a short-lived token and sends a branded email (with the Deni Sawa
 * logo) containing a reset link. Always returns 200 so the endpoint does not
 * reveal whether an account exists.
 */
export async function POST(request: Request) {
  try {
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
    }

    const parsed = forgotSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Please provide a valid email address.' }, { status: 422 });
    }

    const email = parsed.data.email.toLowerCase();
    const supabase = getServiceClient();

    const { data: admin } = await supabase
      .from('admin_users')
      .select('id, full_name, email, is_active, reset_token_expires_at')
      .eq('email', email)
      .maybeSingle();

    // Always succeed publicly, regardless of whether the account exists.
    if (!admin) return NextResponse.json({ ok: true });

    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + RESET_TTL_MS).toISOString();

    const { error: updateError } = await supabase
      .from('admin_users')
      .update({ reset_token: token, reset_token_expires_at: expiresAt })
      .eq('id', admin.id);
    if (updateError) throw updateError;

    const siteUrl = resolveSiteUrl();
    const resetUrl = `${siteUrl}/admin/reset-password?email=${encodeURIComponent(email)}&token=${token}`;

    const bodyHtml = `
      <h1>Reset your admin password</h1>
      <p>Hi ${admin.full_name},</p>
      <p>We received a request to reset the password for your Deni Sawa Partners admin account. The link below is valid for <strong>one hour</strong>.</p>
      <p style="text-align:center;">
        <a class="ds-button" href="${resetUrl}">Reset my password</a>
      </p>
      <p>If you didn't request this, you can safely ignore this email — your password will stay exactly as it is.</p>
      <div class="ds-divider"></div>
      <p style="color:#6B7280; font-size:13px;">Having trouble with the button? Copy and paste this link into your browser:<br/><a href="${resetUrl}">${resetUrl}</a></p>
    `;

    const result = await sendEmail({
      to: admin.email,
      toName: admin.full_name,
      subject: 'Reset your Deni Sawa admin password',
      html: buildBrandedEmailHtml(bodyHtml),
    });

    if (!result.ok) {
      // Never leak that the account exists — just log and report success.
      console.error('Password reset email failed:', result.error);
      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Forgot password failed:', error);
    return NextResponse.json({ ok: true });
  }
}
