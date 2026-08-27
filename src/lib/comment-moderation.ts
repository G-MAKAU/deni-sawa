import { getSetting } from '@/lib/settings';
import {
  generateModelText,
  resolveFallbackConfig,
  resolveProviderConfig,
} from '@/lib/report-generator';

export type ModerationVerdict = 'approve' | 'reject' | 'review';

export interface ModerationResult {
  verdict: ModerationVerdict;
  reasons: string[];
  model: string | null;
  /** True when a model actually ran (vs. unavailable/failed). */
  aiModerated: boolean;
}

const MODERATION_PROMPT = `You are the content moderator for Deni Sawa Partners, a financial advisory blog.
Classify the reader comment below. Reply with ONLY a JSON object, no other text:
{"verdict":"approve"|"reject"|"review","reasons":["short reason", ...]}

Guidelines:
- "approve": on-topic, respectful, constructive. No spam, no scams, no profanity/harassment, no hate speech, no illegal content, no personal contact details, no promotional link dropping.
- "reject": spam, profanity, harassment, hate speech, phishing/scams, illegal content, explicit personal contact details (phone, address), aggressive self-promotion or link dropping.
- "review": borderline or ambiguous — critical but valid, mentions debt/money specifics that an advisor should verify, contains a link, or you are unsure. Flag for human review.

reasons should be 1-3 short phrases.`;

function sanitizeForPrompt(value: string): string {
  return value.replace(/["\\]/g, ' ').trim().slice(0, 2000);
}

function parseVerdict(raw: string): ModerationResult {
  const match = raw.match(/\{[^}]*\}/);
  if (!match) return { verdict: 'review', reasons: [], model: null, aiModerated: true };
  try {
    const parsed = JSON.parse(match[0]) as {
      verdict?: unknown;
      reasons?: unknown;
    };
    const verdict = ['approve', 'reject', 'review'].includes(String(parsed.verdict))
      ? (parsed.verdict as ModerationVerdict)
      : 'review';
    const reasons = Array.isArray(parsed.reasons)
      ? parsed.reasons.map((r) => String(r)).filter(Boolean).slice(0, 5)
      : [];
    return { verdict, reasons, model: null, aiModerated: true };
  } catch {
    return { verdict: 'review', reasons: [], model: null, aiModerated: true };
  }
}

async function callModeration(name: string, content: string): Promise<ModerationResult> {
  const config = await resolveProviderConfig('anthropic');
  const text = await generateModelText(
    config,
    MODERATION_PROMPT,
    `Comment author: "${sanitizeForPrompt(name)}"\n\nComment:\n"""\n${sanitizeForPrompt(content)}\n"""`,
    400
  );
  const result = parseVerdict(text);
  return { ...result, model: config.model };
}

/**
 * Runs AI comment moderation at submission time. Falls back to a secondary
 * provider, then to `review` (pending human review) when unavailable.
 */
export async function moderateComment(name: string, content: string): Promise<ModerationResult> {
  const enabled = await getSetting('COMMENT_AI_MODERATION_ENABLED');
  if (enabled === 'false') {
    return { verdict: 'review', reasons: [], model: null, aiModerated: false };
  }

  try {
    return await callModeration(name, content);
  } catch (primaryError) {
    try {
      const fallback = await resolveFallbackConfig();
      if (fallback) {
        const text = await generateModelText(
          fallback,
          MODERATION_PROMPT,
          `Comment author: "${sanitizeForPrompt(name)}"\n\nComment:\n"""\n${sanitizeForPrompt(content)}\n"""`,
          400
        );
        const result = parseVerdict(text);
        return { ...result, model: fallback.model };
      }
    } catch {
      // fall through to review
    }
    console.warn('AI comment moderation unavailable:', primaryError);
    return { verdict: 'review', reasons: ['AI moderation unavailable'], model: null, aiModerated: false };
  }
}

/** Maps an AI verdict to the stored comment status. */
export function verdictToStatus(verdict: ModerationVerdict): 'pending' | 'approved' | 'rejected' {
  if (verdict === 'approve') return 'approved';
  if (verdict === 'reject') return 'rejected';
  return 'pending';
}