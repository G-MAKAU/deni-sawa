import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { z } from 'zod';
import { requireAdmin, jsonAdminError } from '@/lib/admin-auth';

export const dynamic = 'force-dynamic';

const checkParamsSchema = z.object({ id: z.string().uuid() });
const createSectionSchema = z.object({ title: z.string().min(1).max(200), description: z.string().max(1000).optional().nullable() });
const reorderSchema = z.object({ sections: z.array(z.object({ id: z.string().uuid(), sort_order: z.number().int().min(0) })).min(1) });

/** Returns the full section → subsection tree for a health check, ordered. */
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { supabase } = await requireAdmin(request, 'read');
    const { id } = checkParamsSchema.parse(await params);

    const { data: sections, error: sectionsError } = await supabase
      .from('health_check_sections')
      .select('*')
      .eq('health_check_id', id)
      .order('sort_order', { ascending: true });

    if (sectionsError) throw sectionsError;

    const sectionIds = (sections ?? []).map((s) => s.id);
    let subsections: any[] = [];
    if (sectionIds.length > 0) {
      const { data, error } = await supabase
        .from('health_check_subsections')
        .select('*')
        .in('section_id', sectionIds)
        .order('sort_order', { ascending: true });
      if (error) throw error;
      subsections = data ?? [];
    }

    const grouped = (sections ?? []).map((section) => ({
      ...section,
      subsections: subsections.filter((sub: { section_id: string }) => sub.section_id === section.id),
    }));

    return NextResponse.json({ sections: grouped });
  } catch (error) {
    return jsonAdminError(error, 'Failed to load sections');
  }
}

/** Creates a new section at the end of the check. */
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { supabase } = await requireAdmin(request, 'create');
    const { id } = checkParamsSchema.parse(await params);

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
    }

    const parsed = createSectionSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Validation failed', details: parsed.error.flatten() }, { status: 422 });
    }

    const { count } = await supabase
      .from('health_check_sections')
      .select('id', { count: 'exact', head: true })
      .eq('health_check_id', id);
    if (count === null) throw new Error('Failed to count sections');

    const { data, error } = await supabase
      .from('health_check_sections')
      .insert({ health_check_id: id, title: parsed.data.title, description: parsed.data.description, sort_order: (count ?? 0) + 1 })
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ section: data }, { status: 201 });
  } catch (error) {
    return jsonAdminError(error, 'Failed to create section');
  }
}

/** Bulk reorder of sections (drag-to-reorder). */
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { supabase } = await requireAdmin(request, 'update');
    const { id } = checkParamsSchema.parse(await params);

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

    // Verify all sections belong to this check before reordering.
    const ids = parsed.data.sections.map((s) => s.id);
    const { data: existing } = await supabase.from('health_check_sections').select('id').eq('health_check_id', id).in('id', ids);
    if ((existing ?? []).length !== ids.length) {
      return NextResponse.json({ error: 'One or more sections do not belong to this health check.' }, { status: 400 });
    }

    for (const item of parsed.data.sections) {
      const { error } = await supabase
        .from('health_check_sections')
        .update({ sort_order: item.sort_order })
        .eq('id', item.id)
        .eq('health_check_id', id);
      if (error) throw error;
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return jsonAdminError(error, 'Failed to reorder sections');
  }
}
