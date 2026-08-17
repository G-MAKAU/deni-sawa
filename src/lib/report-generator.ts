import Anthropic from '@anthropic-ai/sdk';
import { jsonrepair } from 'jsonrepair';

export interface GenerateReportOptions {
  systemPrompt: string;
  model?: string;
  maxTokens?: number;
  /** Plain text Q&A pairs appended to the user message. */
  userContent: string;
}

export interface GeneratedReport {
  state: Record<string, unknown>;
  model: string;
  tokensUsed?: number;
  generationSeconds: number;
}

export type ReportProvider = 'anthropic' | 'google' | 'openrouter';

/** True when a parsed EditorState actually contains readable content. */
function stateHasContent(state: Record<string, unknown>): boolean {
  const children = (state.root as Record<string, unknown> | undefined)?.children;
  if (!Array.isArray(children) || children.length === 0) return false;
  const countText = (node: unknown): number => {
    if (!node || typeof node !== 'object') return 0;
    const n = node as Record<string, unknown>;
    if (n.type === 'text' && typeof n.text === 'string' && n.text.trim()) return 1;
    return Array.isArray(n.children) ? n.children.reduce((sum, c) => sum + countText(c), 0) : 0;
  };
  return children.some((c) => countText(c) > 0);
}

/** Throws if a parsed state is empty so empty reports are never stored. */
function assertStateHasContent(state: Record<string, unknown>): Record<string, unknown> {
  if (!stateHasContent(state)) throw new Error('The model returned an empty report.');
  return state;
}

/** Strip code fences and any surrounding prose, returning the JSON substring. */
function extractJson(raw: string): string | null {
  let text = raw.trim();
  const fence = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fence) text = fence[1].trim();
  const start = text.indexOf('{');
  const end = text.lastIndexOf('}');
  if (start === -1 || end === -1 || end <= start) return null;
  return text.slice(start, end + 1);
}

/**
 * Parses a JSON string, auto-repairing common LLM mistakes (missing commas
 * between elements, unquoted keys, trailing commas) via jsonrepair.
 */
function parseJsonLenient(json: string): unknown {
  try {
    return JSON.parse(json);
  } catch {
    try {
      return JSON.parse(jsonrepair(json));
    } catch {
      throw new Error('The model did not return valid JSON.');
    }
  }
}

const ALLOWED_NODES = new Set([
  'root',
  'heading',
  'paragraph',
  'quote',
  'list',
  'listitem',
  'text',
  'callout',
  'divider',
  'link',
  'table',
  'tablerow',
  'tablecell',
]);
const TEXT_KEYS = new Set(['text', 'link']);
const LEAF_KEYS = new Set(['divider']);
const HEADING_TAGS = new Set(['h1', 'h2', 'h3', 'h4', 'h5', 'h6']);
const LIST_TYPES = new Set(['bullet', 'number', 'check']);

