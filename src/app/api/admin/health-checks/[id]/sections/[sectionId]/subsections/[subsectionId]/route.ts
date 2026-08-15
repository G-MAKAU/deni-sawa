import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { z } from 'zod';
import { requireAdmin, jsonAdminError } from '@/lib/admin-auth';

export const dynamic = 'force-dynamic';

const subsectionParamsSchema = z.object({ id: z.string().uuid(), sectionId: z.string().uuid(), subsectionId: z.string().uuid() });
const updateSchema = z.object({
  heading: z.string().min(1).max(200),
  description: z.string().max(1000).optional().nullable(),
});

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string; sectionId: string; subsectionId: string }> }) {
  try {
    const { supabase } = await requireAdmin(request, 'update');
    const { id, sectionId, subsectionId } = subsectionParamsSchema.parse(await params);

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

    const { data, error } = await supabase
      .from('health_check_subsections')
      .update(parsed.data)
      .eq('id', subsectionId)
      .eq('section_id', sectionId)
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ subsection: data });
  } catch (error) {
    return jsonAdminError(error, 'Failed to update subsection');
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string; sectionId: string; subsectionId: string }> }) {
  try {
    const { supabase } = await requireAdmin(request, 'delete');
    const { id, sectionId, subsectionId } = subsectionParamsSchema.parse(await params);

    const { error } = await supabase
      .from('health_check_subsections')
      .delete()
      .eq('id', subsectionId)
      .eq('section_id', sectionId);
    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    return jsonAdminError(error, 'Failed to delete subsection');
  }
}
