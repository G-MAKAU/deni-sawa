import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { requireAdmin, jsonAdminError } from '@/lib/admin-auth';
import { getSetting } from '@/lib/settings';

export const dynamic = 'force-dynamic';

const FALLBACK_ANTHROPIC = ['claude-sonnet-4-6', 'claude-sonnet-4-5', 'claude-opus-4-1', 'claude-haiku-4-5'];
const FALLBACK_GOOGLE = ['gemini-2.5-pro', 'gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-1.5-pro'];
const FALLBACK_OPENROUTER = [
  'anthropic/claude-sonnet-4-6',
  'anthropic/claude-sonnet-4-5',
  'anthropic/claude-opus-4-1',
  'anthropic/claude-haiku-4-5',
  'google/gemini-2.5-pro',
  'google/gemini-2.5-flash',
  'openai/gpt-4o',
  'openai/gpt-4o-mini',
];
// Popular OpenAI-compatible vendors (DeepSeek, Qwen, Kimi, Groq, etc.) — shown
// as suggestions when no live list can be fetched. The admin can always type
// any model id directly.
const FALLBACK_OPENAI_COMPATIBLE = [
  'deepseek-chat',
  'deepseek-reasoner',
  'qwen-plus',
  'qwen-max',
  'moonshot-v1-8k',
  'moonshot-v1-32k',
  'kimi-latest',
  'llama-3.3-70b-versatile',
  'gpt-4o',
  'gpt-4o-mini',
  'gpt-4.1',
];

/** Live Anthropic model ids (fallback list when unavailable). */
async function fetchAnthropicModels(apiKey: string): Promise<string[]> {
  if (!apiKey) return FALLBACK_ANTHROPIC;
  try {
    const res = await fetch('https://api.anthropic.com/v1/models', {
      headers: { 'x-api-key': apiKey, 'anthropic-version': '2023-06-01' },
    });
    if (!res.ok) return FALLBACK_ANTHROPIC;
    const data = (await res.json()) as { data?: Array<{ id: string }> };
    const ids = (data.data ?? []).map((m) => m.id);
    return ids.length ? ids.filter((id) => id.includes('claude')).sort() : FALLBACK_ANTHROPIC;
  } catch {
    return FALLBACK_ANTHROPIC;
  }
}

/** Live Gemini model ids that support generateContent (fallback list when unavailable). */
async function fetchGoogleModels(apiKey: string): Promise<string[]> {
  if (!apiKey) return FALLBACK_GOOGLE;
  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models?key=${encodeURIComponent(apiKey)}&pageSize=200`
    );
    if (!res.ok) return FALLBACK_GOOGLE;
    const data = (await res.json()) as { models?: Array<{ name: string; supportedGenerationMethods?: string[] }> };
    const ids = (data.models ?? [])
      .filter((m) => m.name.startsWith('models/gemini-') && (m.supportedGenerationMethods ?? []).includes('generateContent'))
      .map((m) => m.name.replace('models/', ''));
    return ids.length ? [...new Set(ids)].sort() : FALLBACK_GOOGLE;
  } catch {
    return FALLBACK_GOOGLE;
  }
}

/** Live OpenAI-compatible model ids from the configured base URL (DeepSeek, Qwen, Kimi, Groq, OpenRouter…). */
async function fetchOpenAICompatibleModels(baseUrl: string, apiKey: string): Promise<string[]> {
  if (!apiKey || !baseUrl) return FALLBACK_OPENAI_COMPATIBLE;
  try {
    const res = await fetch(`${baseUrl.replace(/\/+$/, '')}/models`, {
      headers: { Authorization: `Bearer ${apiKey}` },
    });
    if (!res.ok) return FALLBACK_OPENAI_COMPATIBLE;
    const data = (await res.json()) as { data?: Array<{ id: string }> };
    const ids = (data.data ?? []).map((m) => m.id).filter(Boolean);
    return ids.length ? [...new Set(ids)].sort() : FALLBACK_OPENAI_COMPATIBLE;
  } catch {
    return FALLBACK_OPENAI_COMPATIBLE;
  }
}

/**
 * Returns the models available for report generation. Fetches live lists from
 * Anthropic, Google and the configured OpenAI-compatible base URL (if set) so
 * newly released models appear without a redeploy; the admin can also type any
 * model name directly.
 */
export async function GET(request: NextRequest) {
  try {
    await requireAdmin(request, 'read');

    const [anthropicKey, geminiKey, aiBaseUrl, aiApiKey] = await Promise.all([
      getSetting('ANTHROPIC_API_KEY'),
      getSetting('GEMINI_API_KEY'),
      getSetting('AI_BASE_URL'),
      getSetting('AI_API_KEY'),
    ]);
    const openaiBase = aiBaseUrl || process.env.OPENROUTER_API_KEY ? 'https://openrouter.ai/api/v1' : '';
    const openaiKey = aiApiKey || process.env.OPENROUTER_API_KEY || process.env.OPENAI_API_KEY || '';

    const [anthropic, google, openaiCompatible] = await Promise.all([
      fetchAnthropicModels(anthropicKey || process.env.ANTHROPIC_API_KEY || ''),
      fetchGoogleModels(geminiKey || process.env.GEMINI_API_KEY || ''),
      fetchOpenAICompatibleModels(openaiBase || aiBaseUrl || '', openaiKey),
    ]);

    return NextResponse.json(
      {
        anthropic,
        google,
        openrouter: FALLBACK_OPENROUTER,
        openaiCompatible,
        providers: {
          anthropic: { baseUrl: 'https://api.anthropic.com/v1' },
          google: { baseUrl: 'https://generativelanguage.googleapis.com/v1beta' },
          openai: { baseUrl: 'https://api.openai.com/v1' },
          deepseek: { baseUrl: 'https://api.deepseek.com/v1' },
          qwen: { baseUrl: 'https://dashscope.aliyuncs.com/compatible-mode/v1' },
          kimi: { baseUrl: 'https://api.moonshot.cn/v1' },
          groq: { baseUrl: 'https://api.groq.com/openai/v1' },
          openrouter: { baseUrl: 'https://openrouter.ai/api/v1' },
        },
      },
      { headers: { 'Cache-Control': 'public, max-age=300' } }
    );
  } catch (error) {
    return jsonAdminError(error, 'Failed to load AI models');
  }
}