/** Recursively whitelist a parsed Lexical tree so only known nodes survive. */
function sanitizeNode(node: unknown): unknown | null {
  if (!node || typeof node !== 'object') return null;
  const n = node as Record<string, unknown>;
  const type = typeof n.type === 'string' ? n.type : '';
  // Gemini/OpenRouter emit aliases for nodes the renderer knows by other names.
  const nodeType = type === 'block-quote' ? 'quote' : type === 'horizontalrule' ? 'divider' : type;

  if (TEXT_KEYS.has(type) && typeof n.text === 'string') {
    return {
      detail: 0,
      format: typeof n.format === 'number' ? n.format : 0,
      mode: 'normal',
      style: typeof n.style === 'string' ? n.style : '',
      text: n.text,
      type,
      version: 1,
      ...(type === 'link' && typeof n.url === 'string' ? { url: n.url, rel: 'noreferrer', target: '_blank' } : {}),
    };
  }

  if (!ALLOWED_NODES.has(nodeType)) return null;
  if (LEAF_KEYS.has(nodeType)) return { children: [], direction: 'ltr', format: '', indent: 0, type: nodeType, version: 1 };

  const children = Array.isArray(n.children) ? n.children.map(sanitizeNode).filter(Boolean) : [];
  if (type === 'root') return { children, direction: 'ltr', format: '', indent: 0, type: 'root', version: 1 };
  if (type === 'listitem') return { children, direction: 'ltr', format: '', indent: 0, type: 'listitem', value: 1, version: 1 };
  if (type === 'heading') {
    const tag = typeof n.tag === 'string' && HEADING_TAGS.has(n.tag) ? n.tag : 'h2';
    return { children, direction: 'ltr', format: '', indent: 0, tag, type: 'heading', version: 1 };
  }
  if (type === 'list') {
    const listType = typeof n.listType === 'string' && LIST_TYPES.has(n.listType) ? n.listType : 'bullet';
    return {
      children,
      direction: 'ltr',
      format: '',
      indent: 0,
      listType,
      start: 1,
      tag: listType === 'number' ? 'ol' : 'ul',
      type: 'list',
      version: 1,
    };
  }
  if (type === 'callout') {
    const tone = n.tone === 'growth' || n.tone === 'dark' ? n.tone : 'brand';
    return { children, direction: 'ltr', format: '', indent: 0, tone, type: 'callout', version: 1 };
  }
  if (type === 'table') {
    // Gemini often emits empty Lexical tables — drop them so they don't render
    // as blank boxes; the model is instructed to use lists/paragraphs instead.
    if (children.length === 0) return null;
    return { children, direction: 'ltr', format: '', indent: 0, type: 'table', version: 1 };
  }
  if (type === 'tablerow') {
    if (children.length === 0) return null;
    return { children, direction: 'ltr', format: '', indent: 0, type: 'tablerow', version: 1 };
  }
  if (type === 'tablecell') {
    return {
      children,
      colSpan: typeof n.colSpan === 'number' ? n.colSpan : 1,
      rowSpan: typeof n.rowSpan === 'number' ? n.rowSpan : 1,
      headerState: typeof n.headerState === 'number' ? n.headerState : 0,
      direction: 'ltr',
      format: '',
      indent: 0,
      type: 'tablecell',
      version: 1,
      backgroundColor: typeof n.backgroundColor === 'string' ? n.backgroundColor : null,
    };
  }
  return { children, direction: 'ltr', format: '', indent: 0, textFormat: 0, textStyle: '', type: nodeType, version: 1 };
}

/** Validate and normalise parsed JSON into a safe Lexical EditorState. */
export function validateLexicalState(json: unknown): Record<string, unknown> {
  if (json && typeof json === 'object' && 'root' in json) {
    const sanitized = sanitizeNode((json as Record<string, unknown>).root);
    if (sanitized) return { root: sanitized } as Record<string, unknown>;
  }
  return { root: { children: [], direction: 'ltr', format: '', indent: 0, type: 'root', version: 1 } };
}

interface FallbackQA {
  question: string;
  answer: string;
}

interface FallbackSection {
  title: string;
  subsections: { heading: string; qa: FallbackQA[] }[];
}

function textNode(text: string, format = 0): Record<string, unknown> {
  return { detail: 0, format, mode: 'normal', style: '', text, type: 'text', version: 1 };
}

function paragraphNode(text: string): Record<string, unknown> {
  return {
    children: [textNode(text)],
    direction: 'ltr',
    format: '',
    indent: 0,
    textFormat: 0,
    textStyle: '',
    type: 'paragraph',
    version: 1,
  };
}

function headingNode(tag: 'h1' | 'h2' | 'h3', text: string): Record<string, unknown> {
  return {
    children: [textNode(text)],
    direction: 'ltr',
    format: '',
    indent: 0,
    tag,
    type: 'heading',
    version: 1,
  };
}

function listItemNode(text: string): Record<string, unknown> {
  return { children: [textNode(text)], direction: 'ltr', format: '', indent: 0, type: 'listitem', value: 1, version: 1 };
}

function listNode(items: string[]): Record<string, unknown> {
  return {
    children: items.map(listItemNode),
    direction: 'ltr',
    format: '',
    indent: 0,
    listType: 'bullet',
    start: 1,
    tag: 'ul',
    type: 'list',
    version: 1,
  };
}

function calloutNode(text: string, tone = 'brand'): Record<string, unknown> {
  return {
    children: [paragraphNode(text)],
    direction: 'ltr',
    format: '',
    indent: 0,
    tone,
    type: 'callout',
    version: 1,
  };
}

/**
 * Deterministic fallback report used when Claude is unavailable or fails.
 * Produces a well-structured Lexical EditorState from the Q&A tree.
 */
