import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { z } from 'zod';
import { requireAdmin, jsonAdminError } from '@/lib/admin-auth';

export const dynamic = 'force-dynamic';

const paramsSchema = z.object({ id: z.string().uuid(), questionId: z.string().uuid() });

const updateSchema = z.object({
  question_text: z.string().min(1).max(2000),
  question_type: z.enum(['paragraph', 'single_select', 'multi_select']),
  is_required: z.boolean().optional(),
  helper_text: z.string().max(500).nullable().optional(),
  /** Full replacement option list (deletes missing rows). */
  options: z.array(z.object({ option_text: z.string().min(1).max(500) })).max(30).optional(),
});

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string; questionId: string }> }) {
  try {
    const { supabase } = await requireAdmin(request, 'update');
    const { id, questionId } = paramsSchema.parse(await params);

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

    const { question_text, question_type, is_required, helper_text, options } = parsed.data;

    // Select questions require options; paragraph questions cannot have them.
    if ((question_type === 'single_select' || question_type === 'multi_select') && (!options || options.length === 0)) {
      return NextResponse.json({ error: 'Select questions require at least one option.' }, { status: 422 });
    }
    if (question_type === 'paragraph' && options && options.length > 0) {
      return NextResponse.json({ error: 'Paragraph questions cannot have options.' }, { status: 422 });
    }

    const { data: question, error } = await supabase
      .from('health_check_questions')
      .update({ question_text, question_type, is_required: is_required ?? true, helper_text })
      .eq('id', questionId)
      .select()
      .single();
    if (error) throw error;

    if (options) {
      await supabase.from('health_check_question_options').delete().eq('question_id', questionId);

      if (options.length > 0) {
        const { data, error: optionError } = await supabase
          .from('health_check_question_options')
          .insert(options.map((option, index) => ({ question_id: questionId, option_text: option.option_text, sort_order: index + 1 })))
          .select();
        if (optionError) throw optionError;
        question.options = data ?? [];
      } else {
        question.options = [];
      }
    }

    return NextResponse.json({ question });
  } catch (error) {
    return jsonAdminError(error, 'Failed to update question');
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string; questionId: string }> }) {
  try {
    const { supabase } = await requireAdmin(request, 'delete');
    const { id, questionId } = paramsSchema.parse(await params);

    const { error } = await supabase.from('health_check_questions').delete().eq('id', questionId);
    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    return jsonAdminError(error, 'Failed to delete question');
  }
}
