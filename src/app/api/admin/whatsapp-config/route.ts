import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { z } from 'zod';
import { requireAdmin, jsonAdminError } from '@/lib/admin-auth';
import { encryptSecret } from '@/lib/whatsapp';

export const dynamic = 'force-dynamic';

const updateSchema = z.object({
  provider: z.enum(['twilio', 'meta_cloud_api', 'infobip']),
  phone_number_id: z.string().max(120).nullable().optional(),
  access_token: z.string().max(2000).nullable().optional(),
  account_sid: z.string().max(200).nullable().optional(),
  auth_token: z.string().max(2000).nullable().optional(),
  from_number: z.string().max(120).nullable().optional(),
  is_active: z.boolean().optional(),
  webhook_verify_token: z.string().max(200).nullable().optional(),
});

function maskSecret(value: string): string {
  if (value.length <= 8) return '••••••••';
  return `${value.slice(0, 4)}••••${value.slice(-4)}`;
}

export async function GET(request: NextRequest) {
  try {
    const { supabase } = await requireAdmin(request, 'read');

    const { data, error } = await supabase.from('whatsapp_config').select('*').limit(1).maybeSingle();
    if (error) throw error;

    return NextResponse.json({
      config: data
        ? {
            provider: data.provider,
            phone_number_id: data.phone_number_id,
            account_sid: data.account_sid,
            from_number: data.from_number,
            is_active: data.is_active,
            webhook_verify_token: data.webhook_verify_token ?? null,
            has_access_token: Boolean(data.access_token_encrypted),
            has_auth_token: Boolean(data.auth_token_encrypted),
            access_token_masked: data.access_token_encrypted ? maskSecret(data.access_token_encrypted) : null,
            auth_token_masked: data.auth_token_encrypted ? maskSecret(data.auth_token_encrypted) : null,
          }
        : null,
    });
  } catch (error) {
    return jsonAdminError(error, 'Failed to load WhatsApp configuration');
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { supabase, currentAdmin } = await requireAdmin(request, 'update');

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
    }

    const parsed = updateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Validation failed', details: parsed.error.flatten() }, { status: 422 });
    }

    const service = supabase;
    const { data: existing } = await service.from('whatsapp_config').select('*').limit(1).maybeSingle();

    // Build the update, encrypting only newly provided secrets.
    const payload: Record<string, unknown> = {
      provider: parsed.data.provider,
      updated_by: currentAdmin.id,
    };

    if (parsed.data.phone_number_id !== undefined) payload.phone_number_id = parsed.data.phone_number_id ?? null;
    if (parsed.data.account_sid !== undefined) payload.account_sid = parsed.data.account_sid ?? null;
    if (parsed.data.from_number !== undefined) payload.from_number = parsed.data.from_number ?? null;
    if (parsed.data.is_active !== undefined) payload.is_active = parsed.data.is_active;
    if (parsed.data.webhook_verify_token !== undefined) payload.webhook_verify_token = parsed.data.webhook_verify_token ?? null;
    if (parsed.data.access_token !== undefined && parsed.data.access_token !== null && parsed.data.access_token !== '') {
      payload.access_token_encrypted = encryptSecret(parsed.data.access_token);
    }
    if (parsed.data.auth_token !== undefined && parsed.data.auth_token !== null && parsed.data.auth_token !== '') {
      payload.auth_token_encrypted = encryptSecret(parsed.data.auth_token);
    }

    let result;
    if (existing) {
      const { data, error } = await service.from('whatsapp_config').update(payload).eq('id', existing.id).select().single();
      if (error) throw error;
      result = data;
    } else {
      const { data, error } = await service.from('whatsapp_config').insert(payload).select().single();
      if (error) throw error;
      result = data;
    }

    return NextResponse.json({
      config: {
        provider: result.provider,
        phone_number_id: result.phone_number_id,
        account_sid: result.account_sid,
        from_number: result.from_number,
        is_active: result.is_active,
        webhook_verify_token: result.webhook_verify_token ?? null,
        has_access_token: Boolean(result.access_token_encrypted),
        has_auth_token: Boolean(result.auth_token_encrypted),
        access_token_masked: result.access_token_encrypted ? maskSecret(result.access_token_encrypted) : null,
        auth_token_masked: result.auth_token_encrypted ? maskSecret(result.auth_token_encrypted) : null,
      },
    });
  } catch (error) {
    return jsonAdminError(error, 'Failed to save WhatsApp configuration');
  }
}
