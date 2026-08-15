import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { z } from 'zod';
import { requireAdmin, jsonAdminError } from '@/lib/admin-auth';

export const dynamic = 'force-dynamic';

const paramsSchema = z.object({ id: z.string().uuid(), sectionId: z.string().uuid() });
const reorderSchema = z.object({ subsections: z.array(z.object({ id: z.string().uuid(), sort_order: z.number().int().min(0) })).min(1) });

/** Bulk reorder of subsections within a section (drag-to-reorder). */
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string; sectionId: string }> }) {
  try {
    const { supabase } = await requireAdmin(request, 'update');
    const { id, sectionId } = paramsSchema.parse(await params);

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
    }

    const parsed = reorderSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Validation failed', details: parsed.error.flatten() }, { status: 422 });
    }

    const ids = parsed.data.subsections.map((s) => s.id);
    const { data: existing } = await supabase
      .from('health_check_subsections')
      .select('id')
      .eq('section_id', sectionId);
    if ((existing ?? []).length !== ids.length) {
      return NextResponse.json({ error: 'One or more subsections do not belong to this section.' }, { status: 400 });
    }

    for (const item of parsed.data.subsections) {
      const { error } = await supabase
        .from('health_check_subsections')
        .update({ sort_order: item.sort_order })
        .eq('id', item.id)
        .eq('section_id', sectionId);
      if (error) throw error;
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return jsonAdminError(error, 'Failed to reorder subsections');
  }
}
