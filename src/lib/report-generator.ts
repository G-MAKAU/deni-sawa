import Anthropic from '@anthropic-ai/sdk';

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

export type ReportProvider = 'anthropic' | 'google';

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

const ALLOWED_NODES = new Set(['root', 'heading', 'paragraph', 'quote', 'list', 'listitem', 'text', 'callout', 'divider', 'link']);
const TEXT_KEYS = new Set(['text', 'link']);
const LEAF_KEYS = new Set(['divider']);
const HEADING_TAGS = new Set(['h1', 'h2', 'h3', 'h4', 'h5', 'h6']);
const LIST_TYPES = new Set(['bullet', 'number', 'check']);

/** Recursively whitelist a parsed Lexical tree so only known nodes survive. */
function sanitizeNode(node: unknown): unknown | null {
  if (!node || typeof node !== 'object') return null;
  const n = node as Record<string, unknown>;
  const type = typeof n.type === 'string' ? n.type : '';

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

  if (!ALLOWED_NODES.has(type)) return null;
  if (LEAF_KEYS.has(type)) return { children: [], direction: 'ltr', format: '', indent: 0, type, version: 1 };

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
  return { children, direction: 'ltr', format: '', indent: 0, textFormat: 0, textStyle: '', type, version: 1 };
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
 * stored prompt configuration. Returns null when the API key is missing or the
 * response cannot be parsed, so callers can fall back gracefully.
 */
export async function generateReportWithClaude(options: GenerateReportOptions): Promise<GeneratedReport | null> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return null;

  const startedAt = Date.now();
  const model = options.model ?? process.env.ANTHROPIC_MODEL ?? 'claude-sonnet-4-6';
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
    if (!json) return null;

    const state = validateLexicalState(JSON.parse(json));
    return {
      state,
      model,
      tokensUsed: message.usage?.input_tokens ?? 0,
      generationSeconds: (Date.now() - startedAt) / 1000,
    };
  } catch (error) {
    console.error('Claude generation failed:', error);
    return null;
  }
}

/**
 * Generates a Lexical-state report via the Google Gemini API. Mirrors the
 * Claude path — the model must return a valid Lexical EditorState JSON.
 */
export async function generateReportWithGemini(options: GenerateReportOptions): Promise<GeneratedReport | null> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;

  const startedAt = Date.now();
  const model = options.model ?? process.env.GEMINI_MODEL ?? 'gemini-2.5-pro';
  // Gemini output caps are lower than the stored max — clamp to a safe ceiling.
  const maxTokens = Math.min(options.maxTokens ?? 4000, 32768);

  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: options.systemPrompt }] },
          contents: [{ role: 'user', parts: [{ text: options.userContent }] }],
          generationConfig: { maxOutputTokens: maxTokens, temperature: 0.6 },
        }),
      }
    );

    if (!res.ok) return null;

    const data = (await res.json()) as {
      candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
    };
    const text = data.candidates?.[0]?.content?.parts
      ?.map((p) => p.text || '')
      .join('')
      .trim();
    if (!text) return null;

    const json = extractJson(text);
    if (!json) return null;

    const state = validateLexicalState(JSON.parse(json));
    return {
      state,
      model,
      generationSeconds: (Date.now() - startedAt) / 1000,
    };
  } catch (error) {
    console.error('Gemini generation failed:', error);
    return null;
  }
}

/** Dispatches to the configured provider (anthropic | google). */
export function generateReportForProvider(
  provider: ReportProvider,
  options: GenerateReportOptions
): Promise<GeneratedReport | null> {
  return provider === 'google' ? generateReportWithGemini(options) : generateReportWithClaude(options);
}
