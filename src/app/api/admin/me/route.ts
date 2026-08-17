import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requireBlogAdmin, jsonAdminError } from '../_auth';
import { adminWriteClient } from '@/lib/admin-auth';

const updateSchema = z.object({
  full_name: z.string().min(1).max(200),
});

export async function GET(request: Request) {
  try {
    const { currentAdmin } = await requireBlogAdmin(request as Parameters<typeof requireBlogAdmin>[0], 'read');

    return NextResponse.json({
      admin: {
        id: currentAdmin.id,
        email: currentAdmin.email,
        full_name: currentAdmin.full_name,
        role: currentAdmin.role,
      },
    });
  } catch (error) {
    return jsonAdminError(error, 'Failed to load admin session');
  }
}

/** Updates the signed-in admin's own profile details. */
export async function PUT(request: Request) {
  try {
    const context = await requireBlogAdmin(
      request as Parameters<typeof requireBlogAdmin>[0],
      'update'
    );
    const { currentAdmin } = context;

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

    const { data, error } = await supabase
      .from('admin_users')
      .update({ full_name: parsed.data.full_name })
      .eq('id', currentAdmin.id)
      .select('id, email, full_name, role')
      .single();

    if (error) throw error;

    return NextResponse.json({ admin: data });
  } catch (error) {
    return jsonAdminError(error, 'Failed to update admin details');
  }
}
