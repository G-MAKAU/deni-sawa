import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { z } from 'zod';
import { requireAdmin, jsonAdminError } from '@/lib/admin-auth';

export const dynamic = 'force-dynamic';

const sectionParamsSchema = z.object({ id: z.string().uuid(), sectionId: z.string().uuid() });
const updateSectionSchema = z.object({ title: z.string().min(1).max(200), description: z.string().max(1000).optional().nullable() });
const createSubsectionSchema = z.object({
  heading: z.string().min(1).max(200),
  description: z.string().max(1000).optional().nullable(),
});

/** PUT — update a section's title/description. */
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string; sectionId: string }> }) {
  try {
    const { supabase } = await requireAdmin(request, 'update');
    const { id, sectionId } = sectionParamsSchema.parse(await params);

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
    }

    const parsed = updateSectionSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Validation failed', details: parsed.error.flatten() }, { status: 422 });
    }

    const { data, error } = await supabase
      .from('health_check_sections')
      .update(parsed.data)
      .eq('id', sectionId)
      .eq('health_check_id', id)
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ section: data });
  } catch (error) {
    return jsonAdminError(error, 'Failed to update section');
  }
}

/** POST — create a subsection under this section. */
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string; sectionId: string }> }) {
  try {
    const { supabase } = await requireAdmin(request, 'create');
    const { id, sectionId } = sectionParamsSchema.parse(await params);

    // Verify the section belongs to the check.
    const { data: section, error: sectionError } = await supabase
      .from('health_check_sections')
      .select('id')
      .eq('id', sectionId)
      .eq('health_check_id', id)
      .maybeSingle();
    if (sectionError) throw sectionError;
    if (!section) return NextResponse.json({ error: 'Section not found' }, { status: 404 });

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
    }

    const parsed = createSubsectionSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Validation failed', details: parsed.error.flatten() }, { status: 422 });
    }

    const { count } = await supabase
      .from('health_check_subsections')
      .select('id', { count: 'exact', head: true })
      .eq('section_id', sectionId);
    if (count === null) throw new Error('Failed to count subsections');

    const { data, error } = await supabase
      .from('health_check_subsections')
      .insert({ section_id: sectionId, heading: parsed.data.heading, description: parsed.data.description, sort_order: (count ?? 0) + 1 })
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ subsection: data }, { status: 201 });
  } catch (error) {
    return jsonAdminError(error, 'Failed to create subsection');
  }
}

/** DELETE — remove the section (cascades). */
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string; sectionId: string }> }) {
  try {
    const { supabase } = await requireAdmin(request, 'delete');
    const { id, sectionId } = sectionParamsSchema.parse(await params);

    const { error } = await supabase
      .from('health_check_sections')
      .delete()
      .eq('id', sectionId)
      .eq('health_check_id', id);
    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    return jsonAdminError(error, 'Failed to delete section');
  }
}
