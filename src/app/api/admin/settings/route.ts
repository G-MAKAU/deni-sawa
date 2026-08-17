import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { requireAdmin, jsonAdminError } from '@/lib/admin-auth';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    await requireAdmin(request, 'read');

    return NextResponse.json({
      settings: {
        siteUrl: process.env.NEXT_PUBLIC_SITE_URL ?? 'https://denisawa.co.ke',
        smtp: {
          configured: Boolean(
            (process.env.EMAIL_HOST ?? process.env.SMTP_HOST) &&
              (process.env.EMAIL_USER ?? process.env.SMTP_USER) &&
              (process.env.EMAIL_PASS ?? process.env.SMTP_PASSWORD)
          ),
          host: process.env.EMAIL_HOST ?? process.env.SMTP_HOST ?? null,
          fromName: process.env.SMTP_FROM_NAME ?? 'Deni Sawa Partners',
          fromEmail: process.env.SMTP_FROM_EMAIL ?? 'noreply@denisawa.co.ke',
        },
        whatsapp: {
          provider: process.env.WHATSAPP_PROVIDER ?? 'twilio',
          encryptionKeyConfigured: Boolean(process.env.CREDENTIALS_ENCRYPTION_KEY),
          twilioConfigured: Boolean(process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN),
          metaConfigured: Boolean(process.env.META_WA_PHONE_NUMBER_ID && process.env.META_WA_ACCESS_TOKEN),
        },
        anthropic: {
          configured: Boolean(process.env.ANTHROPIC_API_KEY),
          model: process.env.ANTHROPIC_MODEL ?? 'claude-sonnet-4-6',
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
