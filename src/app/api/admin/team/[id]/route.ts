import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { z } from 'zod';
import { requireAdmin, adminWriteClient, jsonAdminWriteError, AdminApiError } from '@/lib/admin-auth';

export const dynamic = 'force-dynamic';

const paramsSchema = z.object({ id: z.string().uuid() });

const updateSchema = z.object({
  full_name: z.string().min(1).max(200).optional(),
  role: z.enum(['super_admin', 'admin', 'manager', 'support']).optional(),
  is_active: z.boolean().optional(),
});

async function requireSuperAdmin(request: NextRequest) {
  const context = await requireAdmin(request, 'update');
  if (context.currentAdmin.role !== 'super_admin') {
    throw new AdminApiError('Only super admins can manage the team.', 403);
  }
  return context;
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const context = await requireSuperAdmin(request);
    const { id } = paramsSchema.parse(await params);

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
    }

    const parsed = updateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Validation failed', details: parsed.error.flatten() }, { status: 422 });
    }

    const supabase = adminWriteClient(context);

    // A user can never change their own role (prevents self-promotion/demotion).
    if (parsed.data.role && parsed.data.role !== context.currentAdmin.role && id === context.currentAdmin.id) {
      return NextResponse.json({ error: 'You cannot change your own role.' }, { status: 422 });
    }

    // Protect against demoting the last super_admin.
    if (parsed.data.role && parsed.data.role !== 'super_admin') {
      const { count } = await supabase
        .from('admin_users')
        .select('id', { count: 'exact', head: true })
        .eq('role', 'super_admin')
        .eq('is_active', true);
      if (count !== null && count <= 1 && id === context.currentAdmin.id) {
        return NextResponse.json({ error: 'You cannot demote the last active super admin.' }, { status: 422 });
      }
    }

    const { data, error } = await supabase.from('admin_users').update(parsed.data).eq('id', id).select().single();
    if (error) throw error;

    return NextResponse.json({ member: data });
  } catch (error) {
    return jsonAdminWriteError(error, 'Failed to update team member');
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const context = await requireSuperAdmin(request);
    const { id } = paramsSchema.parse(await params);

    if (id === context.currentAdmin.id) {
      return NextResponse.json({ error: 'You cannot delete your own account.' }, { status: 422 });
    }

    const supabase = adminWriteClient(context);

    // Never allow the last remaining team member to be removed.
    const { count } = await supabase.from('admin_users').select('id', { count: 'exact', head: true });
    if (count !== null && count <= 1) {
      return NextResponse.json({ error: 'The last team member cannot be removed.' }, { status: 422 });
    }

    const { error } = await supabase.from('admin_users').delete().eq('id', id);
    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    return jsonAdminWriteError(error, 'Failed to delete team member');
  }
}
