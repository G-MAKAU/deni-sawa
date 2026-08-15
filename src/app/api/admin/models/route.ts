import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { requireAdmin, jsonAdminError } from '@/lib/admin-auth';

export const dynamic = 'force-dynamic';

const FALLBACK_ANTHROPIC = ['claude-sonnet-4-6', 'claude-sonnet-4-5', 'claude-opus-4-1', 'claude-haiku-4-5'];
const FALLBACK_GOOGLE = ['gemini-2.5-pro', 'gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-1.5-pro'];

/** Live model ids from the Anthropic API (fallback list when unavailable). */
async function fetchAnthropicModels(): Promise<string[]> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
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
async function fetchGoogleModels(): Promise<string[]> {
  const apiKey = process.env.GEMINI_API_KEY;
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

/**
 * Returns the models available for report generation. Fetches the live lists
 * from Anthropic and Google so newly released models appear without a redeploy;
 * the admin can also type any model name directly.
 */
export async function GET(request: NextRequest) {
  try {
    await requireAdmin(request, 'read');
    const [anthropic, google] = await Promise.all([fetchAnthropicModels(), fetchGoogleModels()]);
    return NextResponse.json(
      { anthropic, google },
      { headers: { 'Cache-Control': 'public, max-age=300' } }
    );
  } catch (error) {
    return jsonAdminError(error, 'Failed to load AI models');
  }
}
