import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { requireAdmin, jsonAdminError, jsonAdminWriteError, adminWriteClient } from '@/lib/admin-auth';
import { smtpProfiles } from '@/lib/email';
import { getSettings, invalidateSettings, getSetting } from '@/lib/settings';
import { encryptSecret } from '@/lib/crypto';

export const dynamic = 'force-dynamic';

// Only these keys may be written via this endpoint.
const AI_SETTING_KEYS = new Set([
  'AI_PROVIDER_TYPE',
  'AI_BASE_URL',
  'AI_API_KEY',
  'AI_MODEL',
  'AI_FALLBACK_PROVIDER_TYPE',
  'AI_FALLBACK_BASE_URL',
  'AI_FALLBACK_API_KEY',
  'AI_FALLBACK_MODEL',
  'COMMENT_AI_MODERATION_ENABLED',
]);

// Keys whose values are secrets and must be encrypted before storage.
const AI_SECRET_KEYS = new Set(['AI_API_KEY', 'AI_FALLBACK_API_KEY']);

// Roles allowed to edit settings.
const AI_EDITOR_ROLES = new Set(['super_admin', 'admin']);

function maskSecret(value: string | null): string | null {
  if (!value) return null;
  if (value.length <= 4) return '••••';
  return `••••${value.slice(-4)}`;
}

async function aiOverview() {
  const s = await getSettings([
    'AI_PROVIDER_TYPE',
    'AI_BASE_URL',
    'AI_API_KEY',
    'AI_MODEL',
    'AI_FALLBACK_PROVIDER_TYPE',
    'AI_FALLBACK_BASE_URL',
    'AI_FALLBACK_API_KEY',
    'AI_FALLBACK_MODEL',
  ]);

  const fType = s.AI_FALLBACK_PROVIDER_TYPE;
  const fApiKey = s.AI_FALLBACK_API_KEY;
  const fallback = fType && fApiKey
    ? { type: fType, baseUrl: s.AI_FALLBACK_BASE_URL, model: s.AI_FALLBACK_MODEL, keyConfigured: true, maskedKey: maskSecret(fApiKey) }
    : null;

  return {
    primary: {
      type: s.AI_PROVIDER_TYPE,
      baseUrl: s.AI_BASE_URL,
      model: s.AI_MODEL,
      keyConfigured: Boolean(s.AI_API_KEY),
      maskedKey: maskSecret(s.AI_API_KEY),
    },
    fallback,
    editable: [...AI_SETTING_KEYS],
  };
}

export async function GET(request: NextRequest) {
  try {
    await requireAdmin(request, 'read');

    const profiles = smtpProfiles();
    const anthropicConfigured = Boolean(await getSetting('ANTHROPIC_API_KEY'));

    return NextResponse.json({
      settings: {
        siteUrl: process.env.NEXT_PUBLIC_SITE_URL ?? 'https://www.denisawa.co.ke',
        smtp: {
          configured: profiles.length > 0,
          host: profiles[0]?.host ?? null,
          fromName: process.env.SMTP_FROM_NAME ?? 'Deni Sawa Partners',
          fromEmail: process.env.SMTP_FROM_EMAIL ?? 'noreply@denisawa.co.ke',
          profiles: profiles.map((p) => ({
            key: p.key,
            label: p.label,
            host: p.host,
            port: p.port,
            secure: p.secure,
            user: p.user,
            senderDomains: p.senderDomains,
          })),
        },
        whatsapp: {
          provider: process.env.WHATSAPP_PROVIDER ?? 'twilio',
          encryptionKeyConfigured: Boolean(process.env.CREDENTIALS_ENCRYPTION_KEY),
          twilioConfigured: Boolean(process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN),
          metaConfigured: Boolean(process.env.META_WA_PHONE_NUMBER_ID && process.env.META_WA_ACCESS_TOKEN),
        },
        anthropic: {
          configured: anthropicConfigured,
          model: process.env.ANTHROPIC_MODEL ?? 'claude-sonnet-4-6',
        },
        ai: await aiOverview(),
        comments: {
          aiModerationEnabled: (await getSetting('COMMENT_AI_MODERATION_ENABLED')) !== 'false',
        },
        supabase: {
          configured: Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY),
        },
      },
    });
  } catch (error) {
    return jsonAdminError(error, 'Failed to load settings');
  }
}

interface UpsertBody {
  settings?: Record<string, string>;
}

export async function PUT(request: NextRequest) {
  try {
    const ctx = await requireAdmin(request, 'update');
    if (!AI_EDITOR_ROLES.has(ctx.currentAdmin.role)) {
      return NextResponse.json(
        { error: 'Only super_admin and admin roles can change settings.' },
        { status: 403 }
      );
    }

    let body: UpsertBody = {};
    try {
      body = (await request.json()) as UpsertBody;
    } catch {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
    }

    const entries = Object.entries(body.settings ?? {}).filter(
      ([key]) => AI_SETTING_KEYS.has(key)
    );
    if (entries.length === 0) {
      return NextResponse.json({ error: 'No valid settings provided.' }, { status: 400 });
    }

    const supabase = adminWriteClient(ctx);
    const email = ctx.currentAdmin.email;

    for (const [key, rawValue] of entries) {
      const value = (rawValue ?? '').trim();
      const stored = AI_SECRET_KEYS.has(key) && value ? encryptSecret(value) : value;
      const { error } = await supabase.from('app_settings').upsert(
        {
          key,
          value: stored,
          is_secret: AI_SECRET_KEYS.has(key),
          description: settingDescription(key),
          updated_at: new Date().toISOString(),
          updated_by: email,
        },
        { onConflict: 'key' }
      );
      if (error) throw error;
    }

    // In-process cache is per-instance; this clears the local one immediately.
    invalidateSettings();

    return NextResponse.json({ ok: true, updated: entries.map(([k]) => k), ai: await aiOverview() });
  } catch (error) {
    return jsonAdminWriteError(error, 'Failed to update settings');
  }
}

/** Keeps PUT and POST symmetric for convenience. */
export const POST = PUT;

function settingDescription(key: string): string {
  const map: Record<string, string> = {
    AI_PROVIDER_TYPE: 'Primary AI provider type: anthropic | google | openai',
    AI_BASE_URL: 'Primary OpenAI-compatible base URL (chat/completions)',
    AI_API_KEY: 'Primary AI API key (encrypted)',
    AI_MODEL: 'Primary model id',
    AI_FALLBACK_PROVIDER_TYPE: 'Fallback provider type: anthropic | google | openai',
    AI_FALLBACK_BASE_URL: 'Fallback OpenAI-compatible base URL',
    AI_FALLBACK_API_KEY: 'Fallback AI API key (encrypted)',
    AI_FALLBACK_MODEL: 'Fallback model id',
    COMMENT_AI_MODERATION_ENABLED: 'Automatically moderate blog comments with AI on submit',
  };
  return map[key] ?? null;
}