export function buildFallbackReport(options: {
  title: string;
  recipientName: string;
  sections: FallbackSection[];
}): Record<string, unknown> {
  const { title, recipientName, sections } = options;

  const children: Record<string, unknown>[] = [
    headingNode('h1', title),
    paragraphNode(`Prepared for ${recipientName}`),
    {
      children: [],
      direction: 'ltr',
      format: '',
      indent: 0,
      type: 'divider',
      version: 1,
    },
  ];

  const priorityAreas: string[] = [];

  sections.forEach((section) => {
    children.push(headingNode('h2', section.title));
    section.subsections.forEach((subsection) => {
      if (subsection.heading) children.push(headingNode('h3', subsection.heading));
      subsection.qa.forEach((qa) => {
        children.push(paragraphNode(`${qa.question}`));
        children.push(paragraphNode(qa.answer));
      });
    });
  });

  if (priorityAreas.length === 0) {
    children.push(
      headingNode('h2', 'Recommendations'),
      calloutNode('Review the answers above with a Deni Sawa advisor to build a personalised action plan.', 'brand')
    );
  }

  children.push(
    headingNode('h2', 'What happens next'),
    listNode([
      'A Deni Sawa advisor reviews your assessment.',
      'You receive your detailed diagnostic report with prioritised recommendations.',
      'We agree on the right programme for your situation.',
    ])
  );

  return {
    root: { children, direction: 'ltr', format: '', indent: 0, type: 'root', version: 1 },
  };
}

/**
 * Generates a Lexical-state report via the Anthropic Claude API using the
 * stored prompt configuration. Throws when the API key is missing or the
 * response cannot be parsed, so callers can catch and fall back knowingly.
 */
export async function generateReportWithClaude(options: GenerateReportOptions): Promise<GeneratedReport> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error('Anthropic API key is not configured.');

  const startedAt = Date.now();
  const model = options.model ?? process.env.ANTHROPIC_MODEL ?? 'claude-sonnet-4-5';
  // The stored value can be up to 200,000 (context window), but the API rejects
  // output tokens beyond the model's practical ceiling — clamp to a safe max.
  const maxTokens = Math.min(options.maxTokens ?? 4000, 32000);

  try {
    const anthropic = new Anthropic({ apiKey });
    const message = await anthropic.messages.create({
      model,
      max_tokens: maxTokens,
      system: options.systemPrompt,
      messages: [{ role: 'user', content: options.userContent }],
    });

    const text = message.content
      .filter((block) => block.type === 'text')
      .map((block) => block.text)
      .join('');

    const json = extractJson(text);
    if (!json) throw new Error('Claude did not return a valid JSON report.');

    const state = assertStateHasContent(validateLexicalState(parseJsonLenient(json)));
    return {
      state,
      model,
      tokensUsed: message.usage?.input_tokens ?? 0,
      generationSeconds: (Date.now() - startedAt) / 1000,
    };
  } catch (error) {
    throw new Error(error instanceof Error ? `Claude generation failed: ${error.message}` : 'Claude generation failed.');
  }
}

/**
 * Generates a Lexical-state report via the Google Gemini API. Mirrors the
 * Claude path — the model must return a valid Lexical EditorState JSON.
 * Throws on failure so callers can fall back knowingly.
 */
export async function generateReportWithGemini(options: GenerateReportOptions): Promise<GeneratedReport> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error('Gemini API key is not configured.');

  const startedAt = Date.now();
  const model = options.model ?? process.env.GEMINI_MODEL ?? 'gemini-2.5-flash';
  // Gemini 2.5 supports up to 65,536 output tokens — allow long reports.
  const maxTokens = Math.min(options.maxTokens ?? 4000, 65536);

  // Gemini occasionally returns malformed JSON on large prompts — retry once
  // with a strictness reminder before giving up.
  const attempts: Array<{ suffix: string; label: string }> = [
    { suffix: '', label: 'initial' },
    { suffix: '\n\nReminder: respond with strictly valid JSON only. Every key and value must be double-quoted (e.g. "type":"heading"). No comments, no trailing commas, no text outside the JSON.', label: 'retry' },
  ];

  for (const attempt of attempts) {
    try {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            systemInstruction: { parts: [{ text: options.systemPrompt }] },
            contents: [{ role: 'user', parts: [{ text: options.userContent + attempt.suffix }] }],
            generationConfig: { maxOutputTokens: maxTokens, temperature: 0.6 },
          }),
        }
      );

      if (!res.ok) {
        let detail = '';
        try {
          const data = (await res.json()) as { error?: { message?: string } };
          detail = data.error?.message ?? '';
        } catch {
          /* ignore */
        }
        throw new Error(`Gemini request failed (${res.status}${detail ? `): ${detail}` : ')'}`);
      }

      const data = (await res.json()) as {
        candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
      };
      const text = data.candidates?.[0]?.content?.parts
        ?.map((p) => p.text || '')
        .join('')
        .trim();
      if (!text) throw new Error('Gemini returned an empty response.');

      const json = extractJson(text);
      if (!json) throw new Error('Gemini did not return a valid JSON report.');

      const state = assertStateHasContent(validateLexicalState(parseJsonLenient(json)));
      return {
        state,
        model,
        generationSeconds: (Date.now() - startedAt) / 1000,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      if (attempt.label === 'retry') {
        throw new Error(`Gemini generation failed: ${message}`);
      }
      // First attempt failed — log and retry once.
      console.warn(`Gemini generation ${attempt.label} failed, retrying:`, message);
    }
  }

  throw new Error('Gemini generation failed.');
}

