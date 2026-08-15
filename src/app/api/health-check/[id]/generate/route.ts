import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { z } from 'zod';
import { getServiceClient } from '@/lib/supabase/service';
import { generateReportWithClaude, buildFallbackReport } from '@/lib/report-generator';
import { deliverReportByEmail, deliverReportByWhatsApp } from '@/lib/delivery';

export const maxDuration = 120;

const generateSchema = z.object({
  report_type: z.enum(['summary', 'detailed']).default('summary'),
});

/** Loads the full question tree with answers for a session, for the prompt. */
async function loadAnswerTree(supabase: ReturnType<typeof getServiceClient>, session: { health_check_id: string; id: string }) {
  const { data: sections } = await supabase
    .from('health_check_sections')
    .select('id, title, sort_order')
    .eq('health_check_id', session.health_check_id)
    .order('sort_order', { ascending: true });

  const sectionIds = (sections ?? []).map((s) => s.id);
  const { data: subsections } = await supabase
    .from('health_check_subsections')
    .select('id, section_id, heading, sort_order')
    .in('section_id', sectionIds)
    .order('sort_order', { ascending: true });

  const subsectionIds = (subsections ?? []).map((s) => s.id);
  const { data: questions } = await supabase
    .from('health_check_questions')
    .select('id, subsection_id, question_text, question_type, sort_order')
    .in('subsection_id', subsectionIds)
    .order('sort_order', { ascending: true });

  const questionIds = (questions ?? []).map((q) => q.id);
  const { data: options } = await supabase
    .from('health_check_question_options')
    .select('id, question_id, option_text')
    .in('question_id', questionIds)
    .order('sort_order', { ascending: true });

  const { data: answers } = await supabase
    .from('health_check_answers')
    .select('question_id, answer_text, selected_option_ids')
    .eq('session_id', session.id);

  const optionById = new Map((options ?? []).map((o) => [o.id, o.option_text]));
  const answerByQuestion = new Map((answers ?? []).map((a) => [a.question_id, a]));

  const tree = (sections ?? []).map((section) => ({
    title: section.title,
    subsections: (subsections ?? [])
      .filter((sub) => sub.section_id === section.id)
      .map((sub) => ({
        heading: sub.heading,
        qa: (questions ?? [])
          .filter((q) => q.subsection_id === sub.id)
          .map((q) => {
            const answer = answerByQuestion.get(q.id);
            let display = 'No answer';
            if (answer) {
              if (answer.answer_text) display = answer.answer_text;
              else if (Array.isArray(answer.selected_option_ids) && answer.selected_option_ids.length > 0) {
                display = answer.selected_option_ids.map((id: string) => optionById.get(id) ?? id).join(', ');
              }
            }
            return { question: q.question_text, answer: display };
          }),
      })),
  }));

  return tree;
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const parsed = generateSchema.safeParse(body);
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

    if (!session.is_complete) {
      return NextResponse.json({ error: 'Session must be completed before generating a report.' }, { status: 422 });
    }

    const reportType = parsed.data.report_type;

    // Already generated? Return the existing report.
    const { data: existingReport } = await supabase
      .from('health_check_reports')
      .select('*')
      .eq('session_id', sessionId)
      .eq('report_type', reportType)
      .maybeSingle();
    if (existingReport) {
      const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://deni-sawa.com';
      return NextResponse.json({
        report_id: existingReport.id,
        report_url_token: existingReport.report_url_token,
        report_url: `${siteUrl}/health-checks/report/${existingReport.report_url_token}`,
        report_type: reportType,
        regenerated: false,
      });
    }

    const { data: prompt, error: promptError } = await supabase
      .from('health_check_report_prompts')
      .select('*')
      .eq('health_check_id', session.health_check_id)
      .eq('report_type', reportType)
      .eq('is_active', true)
      .maybeSingle();
    if (promptError) throw promptError;

    const { data: check } = await supabase.from('health_checks').select('name').eq('id', session.health_check_id).maybeSingle();
    const checkName = (check as { name?: string } | null)?.name ?? 'Health Check';

    const answerTree = await loadAnswerTree(supabase, session);

    // Build the user-facing content as formatted Q&A pairs.
    const qaText = answerTree
      .map((section) =>
        [
          `## ${section.title}`,
          ...section.subsections.map((sub) =>
            [`### ${sub.heading}`, ...sub.qa.map((qa) => `Q: ${qa.question}\nA: ${qa.answer}`)].join('\n')
          ),
        ].join('\n\n')
      )
      .join('\n\n');

    const userContent = `The user completed the "${checkName}". Here are their answers:\n\n${qaText}`;

    let generated;
    if (prompt) {
      generated = await generateReportWithClaude({
        systemPrompt: prompt.system_prompt,
        model: prompt.model,
        maxTokens: prompt.max_tokens,
        userContent,
      });
    }

    let state: Record<string, unknown>;
    let modelUsed = prompt?.model ?? 'fallback';
    let tokensUsed: number | null = null;
    let generationSeconds: number | null = null;

    if (generated) {
      state = generated.state;
      modelUsed = generated.model;
      tokensUsed = generated.tokensUsed ?? null;
      generationSeconds = generated.generationSeconds;
    } else {
      // Graceful fallback so the flow never hard-fails.
      state = buildFallbackReport({
        title: `${checkName} — ${reportType === 'summary' ? 'Summary' : 'Detailed'} Report`,
        recipientName: session.full_name,
        sections: answerTree,
      });
    }

    const promptSnapshot = prompt?.system_prompt ?? 'fallback';

    const { data: report, error: reportError } = await supabase
      .from('health_check_reports')
      .insert({
        session_id: sessionId,
        report_type: reportType,
        lexical_state: state,
        prompt_snapshot: promptSnapshot,
        model_used: modelUsed,
        tokens_used: tokensUsed,
        generation_seconds: generationSeconds,
        is_paid: reportType === 'detailed' ? false : true,
      })
      .select()
      .single();
    if (reportError) throw reportError;

    // ── Delivery based on session.preferred_delivery ────────────────────────
    const delivery = session.preferred_delivery as 'email' | 'whatsapp' | 'both';
    const emailResult = delivery === 'email' || delivery === 'both' ? await deliverReportByEmail(supabase, report.id) : null;
    const whatsappResult = delivery === 'whatsapp' || delivery === 'both' ? await deliverReportByWhatsApp(supabase, report.id) : null;

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://deni-sawa.com';

    return NextResponse.json({
      report_id: report.id,
      report_url_token: report.report_url_token,
      report_url: `${siteUrl}/health-checks/report/${report.report_url_token}`,
      report_type: reportType,
      regenerated: true,
      delivery: { email: emailResult?.ok ?? null, whatsapp: whatsappResult?.ok ?? null },
    });
  } catch (error) {
    console.error('Failed to generate report:', error);
    return NextResponse.json({ error: 'Failed to generate report.' }, { status: 500 });
  }
}
