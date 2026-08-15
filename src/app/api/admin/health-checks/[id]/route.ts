import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { z } from 'zod';
import { requireAdmin, jsonAdminError } from '@/lib/admin-auth';

export const dynamic = 'force-dynamic';

const paramsSchema = z.object({ id: z.string().uuid() });

const updateSchema = z.object({
  name: z.string().min(1).max(120).optional(),
  slug: z.string().min(1).max(120).optional(),
  description: z.string().max(1000).nullable().optional(),
  estimated_minutes: z.number().int().min(1).max(600).nullable().optional(),
  tags: z.array(z.string()).max(20).optional(),
  is_active: z.boolean().optional(),
  sort_order: z.number().int().optional(),
});

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { supabase } = await requireAdmin(_request, 'read');
    const { id } = paramsSchema.parse(await params);

    const { data, error } = await supabase
      .from('health_checks')
      .select('*, sections:health_check_sections(count)')
      .eq('id', id)
      .single();

    if (error) throw error;

    const sections = Array.isArray(data.sections) ? data.sections[0] : data.sections;
    return NextResponse.json({ check: { ...data, section_count: (sections as { count?: number } | undefined)?.count ?? 0 } });
  } catch (error) {
    return jsonAdminError(error, 'Failed to load health check');
  }
}

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

    const { data, error } = await supabase.from('health_checks').update(parsed.data).eq('id', id).select().single();
    if (error) throw error;

    return NextResponse.json({ check: data });
  } catch (error) {
    return jsonAdminError(error, 'Failed to update health check');
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { supabase } = await requireAdmin(request, 'delete');
    const { id } = paramsSchema.parse(await params);

    const { error } = await supabase.from('health_checks').delete().eq('id', id);
    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    return jsonAdminError(error, 'Failed to delete health check');
  }
}
