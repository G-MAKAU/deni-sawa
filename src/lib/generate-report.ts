import type { SupabaseClient } from '@supabase/supabase-js';
import { generateReportForProvider, resolveProviderConfig, buildFallbackReport, type ReportProvider } from '@/lib/report-generator';
import { deliverReportByEmail, deliverReportByWhatsApp } from '@/lib/delivery';
import { sendEmail, buildBrandedEmailHtml, resolveSiteUrl } from '@/lib/email';
import { getServiceClient } from '@/lib/supabase/service';
import { site } from '@/data/site';

export type ReportType = 'summary' | 'detailed';
export type GenerationStatus = 'generating' | 'completed' | 'failed';

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

// ─── STUB + BACKGROUND PATTERN ───────────────────────────────────────────────
// The API endpoint calls createReportStub() to create a row immediately, then
// fires completeReportGeneration() in the background (not awaited). The client
// polls the status endpoint to know when it's done.

/**
 * Creates a report stub row immediately with generation_status='generating'.
 * Returns the report ID and URL token so the client can poll.
 * If a completed report already exists (and not forcing), returns it directly.
 */
export async function createReportStub(
  supabase: SupabaseClient,
  session: SessionLike,
  reportType: ReportType,
  options: { force?: boolean } = {}
): Promise<{ report: Record<string, unknown> & { id: string; report_url_token: string }; alreadyComplete: boolean }> {
  // Check for existing completed report (unless forcing).
  if (!options.force) {
    const { data: existing } = await supabase
      .from('health_check_reports')
      .select('*')
      .eq('session_id', session.id)
      .eq('report_type', reportType)
      .eq('generation_status', 'completed')
      .maybeSingle();
    if (existing) {
      return { report: existing as GenerateResult['report'], alreadyComplete: true };
    }
  }

  // If regenerating, mark any existing row as generating.
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
        .update({ generation_status: 'generating', delivery_status: 'pending', created_at: new Date().toISOString() })
        .eq('id', current.id)
        .select('*')
        .single();
      if (error) throw error;
      return { report: data as GenerateResult['report'], alreadyComplete: false };
    }
  }

  // Calculate expiry: summary = 30 days, detailed = 12 months.
  const now = new Date();
  const expiresAt = reportType === 'summary'
    ? new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString()
    : new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000).toISOString();

  // Insert stub row.
  const { data, error } = await supabase
    .from('health_check_reports')
    .insert({
      session_id: session.id,
      report_type: reportType,
      generation_status: 'generating',
      lexical_state: {},
      is_paid: reportType === 'detailed' ? false : true,
      expires_at: expiresAt,
    })
    .select('*')
    .single();
  if (error) throw error;
  return { report: data as GenerateResult['report'], alreadyComplete: false };
}

/**
 * Completes report generation in the background. Updates the stub row with the
 * AI-generated content (or fallback), saves, and delivers.
 * This is designed to be called with .catch() — never awaited by the API route.
 * Creates its own service-role Supabase client so it survives after the HTTP
 * response is sent (the request-scoped client dies when Vercel reclaims the fn).
 */
export async function completeReportGeneration(
  _supabase: SupabaseClient,
  session: SessionLike,
  reportType: ReportType,
  reportId: string,
  options: { skipDelivery?: boolean } = {}
): Promise<void> {
  // Use a fresh service-role client — the request-scoped one is dead after the
  // HTTP response is sent.
  const supabase = getServiceClient();
  try {
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

    const userContent = baseContent + `\n\nOutput format: Return ONLY a valid Lexical EditorState JSON object — no prose, no markdown fences. Ensure strictly valid JSON: every key and string value double-quoted, no trailing commas.`;

    const resolvedConfig = await resolveProviderConfig('anthropic');
    let generated;
    let generationError: string | null = null;
    if (prompt) {
      try {
        generated = await generateReportForProvider('anthropic', {
          systemPrompt: prompt.system_prompt,
          model: prompt.model,
          maxTokens: prompt.max_tokens,
          userContent,
        });
      } catch (error) {
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
            <li><strong>Provider:</strong> ${resolvedConfig.label}</li>
            <li><strong>Model:</strong> ${prompt?.model ?? 'N/A'}</li>
          </ul>
          <p><a href="${siteUrl}/admin/health-checks/reports">View in admin →</a></p>
        `;
        try {
          await sendEmail({
            to: adminEmail,
            subject: `[Alert] Report generation failed — ${checkName} (${reportType})`,
            html: buildBrandedEmailHtml(adminBody),
            fromName: 'Deni Sawa Partners',
            fromEmail: 'advisory@denisawa.co.ke',
          });
        } catch (emailErr) {
          console.error('Admin fallback notification email failed:', emailErr);
        }
      }
    }

    const promptSnapshot = prompt?.system_prompt ?? 'fallback';

    const now = new Date();
    const expiresAt = reportType === 'summary'
      ? new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString()
      : new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000).toISOString();

    // Update the stub row with the generated content.
    const { error: updateError } = await supabase
      .from('health_check_reports')
      .update({
        lexical_state: state,
        prompt_snapshot: promptSnapshot,
        model_used: modelUsed,
        tokens_used: tokensUsed,
        generation_seconds: generationSeconds,
        generation_error: generationError,
        generation_status: 'completed',
        expires_at: expiresAt,
      })
      .eq('id', reportId);
    if (updateError) {
      console.error('Failed to update report row:', updateError);
      return;
    }

    // Delivery.
    if (!options.skipDelivery) {
      const delivery = session.preferred_delivery as 'email' | 'whatsapp' | 'both';
      if (delivery === 'email' || delivery === 'both') await deliverReportByEmail(supabase, reportId);
      if (delivery === 'whatsapp' || delivery === 'both') await deliverReportByWhatsApp(supabase, reportId);
    }
  } catch (err) {
    console.error('Background report generation failed:', err);
    // Mark the row as failed so the UI can show it.
    await supabase
      .from('health_check_reports')
      .update({
        generation_status: 'failed',
        generation_error: err instanceof Error ? err.message : String(err),
      })
      .eq('id', reportId);
  }
}

/**
 * Returns the current generation status of a report (for polling).
 */
export async function getReportStatus(
  supabase: SupabaseClient,
  reportId: string
): Promise<{ status: GenerationStatus; report?: Record<string, unknown> }> {
  const { data, error } = await supabase
    .from('health_check_reports')
    .select('generation_status, report_url_token')
    .eq('id', reportId)
    .maybeSingle();
  if (error || !data) return { status: 'failed' };
  return { status: (data.generation_status as GenerationStatus) ?? 'completed', report: data };
}
