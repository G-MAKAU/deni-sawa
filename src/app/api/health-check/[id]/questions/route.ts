import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getServiceClient } from '@/lib/supabase/service';

export const dynamic = 'force-dynamic';

/**
 * Returns the full question tree for an active health check:
 * sections → subsections → questions → options, ordered by sort_order.
 */
export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: slug } = await params;
    const supabase = getServiceClient();

    const { data: check, error: checkError } = await supabase
      .from('health_checks')
      .select('id, slug, name, description, estimated_minutes, tags, detailed_price, detailed_call_price')
      .eq('slug', slug)
      .eq('is_active', true)
      .maybeSingle();

    if (checkError) throw checkError;
    if (!check) return NextResponse.json({ error: 'Health check not found.' }, { status: 404 });

    const { data: sections, error: sectionsError } = await supabase
      .from('health_check_sections')
      .select('id, title, description, sort_order')
      .eq('health_check_id', check.id)
      .order('sort_order', { ascending: true });
    if (sectionsError) throw sectionsError;

    const sectionIds = (sections ?? []).map((s) => s.id);
    const { data: subsections, error: subsectionsError } = await supabase
      .from('health_check_subsections')
      .select('id, section_id, heading, description, sort_order')
      .in('section_id', sectionIds)
      .order('sort_order', { ascending: true });
    if (subsectionsError) throw subsectionsError;

    const subsectionIds = (subsections ?? []).map((s) => s.id);
    const { data: questions, error: questionsError } = await supabase
      .from('health_check_questions')
      .select('id, subsection_id, question_text, question_type, is_required, helper_text, sort_order')
      .in('subsection_id', subsectionIds)
      .order('sort_order', { ascending: true });
    if (questionsError) throw questionsError;

    const questionIds = (questions ?? []).map((q) => q.id);
    const { data: options, error: optionsError } = await supabase
      .from('health_check_question_options')
      .select('id, question_id, option_text, sort_order')
      .in('question_id', questionIds)
      .order('sort_order', { ascending: true });
    if (optionsError) throw optionsError;

    const tree = (sections ?? []).map((section) => ({
      ...section,
      subsections: (subsections ?? [])
        .filter((sub) => sub.section_id === section.id)
        .map((sub) => ({
          ...sub,
          questions: (questions ?? [])
            .filter((q) => q.subsection_id === sub.id)
            .map((q) => ({ ...q, options: (options ?? []).filter((o) => o.question_id === q.id) })),
        })),
    }));

    return NextResponse.json({ check, sections: tree });
  } catch (error) {
    console.error('Failed to load health check questions:', error);
    return NextResponse.json({ error: 'Failed to load health check questions.' }, { status: 500 });
  }
}
