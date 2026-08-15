import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { z } from 'zod';
import { requireAdmin, jsonAdminError } from '@/lib/admin-auth';

export const dynamic = 'force-dynamic';

const paramsSchema = z.object({ sessionId: z.string().uuid() });

/**
 * Full session detail with answers grouped by section → subsection, including
 * the question text and option labels for selected answers.
 */
export async function GET(request: NextRequest, { params }: { params: Promise<{ sessionId: string }> }) {
  try {
    const { supabase } = await requireAdmin(request, 'read');
    const { sessionId } = paramsSchema.parse(await params);

    const { data: session, error: sessionError } = await supabase
      .from('health_check_sessions')
      .select('*, health_checks(name, slug, tags)')
      .eq('id', sessionId)
      .maybeSingle();
    if (sessionError) throw sessionError;
    if (!session) return NextResponse.json({ error: 'Session not found' }, { status: 404 });

    const [answersResult, reportsResult] = await Promise.all([
      supabase
        .from('health_check_answers')
        .select('question_id, answer_text, selected_option_ids')
        .eq('session_id', sessionId),
      supabase
        .from('health_check_reports')
        .select('id, report_type, report_url_token, is_paid, delivery_status, created_at')
        .eq('session_id', sessionId),
    ]);
    if (answersResult.error) throw answersResult.error;
    if (reportsResult.error) throw reportsResult.error;

    // Load the question tree: sections → subsections → questions (+options).
    const { data: sections, error: sectionsError } = await supabase
      .from('health_check_sections')
      .select('id, title, sort_order')
      .eq('health_check_id', session.health_check_id)
      .order('sort_order');
    if (sectionsError) throw sectionsError;

    const sectionIds = (sections ?? []).map((s) => s.id);
    const { data: subsections, error: subsectionsError } = await supabase
      .from('health_check_subsections')
      .select('id, section_id, heading, sort_order')
      .in('section_id', sectionIds)
      .order('sort_order');
    if (subsectionsError) throw subsectionsError;

    const subsectionIds = (subsections ?? []).map((s) => s.id);
    const { data: questions, error: questionsError } = await supabase
      .from('health_check_questions')
      .select('id, subsection_id, question_text, question_type, sort_order')
      .in('subsection_id', subsectionIds)
      .order('sort_order');
    if (questionsError) throw questionsError;

    const questionIds = (questions ?? []).map((q) => q.id);
    const { data: options, error: optionsError } = await supabase
      .from('health_check_question_options')
      .select('id, question_id, option_text')
      .in('question_id', questionIds)
      .order('sort_order');
    if (optionsError) throw optionsError;

    const optionById = new Map((options ?? []).map((o) => [o.id, o.option_text]));
    const answerByQuestion = new Map((answersResult.data ?? []).map((a) => [a.question_id, a]));

    const tree = (sections ?? []).map((section) => ({
      ...section,
      subsections: (subsections ?? [])
        .filter((sub) => sub.section_id === section.id)
        .map((sub) => ({
          ...sub,
          questions: (questions ?? [])
            .filter((q) => q.subsection_id === sub.id)
            .map((q) => {
              const answer = answerByQuestion.get(q.id);
              let display: string | null = null;
              if (answer) {
                if (answer.answer_text) {
                  display = answer.answer_text;
                } else if (Array.isArray(answer.selected_option_ids) && answer.selected_option_ids.length > 0) {
                  display = answer.selected_option_ids.map((id: string) => optionById.get(id) ?? id).join(', ');
                }
              }
              return { ...q, answer: display, has_answer: Boolean(answer) };
            }),
        })),
    }));

    const check = Array.isArray(session.health_checks) ? session.health_checks[0] : session.health_checks;

    return NextResponse.json({
      session: { ...session, check_name: (check as { name?: string } | undefined)?.name ?? '—' },
      tree,
      reports: reportsResult.data ?? [],
    });
  } catch (error) {
    return jsonAdminError(error, 'Failed to load session details');
  }
}
