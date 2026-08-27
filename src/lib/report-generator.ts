import Anthropic from '@anthropic-ai/sdk';
import { jsonrepair } from 'jsonrepair';
import { withLexicalDesignSpec } from '@/lib/lexical-report-spec';
import { getSettings } from '@/lib/settings';

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

/**
 * 'anthropic' = native Claude API; 'google' = native Gemini API;
 * 'openai' = any OpenAI-compatible /chat/completions endpoint (OpenAI, DeepSeek,
 * Qwen, Kimi/Moonshot, Groq, OpenRouter, Mistral, etc.). 'openrouter' is kept
 * as a legacy alias for 'openai' with the OpenRouter base URL.
 */
export type ReportProvider = 'anthropic' | 'google' | 'openai' | 'openrouter';

export interface ProviderConfig {
  type: Exclude<ReportProvider, 'openrouter'>;
  baseUrl?: string;
  apiKey: string;
  model: string;
}

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
  'stickynote',
  'divider',
  'pagebreak',
  'link',
  'image',
  'table',
  'tablerow',
  'tablecell',
]);
const TEXT_KEYS = new Set(['text', 'link']);
const LEAF_KEYS = new Set(['divider', 'pagebreak']);
const HEADING_TAGS = new Set(['h1', 'h2', 'h3', 'h4', 'h5', 'h6']);
const LIST_TYPES = new Set(['bullet', 'number', 'check']);
const IMAGE_LAYOUTS = new Set(['inline', 'square-left', 'square-right', 'tight-left', 'tight-right', 'center', 'behind', 'front']);

/** CSS properties an AI report may set, so styling stays premium but safe. */
const ALLOWED_STYLE_PROPS = new Set([
  'color',
  'background-color',
  'font-size',
  'font-family',
  'font-weight',
  'font-style',
  'text-decoration',
  'text-align',
  'line-height',
  'letter-spacing',
  'padding',
  'margin',
  'border-radius',
]);

