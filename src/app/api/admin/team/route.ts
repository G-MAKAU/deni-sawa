import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { z } from 'zod';
import { requireAdmin, adminWriteClient, jsonAdminWriteError, AdminApiError } from '@/lib/admin-auth';
import { getServiceClient } from '@/lib/supabase/service';
import { sendEmail, buildBrandedEmailHtml, resolveSiteUrl } from '@/lib/email';

export const dynamic = 'force-dynamic';

const ADMIN_ROLES = ['super_admin', 'admin', 'manager', 'support'] as const;

const createSchema = z.object({
  full_name: z.string().min(1).max(200),
  email: z.string().email(),
  role: z.enum(ADMIN_ROLES),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  is_active: z.boolean().optional(),
});

async function requireSuperAdmin(request: NextRequest) {
  const context = await requireAdmin(request, 'create');
  if (context.currentAdmin.role !== 'super_admin') {
    throw new AdminApiError('Only super admins can manage the team.', 403);
  }
  return context;
}

export async function GET(request: NextRequest) {
  try {
    const context = await requireSuperAdmin(request);
    const supabase = adminWriteClient(context);

    const { data, error } = await supabase.from('admin_users').select('*').order('created_at', { ascending: true });
    if (error) throw error;

    return NextResponse.json({ team: data ?? [] });
  } catch (error) {
    return jsonAdminWriteError(error, 'Failed to load team');
  }
}

export async function POST(request: NextRequest) {
  try {
    const context = await requireSuperAdmin(request);

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
    }

    const parsed = createSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Validation failed', details: parsed.error.flatten() }, { status: 422 });
    }

    const supabase = adminWriteClient(context);
    const adminAuthClient = getServiceClient().auth;

    const { data: authData, error: authError } = await adminAuthClient.admin.createUser({
      email: parsed.data.email.toLowerCase(),
      password: parsed.data.password,
      email_confirm: true,
    });

    if (authError) {
      if ((authError as { code?: string }).code === '400') {
        return NextResponse.json({ error: 'A Supabase Auth account already exists with this email.' }, { status: 409 });
      }
      throw authError;
    }

    const { data, error } = await supabase
      .from('admin_users')
      .insert({
        full_name: parsed.data.full_name,
        email: parsed.data.email.toLowerCase(),
        role: parsed.data.role,
        is_active: parsed.data.is_active ?? true,
      })
      .select()
      .single();

    if (error) {
      if ((error as { code?: string }).code === '23505') {
        return NextResponse.json({ error: 'A team member with this email already exists.' }, { status: 409 });
      }
      throw error;
    }

    // Send a welcome email to the new team member (best-effort, never blocks creation).
    const siteUrl = resolveSiteUrl();
    const roleLabel = parsed.data.role.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
    const welcomeHtml = `
      <h1>Welcome to Deni Sawa Partners, ${parsed.data.full_name}!</h1>
      <p>You've been added to the team as <strong>${roleLabel}</strong>. Here's everything you need to get started:</p>
      <h2>Your login details</h2>
      <ul>
        <li><strong>Email:</strong> ${parsed.data.email}</li>
        <li><strong>Password:</strong> The password set by the admin who created your account</li>
      </ul>
      <p><a href="${siteUrl}/admin/login" class="ds-button">Log in to the admin panel</a></p>
      <h2>What you can do</h2>
      <ul>
        <li>View and manage health check reports</li>
        <li>Communicate with clients</li>
        <li>Access team tools and settings</li>
      </ul>
      <p>If you have any questions, reach out to the team lead or reply to this email.</p>
      <p>Welcome aboard!</p>
    `;
    try {
      await sendEmail({
        to: parsed.data.email,
        toName: parsed.data.full_name,
        subject: `Welcome to Deni Sawa Partners — ${roleLabel}`,
        html: buildBrandedEmailHtml(welcomeHtml),
      });
    } catch (emailErr) {
      console.error('Team welcome email failed:', emailErr);
    }

    return NextResponse.json({ member: data, authUserId: authData?.user?.id }, { status: 201 });
  } catch (error) {
    return jsonAdminWriteError(error, 'Failed to add team member');
  }
}
