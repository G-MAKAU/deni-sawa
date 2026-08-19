import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { z } from 'zod';
import { requireAdmin, jsonAdminError } from '@/lib/admin-auth';

export const dynamic = 'force-dynamic';

const paramsSchema = z.object({ id: z.string().uuid() });

const updateSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  slug: z.string().min(1).max(200).optional(),
  category: z.string().min(1).max(100).optional(),
  format: z.string().min(1).max(100).optional(),
  duration: z.string().min(1).max(100).optional(),
  level: z.string().min(1).max(100).optional(),
  description: z.string().max(2000).nullable().optional(),
  image_url: z.string().max(500).nullable().optional(),
  is_featured: z.boolean().optional(),
  is_active: z.boolean().optional(),
  sort_order: z.number().int().optional(),
});

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { supabase } = await requireAdmin(request, 'update');
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

    const { data, error } = await supabase.from('lms_courses').update(parsed.data).eq('id', id).select().single();
    if (error) throw error;

    return NextResponse.json({ course: data });
  } catch (error) {
    return jsonAdminError(error, 'Failed to update course');
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { supabase } = await requireAdmin(request, 'delete');
    const { id } = paramsSchema.parse(await params);

    const { error } = await supabase.from('lms_courses').delete().eq('id', id);
    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    return jsonAdminError(error, 'Failed to delete course');
  }
}