/** Dispatches to the configured provider (anthropic | google | openrouter). Throws on failure. */
export function generateReportForProvider(
  provider: ReportProvider,
  options: GenerateReportOptions
): Promise<GeneratedReport> {
  if (provider === 'google') return generateReportWithGemini(options);
  if (provider === 'openrouter') return generateReportWithOpenRouter(options);
  return generateReportWithClaude(options);
}

/**
 * Generates a Lexical-state report via OpenRouter (OpenAI-compatible chat
 * completions). Uses the configured OpenRouter model id (e.g.
 * "google/gemini-2.5-flash"), so any provider's models are available without a
 * per-vendor key. Retries once on failure; throws so callers can fall back.
 */
export async function generateReportWithOpenRouter(options: GenerateReportOptions): Promise<GeneratedReport> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) throw new Error('OpenRouter API key is not configured.');

  const startedAt = Date.now();
  const model = options.model ?? process.env.OPENROUTER_MODEL ?? 'google/gemini-2.5-flash';
  // Keep the request within typical credit balances — OpenRouter rejects large
  // max_tokens with a 402 when the account can't afford them.
  const maxTokens = Math.min(options.maxTokens ?? 4000, 16000);

  const attempts: Array<{ suffix: string; label: string }> = [
    { suffix: '', label: 'initial' },
    {
      suffix: '\n\nReminder: respond with strictly valid JSON only. Every key and value must be double-quoted (e.g. "type":"heading"). No comments, no trailing commas, no text outside the JSON.',
      label: 'retry',
    },
  ];

  let affordableTokens = maxTokens;

  for (const attempt of attempts) {
    try {
      const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model,
          messages: [
            { role: 'system', content: options.systemPrompt },
            { role: 'user', content: options.userContent + attempt.suffix },
          ],
          max_tokens: affordableTokens,
          temperature: 0.6,
        }),
      });

      if (!res.ok) {
        let detail = '';
        try {
          const data = (await res.json()) as { error?: { message?: string } };
          detail = data.error?.message ?? '';
        } catch {
          /* ignore */
        }
        // Insufficient credits — retry with the affordable output budget if the
        // error tells us how much the account can cover.
        if (res.status === 402) {
          const match = detail.match(/can only afford\s+(\d+)/i);
          const affordable = match ? Number(match[1]) : 0;
          if (affordable > 0 && affordable < affordableTokens) {
            affordableTokens = affordable;
            console.warn(`OpenRouter insufficient credits — retrying with max_tokens=${affordable}`);
            if (attempt.label === 'retry') {
              throw new Error(`OpenRouter generation failed: ${detail}`);
            }
            continue;
          }
        }
        throw new Error(`OpenRouter request failed (${res.status}${detail ? `): ${detail}` : ')'}`);
      }

      const data = (await res.json()) as {
        choices?: Array<{ message?: { content?: string } }>;
        usage?: { prompt_tokens?: number; completion_tokens?: number; total_tokens?: number };
      };
      const text = data.choices?.[0]?.message?.content?.trim() ?? '';
      if (!text) throw new Error('OpenRouter returned an empty response.');

      const json = extractJson(text);
      if (!json) throw new Error('OpenRouter did not return a valid JSON report.');

      const state = assertStateHasContent(validateLexicalState(parseJsonLenient(json)));
      return {
        state,
        model,
        tokensUsed: data.usage?.total_tokens ?? undefined,
        generationSeconds: (Date.now() - startedAt) / 1000,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      if (attempt.label === 'retry') {
        throw new Error(`OpenRouter generation failed: ${message}`);
      }
      console.warn(`OpenRouter generation ${attempt.label} failed, retrying:`, message);
    }
  }

  throw new Error('OpenRouter generation failed.');
}
