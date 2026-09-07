import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { requireAdmin, jsonAdminError } from '@/lib/admin-auth';
import { resolveProviderConfig, resolveFallbackConfig } from '@/lib/report-generator';

export const dynamic = 'force-dynamic';

interface ProviderTestResult {
  label: string;
  type: string;
  model: string;
  baseUrl: string;
  ok: boolean;
  latencyMs: number;
  error?: string;
}

async function testProvider(type: 'primary' | 'fallback'): Promise<ProviderTestResult> {
  const start = Date.now();
  try {
    const config = type === 'primary'
      ? await resolveProviderConfig('anthropic')
      : await resolveFallbackConfig();

    if (!config) {
      return {
        label: type === 'primary' ? 'Primary' : 'Fallback',
        type: 'none',
        model: '—',
        baseUrl: '—',
        ok: false,
        latencyMs: 0,
        error: `${type} provider not configured`,
      };
    }

    const baseUrl = (config.baseUrl ?? '').replace(/\/+$/, '');
    const model = config.model;

    if (config.type === 'anthropic') {
      const res = await fetch(`${baseUrl}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': config.apiKey,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model,
          max_tokens: 10,
          messages: [{ role: 'user', content: 'Reply with only: OK' }],
        }),
      });
      if (!res.ok) {
        const body = await res.text();
        return {
          label: config.label,
          type: config.type,
          model,
          baseUrl,
          ok: false,
          latencyMs: Date.now() - start,
          error: `HTTP ${res.status}: ${body.slice(0, 200)}`,
        };
      }
      return {
        label: config.label,
        type: config.type,
        model,
        baseUrl,
        ok: true,
        latencyMs: Date.now() - start,
      };
    }

    if (config.type === 'google') {
      const res = await fetch(
        `${baseUrl}/models/${model}:generateContent?key=${config.apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: 'Reply with only: OK' }] }],
            generationConfig: { maxOutputTokens: 10 },
          }),
        }
      );
      if (!res.ok) {
        const body = await res.text();
        return {
          label: config.label,
          type: config.type,
          model,
          baseUrl,
          ok: false,
          latencyMs: Date.now() - start,
          error: `HTTP ${res.status}: ${body.slice(0, 200)}`,
        };
      }
      return {
        label: config.label,
        type: config.type,
        model,
        baseUrl,
        ok: true,
        latencyMs: Date.now() - start,
      };
    }

    // OpenAI-compatible
    const res = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${config.apiKey}`,
      },
      body: JSON.stringify({
        model,
        max_tokens: 10,
        messages: [{ role: 'user', content: 'Reply with only: OK' }],
      }),
    });
    if (!res.ok) {
      const body = await res.text();
      return {
        label: config.label,
        type: config.type,
        model,
        baseUrl,
        ok: false,
        latencyMs: Date.now() - start,
        error: `HTTP ${res.status}: ${body.slice(0, 200)}`,
      };
    }
    return {
      label: config.label,
      type: config.type,
      model,
      baseUrl,
      ok: true,
      latencyMs: Date.now() - start,
    };
  } catch (error) {
    return {
      label: type === 'primary' ? 'Primary' : 'Fallback',
      type: 'error',
      model: '—',
      baseUrl: '—',
      ok: false,
      latencyMs: Date.now() - start,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireAdmin(request, 'update');

    const [primary, fallback] = await Promise.all([
      testProvider('primary'),
      testProvider('fallback'),
    ]);

    return NextResponse.json({
      ok: primary.ok || (fallback?.ok ?? false),
      primary,
      fallback,
    });
  } catch (error) {
    return jsonAdminError(error, 'Failed to test AI providers');
  }
}