/** Whitelists a CSS declaration block — drops anything unsafe (url(), scripts, braces). */
function sanitizeStyle(style: unknown): string {
  if (typeof style !== 'string' || !style.trim()) return '';
  const out: string[] = [];
  for (const decl of style.split(';')) {
    const idx = decl.indexOf(':');
    if (idx === -1) continue;
    const prop = decl.slice(0, idx).trim().toLowerCase();
    const value = decl.slice(idx + 1).trim();
    if (!ALLOWED_STYLE_PROPS.has(prop)) continue;
    if (!value || /url\s*\(|expression\s*\(|javascript:/i.test(value)) continue;
    if (/[{}<>]/.test(value)) continue;
    out.push(`${prop}: ${value}`);
  }
  return out.join('; ');
}

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
      style: sanitizeStyle(n.style),
      text: n.text,
      type,
      version: 1,
      ...(type === 'link' && typeof n.url === 'string' ? { url: n.url, rel: 'noreferrer', target: '_blank' } : {}),
    };
  }

  if (type === 'image') {
    const src = typeof n.src === 'string' ? n.src.trim() : '';
    // Only site-relative or http(s) URLs are valid for a rendered report.
    if (!/^(https?:\/\/|\/)/i.test(src)) return null;
    return {
      alt: typeof n.alt === 'string' ? n.alt.slice(0, 200) : '',
      src,
      width: typeof n.width === 'number' && n.width > 0 && n.width <= 4000 ? n.width : null,
      layout: typeof n.layout === 'string' && IMAGE_LAYOUTS.has(n.layout) ? n.layout : 'inline',
      type: 'image',
      version: 1,
    };
  }

  if (!ALLOWED_NODES.has(nodeType)) return null;
  if (LEAF_KEYS.has(nodeType)) return { children: [], direction: 'ltr', format: '', indent: 0, type: nodeType, version: 1 };

  const children = Array.isArray(n.children) ? n.children.map(sanitizeNode).filter(Boolean) : [];
  if (type === 'root') return { children, direction: 'ltr', format: '', indent: 0, type: 'root', version: 1 };
  if (type === 'listitem') {
    // Preserve `checked` so checklist items keep their checkbox glyph.
    const checked = typeof n.checked === 'boolean' ? n.checked : undefined;
    return {
      children,
      direction: 'ltr',
      format: '',
      indent: 0,
      style: sanitizeStyle(n.style),
      type: 'listitem',
      value: typeof n.value === 'number' ? n.value : 1,
      version: 1,
      ...(checked !== undefined ? { checked } : {}),
    };
  }
  if (type === 'heading') {
    const tag = typeof n.tag === 'string' && HEADING_TAGS.has(n.tag) ? n.tag : 'h2';
    return { children, direction: 'ltr', format: '', indent: 0, style: sanitizeStyle(n.style), tag, type: 'heading', version: 1 };
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
    if (children.length === 0) return null;
    const colWidths = Array.isArray(n.colWidths) && n.colWidths.every((w) => typeof w === 'number') ? n.colWidths : null;
    return {
      children,
      direction: 'ltr',
      format: '',
      indent: 0,
      type: 'table',
      version: 1,
      ...(colWidths ? { colWidths } : {}),
    };
  }
  if (type === 'tablerow') {
    if (children.length === 0) return null;
    return { children, direction: 'ltr', format: '', indent: 0, type: 'tablerow', version: 1 };
  }
  if (type === 'tablecell') {
    // Lexical requires a block element inside a cell — wrap bare text in a paragraph.
    const BLOCK_TYPES = new Set(['paragraph', 'heading', 'list', 'quote', 'callout', 'code']);
    const cellChildren = children.some((c) => BLOCK_TYPES.has((c as Record<string, unknown>).type as string))
      ? children
      : [
          {
            children,
            direction: 'ltr',
            format: '',
            indent: 0,
            style: '',
            textFormat: 0,
            textStyle: '',
            type: 'paragraph',
            version: 1,
          },
        ];
    return {
      children: cellChildren,
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
  return {
    children,
    direction: 'ltr',
    format: '',
    indent: 0,
    style: sanitizeStyle(n.style),
    textFormat: 0,
    textStyle: '',
    type: nodeType,
    version: 1,
  };
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
 * provided configuration. Throws when the response cannot be parsed, so
 * callers can catch and fall back knowingly.
 */
export async function generateReportWithClaude(config: ProviderConfig, options: GenerateReportOptions): Promise<GeneratedReport> {
  const { apiKey, model } = config;
  const startedAt = Date.now();
  // The stored value can be up to 200,000 (context window), but the API rejects
  // output tokens beyond the model's practical ceiling — clamp to a safe max.
  const maxTokens = Math.min(options.maxTokens ?? 4000, 32000);

  try {
    const anthropic = new Anthropic({ apiKey });
    const message = await anthropic.messages.create({
      model,
      max_tokens: maxTokens,
      system: withLexicalDesignSpec(options.systemPrompt),
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
export async function generateReportWithGemini(config: ProviderConfig, options: GenerateReportOptions): Promise<GeneratedReport> {
  const { apiKey, model } = config;
  const startedAt = Date.now();
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
            systemInstruction: { parts: [{ text: withLexicalDesignSpec(options.systemPrompt) }] },
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

/** Dispatches to the configured provider. Falls back to a secondary provider when set. */
export async function generateReportForProvider(
  provider: ReportProvider,
  options: GenerateReportOptions
): Promise<GeneratedReport> {
  const primary = await resolveProviderConfig(provider);
  try {
    return await generateReportForConfig(primary, options);
  } catch (primaryError) {
    const fallback = await resolveFallbackConfig();
    if (!fallback) throw primaryError;
    console.warn(`Primary AI provider failed (${primary.label}); falling back to ${fallback.label}.`, primaryError);
    try {
      return await generateReportForConfig(fallback, options);
    } catch (fallbackError) {
      throw new Error(
        `AI generation failed on both providers (${primary.label} & ${fallback.label}). ${fallbackError instanceof Error ? fallbackError.message : ''}`
      );
    }
  }
}

/** Routes a resolved config to the right adapter. */
async function generateReportForConfig(
  config: ProviderConfig & { label: string },
  options: GenerateReportOptions
): Promise<GeneratedReport> {
  if (config.type === 'anthropic') return generateReportWithClaude(config, options);
  if (config.type === 'google') return generateReportWithGemini(config, options);
  return generateReportWithOpenAICompatible(config, options);
}

/**
 * Resolves the primary provider configuration: DB settings first (60s cache),
 * then legacy environment variables derived from the requested provider.
 */
export async function resolveProviderConfig(provider: ReportProvider): Promise<ProviderConfig & { label: string }> {
  const s = await getSettings([
    'AI_PROVIDER_TYPE',
    'AI_BASE_URL',
    'AI_API_KEY',
    'AI_MODEL',
    'ANTHROPIC_API_KEY',
    'ANTHROPIC_MODEL',
    'GEMINI_API_KEY',
    'GEMINI_MODEL',
    'OPENROUTER_API_KEY',
    'OPENROUTER_MODEL',
    'OPENAI_API_KEY',
    'OPENAI_MODEL',
  ]);

  const configuredType = s.AI_PROVIDER_TYPE;
  if (configuredType && s.AI_API_KEY) {
    const type = configuredType as ProviderConfig['type'];
    const model =
      s.AI_MODEL ||
      envModelFor(type) ||
      (type === 'google' ? 'gemini-2.5-flash' : type === 'anthropic' ? 'claude-sonnet-4-5' : 'gpt-4o-mini');
    return {
      type,
      baseUrl: s.AI_BASE_URL ?? defaultBaseUrl(type),
      apiKey: s.AI_API_KEY,
      model,
      label: `AI · ${model}`,
    };
  }

  // Legacy env path.
  if (provider === 'google') {
    const apiKey = s.GEMINI_API_KEY ?? process.env.GEMINI_API_KEY;
    if (!apiKey) throw new Error('Gemini API key is not configured.');
    return {
      type: 'google',
      apiKey,
      model: s.GEMINI_MODEL ?? process.env.GEMINI_MODEL ?? 'gemini-2.5-flash',
      label: 'Gemini',
    };
  }
  if (provider === 'openrouter' || provider === 'openai') {
    const apiKey = s.OPENROUTER_API_KEY ?? process.env.OPENROUTER_API_KEY ?? process.env.OPENAI_API_KEY;
    if (!apiKey) throw new Error('OpenAI-compatible API key is not configured.');
    const baseUrl = provider === 'openrouter' ? 'https://openrouter.ai/api/v1' : 'https://api.openai.com/v1';
    const model =
      s.OPENROUTER_MODEL ??
      process.env.OPENROUTER_MODEL ??
      process.env.OPENAI_MODEL ??
      (provider === 'openrouter' ? 'google/gemini-2.5-flash' : 'gpt-4o-mini');
    return { type: 'openai', baseUrl, apiKey, model, label: provider === 'openrouter' ? 'OpenRouter' : 'OpenAI' };
  }
  const apiKey = s.ANTHROPIC_API_KEY ?? process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error('Anthropic API key is not configured.');
  return {
    type: 'anthropic',
    apiKey,
    model: s.ANTHROPIC_MODEL ?? process.env.ANTHROPIC_MODEL ?? 'claude-sonnet-4-5',
    label: 'Claude',
  };
}

/** Resolves the optional secondary provider config from DB settings. */
export async function resolveFallbackConfig(): Promise<(ProviderConfig & { label: string }) | null> {
  const s = await getSettings([
    'AI_FALLBACK_PROVIDER_TYPE',
    'AI_FALLBACK_BASE_URL',
    'AI_FALLBACK_API_KEY',
    'AI_FALLBACK_MODEL',
  ]);

  const type = s.AI_FALLBACK_PROVIDER_TYPE as ProviderConfig['type'] | null;
  const apiKey = s.AI_FALLBACK_API_KEY;
  if (!type || !apiKey) return null;

  const model =
    s.AI_FALLBACK_MODEL ||
    envModelFor(type) ||
    (type === 'google' ? 'gemini-2.5-flash' : type === 'anthropic' ? 'claude-sonnet-4-5' : 'gpt-4o-mini');

  return {
    type,
    baseUrl: s.AI_FALLBACK_BASE_URL ?? defaultBaseUrl(type),
    apiKey,
    model,
    label: `Fallback · ${model}`,
  };
}

function envModelFor(type: ProviderConfig['type']): string | null {
  if (type === 'anthropic') return process.env.ANTHROPIC_MODEL ?? null;
  if (type === 'google') return process.env.GEMINI_MODEL ?? null;
  return process.env.OPENAI_MODEL ?? process.env.OPENROUTER_MODEL ?? null;
}

function defaultBaseUrl(type: ProviderConfig['type']): string {
  if (type === 'anthropic') return 'https://api.anthropic.com/v1';
  if (type === 'google') return 'https://generativelanguage.googleapis.com/v1beta';
  return 'https://api.openai.com/v1';
}

/**
 * Generates a Lexical-state report through any OpenAI-compatible
 * `/chat/completions` endpoint (OpenAI, DeepSeek, Qwen/DashScope,
 * Kimi/Moonshot, Groq, OpenRouter, Mistral, etc.). Retries once on failure;
 * throws so callers can fall back. Reasoning-model artifacts
 * (`reasoning_content`/`reasoning`) are stripped before parsing.
 */
export async function generateReportWithOpenAICompatible(
  config: ProviderConfig,
  options: GenerateReportOptions
): Promise<GeneratedReport> {
  const apiKey = config.apiKey;
  const baseUrl = (config.baseUrl ?? 'https://api.openai.com/v1').replace(/\/+$/, '');
  const model = config.model;
  const startedAt = Date.now();
  // Keep the request within typical credit balances — some gateways reject large
  // max_tokens with 402 when the account can't afford them.
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
      const res = await fetch(`${baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model,
          messages: [
            { role: 'system', content: withLexicalDesignSpec(options.systemPrompt) },
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
            console.warn(`Insufficient credits — retrying with max_tokens=${affordable}`);
            if (attempt.label === 'retry') {
              throw new Error(`Provider request failed: ${detail}`);
            }
            continue;
          }
        }
        throw new Error(`Provider request failed (${res.status}${detail ? `): ${detail}` : ')'}`);
      }

      const data = (await res.json()) as {
        choices?: Array<{ message?: { content?: string; reasoning_content?: string } }>;
        usage?: { prompt_tokens?: number; completion_tokens?: number; total_tokens?: number };
      };
      const text =
        data.choices?.[0]?.message?.content?.trim() ??
        data.choices?.[0]?.message?.reasoning_content?.trim() ??
        '';
      if (!text) throw new Error('Provider returned an empty response.');

      const json = extractJson(text);
      if (!json) throw new Error('Provider did not return a valid JSON report.');

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
        throw new Error(`Provider generation failed: ${message}`);
      }
      console.warn(`Provider generation ${attempt.label} failed, retrying:`, message);
    }
  }

  throw new Error('Provider generation failed.');
}

/** Legacy alias retained for compatibility — routes to the OpenAI-compatible adapter. */
export async function generateReportWithOpenRouter(options: GenerateReportOptions): Promise<GeneratedReport> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) throw new Error('OpenRouter API key is not configured.');
  const model = process.env.OPENROUTER_MODEL ?? 'google/gemini-2.5-flash';
  return generateReportWithOpenAICompatible(
    { type: 'openai', baseUrl: 'https://openrouter.ai/api/v1', apiKey, model },
    options
  );
}

/**
 * Returns plain text from any configured provider type — used for lightweight
 * tasks (e.g. comment moderation) that do not need a Lexical report.
 */
export async function generateModelText(
  config: ProviderConfig & { label: string },
  system: string,
  user: string,
  maxTokens = 800
): Promise<string> {
  if (config.type === 'anthropic') {
    const anthropic = new Anthropic({ apiKey: config.apiKey });
    const message = await anthropic.messages.create({
      model: config.model,
      max_tokens: maxTokens,
      system,
      messages: [{ role: 'user', content: user }],
    });
    return message.content
      .filter((block) => block.type === 'text')
      .map((block) => block.text)
      .join('');
  }

  if (config.type === 'google') {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(config.model)}:generateContent?key=${encodeURIComponent(config.apiKey)}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: system }] },
          contents: [{ role: 'user', parts: [{ text: user }] }],
          generationConfig: { maxOutputTokens: maxTokens, temperature: 0 },
        }),
      }
    );
    if (!res.ok) throw new Error(`Gemini request failed (${res.status})`);
    const data = (await res.json()) as {
      candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
    };
    return (data.candidates?.[0]?.content?.parts ?? [])
      .map((p) => p.text || '')
      .join('')
      .trim();
  }

  const baseUrl = (config.baseUrl ?? 'https://api.openai.com/v1').replace(/\/+$/, '');
  const res = await fetch(`${baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${config.apiKey}`,
    },
    body: JSON.stringify({
      model: config.model,
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: user },
      ],
      max_tokens: maxTokens,
      temperature: 0,
    }),
  });
  if (!res.ok) throw new Error(`Provider request failed (${res.status})`);
  const data = (await res.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  return (data.choices?.[0]?.message?.content ?? '').trim();
}
