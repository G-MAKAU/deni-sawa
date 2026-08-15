import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { z } from 'zod';
import { requireAdmin, jsonAdminError } from '@/lib/admin-auth';

export const dynamic = 'force-dynamic';

const paramsSchema = z.object({ id: z.string().uuid() });

/**
 * Delivery overview for a health check: which email / WhatsApp templates
 * drive its reports, their activation state, and the live SMTP / WhatsApp
 * provider status. Read-only — templates are edited on their own pages.
 */
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { supabase } = await requireAdmin(request, 'read');
    const { id } = paramsSchema.parse(await params);

    const { data: check } = await supabase.from('health_checks').select('name, slug').eq('id', id).single();

    const [emailResult, whatsappResult, waConfigResult] = await Promise.all([
      supabase
        .from('email_templates')
        .select('template_key, name, subject, is_active, available_variables, updated_at')
        .in('template_key', ['health_check_started', 'health_check_report_summary', 'health_check_report_detailed'])
        .order('template_key'),
      supabase
        .from('whatsapp_templates')
        .select('template_key, name, approval_status, is_active, rejection_reason, updated_at')
        .in('template_key', ['health_check_started', 'health_check_report_summary', 'health_check_report_detailed'])
        .order('template_key'),
      supabase.from('whatsapp_config').select('*').limit(1).maybeSingle(),
    ]);

    const smtpConfigured = Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASSWORD);
    const waConfig = waConfigResult.data as
      | { provider: string; is_active: boolean; from_number: string | null; account_sid: string | null; phone_number_id: string | null }
      | null
      | undefined;

    return NextResponse.json({
      check: check ?? { name: 'Unknown', slug: '' },
      emailTemplates: emailResult.data ?? [],
      whatsappTemplates: whatsappResult.data ?? [],
      smtp: {
        configured: smtpConfigured,
        host: process.env.SMTP_HOST ?? null,
        fromName: process.env.SMTP_FROM_NAME ?? 'Deni Sawa Partners',
        fromEmail: process.env.SMTP_FROM_EMAIL ?? 'noreply@deni-sawa.com',
      },
      whatsapp: {
        configured: Boolean(waConfig),
        provider: waConfig?.provider ?? 'none',
        is_active: waConfig?.is_active ?? false,
        from_number: waConfig?.from_number ?? null,
        account_sid: waConfig?.account_sid ?? null,
        phone_number_id: waConfig?.phone_number_id ?? null,
        encryption_key_configured: Boolean(process.env.CREDENTIALS_ENCRYPTION_KEY),
      },
    });
  } catch (error) {
    return jsonAdminError(error, 'Failed to load delivery configuration');
  }
}
