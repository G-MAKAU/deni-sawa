import type { SupabaseClient } from '@supabase/supabase-js';
import { generateReportForProvider, buildFallbackReport, type ReportProvider } from '@/lib/report-generator';
import { deliverReportByEmail, deliverReportByWhatsApp } from '@/lib/delivery';
import { sendEmail, buildBrandedEmailHtml, resolveSiteUrl } from '@/lib/email';
import { site } from '@/data/site';

export type ReportType = 'summary' | 'detailed';

interface SessionLike {
  id: string;
  health_check_id: string;
  full_name: string;
  business_name?: string | null;
  preferred_delivery: string;
}

export interface GenerateResult {
  report: Record<string, unknown> & { id: string; report_url_token: string };
  regenerated: boolean;
  tokensUsed?: number;
  generationSeconds?: number;
}

/** Loads the full question tree with answers for a session, for the prompt. */
async function loadAnswerTree(
  supabase: SupabaseClient,
  session: { health_check_id: string; id: string }
): Promise<Array<{ title: string; subsections: Array<{ heading: string; qa: Array<{ question: string; answer: string }> }> }>> {
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

  return (sections ?? []).map((section) => ({
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
}

/**
 * Core report generation pipeline, shared by the public generate route and the
 * admin regenerate flows. Generates the Lexical report via Claude (falling back
 * to a deterministic builder), stores it, and triggers delivery based on the
 * session's preferred channel. With `force` it re-runs even if a report exists.
 */
export async function runReportGeneration(
  supabase: SupabaseClient,
  session: SessionLike,
  reportType: ReportType,
  options: { force?: boolean; skipDelivery?: boolean } = {}
): Promise<GenerateResult> {
  // Return the existing report unless we're forcing a regenerate.
  if (!options.force) {
    const { data: existing } = await supabase
      .from('health_check_reports')
      .select('*')
      .eq('session_id', session.id)
      .eq('report_type', reportType)
      .maybeSingle();
    if (existing) {
      return { report: existing as GenerateResult['report'], regenerated: false };
    }
  }

  const { data: prompt } = await supabase
    .from('health_check_report_prompts')
    .select('*')
    .eq('health_check_id', session.health_check_id)
    .eq('report_type', reportType)
    .eq('is_active', true)
    .maybeSingle();

  const { data: check } = await supabase.from('health_checks').select('name').eq('id', session.health_check_id).maybeSingle();
  const checkName = (check as { name?: string } | null)?.name ?? 'Health Check';

  const answerTree = await loadAnswerTree(supabase, session);
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

  const baseContent = `The user completed the "${checkName}". Today's date is ${new Date().toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })}. Respondent details: full name "${session.full_name}"${
    session.business_name ? `, business name "${session.business_name}"` : ''
  }. Here are their answers:\n\n${qaText}\n\nPREMIUM REPORT FORMAT — use every formatting tool to craft an elegant, professional report:\n- Clear heading hierarchy: H1 for the report title, H2 for each major section, H3 for sub-findings.\n- Bold key figures, ratings and important terms for emphasis.\n- Bullet lists for findings and numbered lists for sequential steps; use checklist items where a "done/confirmed" state is meaningful.\n- Quote blocks for priority callouts and advisor notes.\n- Callout blocks for recommendations and "why it matters" highlights.\n- Horizontal dividers between major sections for clean visual separation.\n- Table nodes for scores, comparisons and milestones — the renderer and exports (PDF/Word) support tables.\n- Add a relevant link where it genuinely adds value.\n- Keep the tone premium, polished and easy to scan — never cramped or cluttered.`;

  // ── Summary restrictions (disabled — report now follows the DB prompt only) ──
  // const summaryRestrictions = reportType === 'summary'
  //   ? `\n\nIMPORTANT — SUMMARY REPORT RESTRICTIONS (this is the FREE tier):\n- List the top 3 priority areas by NAME ONLY. Do not explain findings in detail.\n- Do NOT include category-by-category findings or what each finding means.\n- Do NOT include recommendations, action steps, or an action plan.\n- Do NOT include an advisor commentary section.\n- Keep the report concise — executive summary + top 3 priorities named, nothing more.\n- End the report with this exact call-to-action: "Upgrade to the Full Report to see category-by-category findings, what they mean for your business, and a prioritised action plan."`
  //   : '';

  const userContent = baseContent + `\n\nOutput format: Return ONLY a valid Lexical EditorState JSON object — no prose, no markdown fences. Ensure strictly valid JSON: every key and string value double-quoted, no trailing commas.`;

  const provider = (prompt?.provider as ReportProvider | undefined) ?? 'anthropic';
  let generated;
  let generationError: string | null = null;
  if (prompt) {
    try {
      generated = await generateReportForProvider(provider, {
        systemPrompt: prompt.system_prompt,
        model: prompt.model,
        maxTokens: prompt.max_tokens,
        userContent,
      });
    } catch (error) {
      // The AI provider failed — surface the reason and fall back gracefully.
      generationError = error instanceof Error ? error.message : String(error);
      console.error('Report generation failed:', generationError);
    }
  }

  let state: Record<string, unknown>;
  let modelUsed = prompt?.model ?? 'fallback';
  let tokensUsed: number | undefined = undefined;
  let generationSeconds: number | undefined = undefined;

  if (generated) {
    state = generated.state;
    modelUsed = generated.model;
    tokensUsed = generated.tokensUsed;
    generationSeconds = generated.generationSeconds;
  } else {
    // Graceful fallback so the flow never hard-fails. Label it clearly so a
    // fallback report is never mistaken for a real AI report.
    modelUsed = 'fallback';
    state = buildFallbackReport({
      title: `${checkName} — ${reportType === 'summary' ? 'Summary' : 'Detailed'} Report`,
      recipientName: session.full_name,
      sections: answerTree,
    });

    // Notify admin that generation failed and fallback was used.
    const adminEmail = process.env.ADMIN_NOTIFY_EMAIL ?? site.email;
    if (adminEmail) {
      const siteUrl = resolveSiteUrl();
      const adminBody = `
        <h1>Report generation failed — fallback used</h1>
        <p>AI report generation failed for <strong>${session.full_name}</strong>'s <strong>${checkName}</strong> (${reportType}) report. The deterministic fallback template was used instead.</p>
        <h2>Error details</h2>
        <pre style="background:#F9F7F5;padding:16px;border-radius:6px;font-size:13px;white-space:pre-wrap;word-break:break-word;">${generationError}</pre>
        <h2>Session info</h2>
        <ul>
          <li><strong>Recipient:</strong> ${session.full_name}</li>
          <li><strong>Health check:</strong> ${checkName}</li>
          <li><strong>Report type:</strong> ${reportType}</li>
          <li><strong>Provider:</strong> ${provider}</li>
          <li><strong>Model:</strong> ${prompt?.model ?? 'N/A'}</li>
        </ul>
        <p><a href="${siteUrl}/admin/health-checks/reports">View in admin →</a></p>
      `;
      try {
        await sendEmail({
          to: adminEmail,
          subject: `[Alert] Report generation failed — ${checkName} (${reportType})`,
          html: buildBrandedEmailHtml(adminBody),
        });
      } catch (emailErr) {
        console.error('Admin fallback notification email failed:', emailErr);
      }
    }
  }

  const promptSnapshot = prompt?.system_prompt ?? 'fallback';

  // Calculate expiry: summary = 30 days, detailed = 12 months.
  const now = new Date();
  const expiresAt = reportType === 'summary'
    ? new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString()
    : new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000).toISOString();

  // Upsert the report — update in place when regenerating.
  let report;
  if (options.force) {
    const { data: current } = await supabase
      .from('health_check_reports')
      .select('id')
      .eq('session_id', session.id)
      .eq('report_type', reportType)
      .maybeSingle();
    if (current) {
      const { data, error } = await supabase
        .from('health_check_reports')
        .update({
          lexical_state: state,
          prompt_snapshot: promptSnapshot,
          model_used: modelUsed,
          tokens_used: tokensUsed,
          generation_seconds: generationSeconds,
          generation_error: generationError,
          delivery_status: 'pending',
          created_at: new Date().toISOString(),
          expires_at: expiresAt,
        })
        .eq('id', current.id)
        .select()
        .single();
      if (error) throw error;
      report = data;
    }
  }

  if (!report) {
    const { data, error } = await supabase
      .from('health_check_reports')
      .insert({
        session_id: session.id,
        report_type: reportType,
        lexical_state: state,
        prompt_snapshot: promptSnapshot,
        model_used: modelUsed,
        tokens_used: tokensUsed,
        generation_seconds: generationSeconds,
        generation_error: generationError,
        is_paid: reportType === 'detailed' ? false : true,
        expires_at: expiresAt,
      })
      .select()
      .single();
    if (error) throw error;
    report = data;
  }

  // ── Delivery based on session.preferred_delivery (skipped for unpaid paid
  //    reports — the payment confirm flow triggers delivery once paid) ───────
  if (!options.skipDelivery) {
    const delivery = session.preferred_delivery as 'email' | 'whatsapp' | 'both';
    if (delivery === 'email' || delivery === 'both') await deliverReportByEmail(supabase, report.id);
    if (delivery === 'whatsapp' || delivery === 'both') await deliverReportByWhatsApp(supabase, report.id);
  }

  return { report: report as GenerateResult['report'], regenerated: true, tokensUsed, generationSeconds };
}
