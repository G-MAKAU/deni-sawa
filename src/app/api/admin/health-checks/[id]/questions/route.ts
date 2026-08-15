import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { z } from 'zod';
import { requireAdmin, jsonAdminError } from '@/lib/admin-auth';

export const dynamic = 'force-dynamic';

const checkParamsSchema = z.object({ id: z.string().uuid() });

const QUESTION_TYPES = ['paragraph', 'single_select', 'multi_select'] as const;

const createQuestionSchema = z.object({
  subsection_id: z.string().uuid(),
  question_text: z.string().min(1).max(2000),
  question_type: z.enum(QUESTION_TYPES),
  is_required: z.boolean().optional(),
  helper_text: z.string().max(500).optional().nullable(),
  options: z.array(z.object({ option_text: z.string().min(1).max(500) })).max(30).optional(),
});

const reorderSchema = z.object({ questions: z.array(z.object({ id: z.string().uuid(), sort_order: z.number().int().min(0) })).min(1) });

/** Questions for one subsection, each with its options, ordered. */
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { supabase } = await requireAdmin(request, 'read');
    const { id } = checkParamsSchema.parse(await params);

    const subsectionId = request.nextUrl.searchParams.get('subsection_id');
    if (!subsectionId) return NextResponse.json({ error: 'subsection_id query parameter is required' }, { status: 400 });

    const { data: questions, error } = await supabase
      .from('health_check_questions')
      .select('*, options:health_check_question_options(*)')
      .eq('subsection_id', subsectionId)
      .order('sort_order', { ascending: true });

    if (error) throw error;

    const normalized = (questions ?? []).map((question: Record<string, unknown>) => {
      const options = Array.isArray(question.options) ? question.options : [];
      return {
        ...question,
        options: Array.isArray(options) && typeof options[0] === 'object' ? options : [],
      };
    });

    return NextResponse.json({ questions: normalized });
  } catch (error) {
    return jsonAdminError(error, 'Failed to load questions');
  }
}

/** Creates a question (and its options) under a subsection of this check. */
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

    const parsed = createQuestionSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Validation failed', details: parsed.error.flatten() }, { status: 422 });
    }

    const { subsection_id, question_text, question_type, is_required, helper_text, options } = parsed.data;

    // Verify the subsection belongs to this check.
    const { data: subsection, error: subError } = await supabase
      .from('health_check_subsections')
      .select('id, section_id')
      .eq('id', subsection_id)
      .maybeSingle();
    if (subError) throw subError;
    if (!subsection) return NextResponse.json({ error: 'Subsection not found' }, { status: 404 });

    const { data: section } = await supabase.from('health_check_sections').select('id').eq('id', subsection.section_id).eq('health_check_id', id).maybeSingle();
    if (!section) return NextResponse.json({ error: 'Subsection does not belong to this health check.' }, { status: 400 });

    // Single/multi select questions require options; paragraph questions must not have any.
    if ((question_type === 'single_select' || question_type === 'multi_select') && (!options || options.length === 0)) {
      return NextResponse.json({ error: 'Select questions require at least one option.' }, { status: 422 });
    }
    if (question_type === 'paragraph' && options && options.length > 0) {
      return NextResponse.json({ error: 'Paragraph questions cannot have options.' }, { status: 422 });
    }

    const { count } = await supabase
      .from('health_check_questions')
      .select('id', { count: 'exact', head: true })
      .eq('subsection_id', subsection_id);
    if (count === null) throw new Error('Failed to count questions');

    const { data: question, error: questionError } = await supabase
      .from('health_check_questions')
      .insert({
        subsection_id,
        question_text,
        question_type,
        is_required: is_required ?? true,
        helper_text,
        sort_order: (count ?? 0) + 1,
      })
      .select()
      .single();
    if (questionError) throw questionError;

    let savedOptions: unknown[] = [];
    if (options && options.length > 0) {
      const { data, error } = await supabase
        .from('health_check_question_options')
        .insert(options.map((option, index) => ({ question_id: question.id, option_text: option.option_text, sort_order: index + 1 })))
        .select();
      if (error) throw error;
      savedOptions = data ?? [];
    }

    return NextResponse.json({ question: { ...question, options: savedOptions } }, { status: 201 });
  } catch (error) {
    return jsonAdminError(error, 'Failed to create question');
  }
}

/** Bulk reorder of questions within a subsection. */
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

    const ids = parsed.data.questions.map((q) => q.id);
    const { data: existing } = await supabase
      .from('health_check_questions')
      .select('id')
      .in('id', ids);

    if ((existing ?? []).length !== ids.length) {
      return NextResponse.json({ error: 'One or more questions were not found.' }, { status: 400 });
    }

    for (const item of parsed.data.questions) {
      const { error } = await supabase.from('health_check_questions').update({ sort_order: item.sort_order }).eq('id', item.id);
      if (error) throw error;
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return jsonAdminError(error, 'Failed to reorder questions');
  }
}
