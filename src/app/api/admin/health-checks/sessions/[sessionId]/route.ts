import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { z } from 'zod';
import { requireAdmin, jsonAdminError, adminWriteClient, jsonAdminWriteError } from '@/lib/admin-auth';

export const dynamic = 'force-dynamic';

const paramsSchema = z.object({ sessionId: z.string().uuid() });

/** Returns a session's details, its answer tree and any generated reports. */
export async function GET(request: NextRequest, { params }: { params: Promise<{ sessionId: string }> }) {
  try {
    const { supabase } = await requireAdmin(request, 'read');
    const { sessionId } = paramsSchema.parse(await params);

    const { data: sessionRow, error: sessionError } = await supabase
      .from('health_check_sessions')
      .select('*, health_checks(name)')
      .eq('id', sessionId)
      .maybeSingle();
    if (sessionError) throw sessionError;
    if (!sessionRow) return NextResponse.json({ error: 'Session not found.' }, { status: 404 });

    const check = Array.isArray(sessionRow.health_checks) ? sessionRow.health_checks[0] : sessionRow.health_checks;
    const { health_checks, ...sessionBase } = sessionRow;
    const session = { ...sessionBase, check_name: (check as { name?: string } | undefined)?.name ?? '—' };

    const { data: answers, error: answersError } = await supabase
      .from('health_check_answers')
      .select('question_id, answer_text, selected_option_ids')
      .eq('session_id', sessionId);
    if (answersError) throw answersError;

    const { data: sections, error: sectionsError } = await supabase
      .from('health_check_sections')
      .select('id, title, sort_order')
      .eq('health_check_id', session.health_check_id)
      .order('sort_order', { ascending: true });
    if (sectionsError) throw sectionsError;

    const sectionIds = (sections ?? []).map((s) => s.id);
    const { data: subsections, error: subsectionsError } = await supabase
      .from('health_check_subsections')
      .select('id, section_id, heading, sort_order')
      .in('section_id', sectionIds)
      .order('sort_order', { ascending: true });
    if (subsectionsError) throw subsectionsError;

    const subsectionIds = (subsections ?? []).map((s) => s.id);
    const { data: questions, error: questionsError } = await supabase
      .from('health_check_questions')
      .select('id, subsection_id, question_text, question_type, sort_order')
      .in('subsection_id', subsectionIds)
      .order('sort_order', { ascending: true });
    if (questionsError) throw questionsError;

    const questionIds = (questions ?? []).map((q) => q.id);
    const { data: options, error: optionsError } = await supabase
      .from('health_check_question_options')
      .select('id, question_id, option_text')
      .in('question_id', questionIds)
      .order('sort_order', { ascending: true });
    if (optionsError) throw optionsError;

    const optionTextById = new Map<string, string>();
    (options ?? []).forEach((o) => optionTextById.set(o.id, o.option_text));
    const answerByQuestion = new Map<string, { answer_text: string | null; selected_option_ids: string[] }>();
    (answers ?? []).forEach((a) => answerByQuestion.set(a.question_id, a));

    const tree = (sections ?? []).map((section) => ({
      id: section.id,
      title: section.title,
      subsections: (subsections ?? [])
        .filter((sub) => sub.section_id === section.id)
        .map((sub) => ({
          id: sub.id,
          heading: sub.heading,
          questions: (questions ?? [])
            .filter((q) => q.subsection_id === sub.id)
            .map((q) => {
              const row = answerByQuestion.get(q.id);
              let answer: string | null = null;
              let hasAnswer = false;
              if (row) {
                if (q.question_type === 'paragraph') {
                  const text = row.answer_text?.trim() ?? '';
                  answer = text || null;
                  hasAnswer = text.length > 0;
                } else {
                  const texts = (row.selected_option_ids ?? [])
                    .map((id) => optionTextById.get(id))
                    .filter((t): t is string => !!t);
                  answer = texts.length > 0 ? texts.join(', ') : null;
                  hasAnswer = texts.length > 0;
                }
              }
              return {
                id: q.id,
                question_text: q.question_text,
                question_type: q.question_type,
                answer,
                has_answer: hasAnswer,
              };
            }),
        })),
    }));

    const { data: reports, error: reportsError } = await supabase
      .from('health_check_reports')
      .select('id, report_type, delivery_status, is_paid, created_at')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: false });
    if (reportsError) throw reportsError;

    return NextResponse.json({ session, tree, reports: reports ?? [] });
  } catch (error) {
    return jsonAdminError(error, 'Failed to load session details');
  }
}

/** Deletes a session and everything tied to it (answers, reports, log links). */
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ sessionId: string }> }) {
  try {
    const context = await requireAdmin(request, 'delete');
    const supabase = adminWriteClient(context);
    const { sessionId } = paramsSchema.parse(await params);

    const { error } = await supabase.from('health_check_sessions').delete().eq('id', sessionId);
    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    return jsonAdminWriteError(error, 'Failed to delete session');
  }
}
