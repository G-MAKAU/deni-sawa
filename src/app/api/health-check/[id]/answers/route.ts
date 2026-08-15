import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { z } from 'zod';
import { getServiceClient } from '@/lib/supabase/service';

export const dynamic = 'force-dynamic';

const answerSchema = z.object({
  question_id: z.string().uuid(),
  answer_text: z.string().max(20000).nullable().optional(),
  selected_option_ids: z.array(z.string().uuid()).optional(),
});

const submitSchema = z.object({
  answers: z.array(answerSchema).min(1).max(500),
});

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const parsed = submitSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Validation failed', details: parsed.error.flatten() }, { status: 422 });
  }

  try {
    const supabase = getServiceClient();
    const { id: sessionId } = await params;

    const { data: session, error: sessionError } = await supabase
      .from('health_check_sessions')
      .select('*')
      .eq('id', sessionId)
      .maybeSingle();
    if (sessionError) throw sessionError;
    if (!session) return NextResponse.json({ error: 'Session not found.' }, { status: 404 });

    if (session.is_complete) {
      return NextResponse.json({ error: 'This session has already been completed.' }, { status: 409 });
    }

    // Load the question bank for this check.
    const { data: sections } = await supabase
      .from('health_check_sections')
      .select('id')
      .eq('health_check_id', session.health_check_id);
    const sectionIds = (sections ?? []).map((s) => s.id);
    const { data: subsections } = await supabase
      .from('health_check_subsections')
      .select('id')
      .in('section_id', sectionIds);
    const subsectionIds = (subsections ?? []).map((s) => s.id);
    const { data: questions } = await supabase
      .from('health_check_questions')
      .select('id, question_type, is_required')
      .in('subsection_id', subsectionIds);

    const questionById = new Map((questions ?? []).map((q) => [q.id, q]));
    const submittedIds = new Set<string>();
    const rows: {
      session_id: string;
      question_id: string;
      answer_text: string | null;
      selected_option_ids: string[];
    }[] = [];

    for (const answer of parsed.data.answers) {
      const question = questionById.get(answer.question_id);
      if (!question) {
        return NextResponse.json({ error: `Question ${answer.question_id} is not part of this health check.` }, { status: 422 });
      }

      const optionIds = answer.selected_option_ids ?? [];
      const answerText = answer.answer_text ?? null;

      switch (question.question_type as string) {
        case 'paragraph': {
          if (!answerText || !answerText.trim()) {
            return NextResponse.json({ error: 'Paragraph answers require text.' }, { status: 422 });
          }
          if (optionIds.length > 0) {
            return NextResponse.json({ error: 'Paragraph answers cannot reference options.' }, { status: 422 });
          }
          rows.push({ session_id: sessionId, question_id: answer.question_id, answer_text: answerText, selected_option_ids: [] });
          break;
        }
        case 'single_select': {
          if (optionIds.length !== 1) {
            return NextResponse.json({ error: 'Single select questions require exactly one option.' }, { status: 422 });
          }
          if (answerText) {
            return NextResponse.json({ error: 'Select answers must not include free text.' }, { status: 422 });
          }
          rows.push({ session_id: sessionId, question_id: answer.question_id, answer_text: null, selected_option_ids: optionIds });
          break;
        }
        case 'multi_select': {
          if (optionIds.length < 1) {
            return NextResponse.json({ error: 'Multi select questions require at least one option.' }, { status: 422 });
          }
          if (answerText) {
            return NextResponse.json({ error: 'Select answers must not include free text.' }, { status: 422 });
          }
          rows.push({ session_id: sessionId, question_id: answer.question_id, answer_text: null, selected_option_ids: optionIds });
          break;
        }
        default:
          return NextResponse.json({ error: 'Unknown question type.' }, { status: 422 });
      }
      submittedIds.add(answer.question_id);
    }

    // Required questions must all be answered.
    const unansweredRequired = (questions ?? []).filter(
      (q) => q.is_required && !submittedIds.has(q.id)
    );
    if (unansweredRequired.length > 0) {
      return NextResponse.json(
        { error: 'All required questions must be answered.', missing: unansweredRequired.map((q) => q.id) },
        { status: 422 }
      );
    }

    // Upsert answers atomically.
    const { error: insertError } = await supabase.from('health_check_answers').upsert(rows, {
      onConflict: 'session_id,question_id',
    });
    if (insertError) throw insertError;

    const completedAt = new Date().toISOString();
    const timeTaken = Math.max(1, Math.round((Date.now() - new Date(session.started_at).getTime()) / 1000));

    const { data: updated, error: completeError } = await supabase
      .from('health_check_sessions')
      .update({ is_complete: true, completed_at: completedAt, time_taken_seconds: timeTaken })
      .eq('id', sessionId)
      .select()
      .single();
    if (completeError) throw completeError;

    return NextResponse.json({ success: true, session: updated });
  } catch (error) {
    console.error('Failed to submit answers:', error);
    return NextResponse.json({ error: 'Failed to submit answers.' }, { status: 500 });
  }
}
