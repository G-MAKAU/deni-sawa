import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getServiceClient } from '@/lib/supabase/service';

export const dynamic = 'force-dynamic';

const resetSchema = z.object({
  email: z.string().email(),
  token: z.string().min(20),
  password: z.string().min(8).max(72),
});

/**
 * Completes a password reset. Verifies the emailed token, then updates the
 * Supabase Auth password for the linked auth user (via the service-role
 * client) and clears the token so it cannot be reused.
 */
export async function POST(request: Request) {
  try {
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
    }

    const parsed = resetSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Please provide your email, the reset link and a new password.' }, { status: 422 });
    }

    const email = parsed.data.email.toLowerCase();
    const supabase = getServiceClient();

    const { data: admin } = await supabase
      .from('admin_users')
      .select('id, full_name, email, auth_user_id, reset_token, reset_token_expires_at')
      .eq('email', email)
      .maybeSingle();

    if (!admin) {
      return NextResponse.json({ error: 'This reset link is invalid or has expired.' }, { status: 422 });
    }

    if (!admin.reset_token || admin.reset_token !== parsed.data.token) {
      return NextResponse.json({ error: 'This reset link is invalid or has already been used.' }, { status: 422 });
    }

    if (!admin.reset_token_expires_at || new Date(admin.reset_token_expires_at).getTime() < Date.now()) {
      return NextResponse.json({ error: 'This reset link has expired. Please request a new one.' }, { status: 422 });
    }

    // Find the linked Supabase Auth user and update the password.
    const authUserId = admin.auth_user_id as string | null;
    if (authUserId) {
      const { error: authError } = await supabase.auth.admin.updateUserById(authUserId, {
        password: parsed.data.password,
      });
      if (authError) {
        console.error('Auth password update failed:', authError);
        return NextResponse.json({ error: 'We could not update your password. Please try again.' }, { status: 500 });
      }
    } else {
      return NextResponse.json(
        { error: 'This account is not linked to a sign-in user. Contact a super admin.' },
        { status: 422 }
      );
    }

    const { error: clearError } = await supabase
      .from('admin_users')
      .update({ reset_token: null, reset_token_expires_at: null })
      .eq('id', admin.id);
    if (clearError) throw clearError;

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Reset password failed:', error);
    return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 });
  }
}
