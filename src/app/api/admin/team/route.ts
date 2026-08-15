import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { z } from 'zod';
import { requireAdmin, adminWriteClient, jsonAdminWriteError, AdminApiError } from '@/lib/admin-auth';

export const dynamic = 'force-dynamic';

const ADMIN_ROLES = ['super_admin', 'admin', 'manager', 'support'] as const;

const createSchema = z.object({
  full_name: z.string().min(1).max(200),
  email: z.string().email(),
  role: z.enum(ADMIN_ROLES),
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

    return NextResponse.json({ member: data }, { status: 201 });
  } catch (error) {
    return jsonAdminWriteError(error, 'Failed to add team member');
  }
}
