import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { z } from 'zod';
import { requireAdmin, jsonAdminError } from '@/lib/admin-auth';
import { lexicalToPlainText } from '@/lib/lexical-to-plaintext';

export const dynamic = 'force-dynamic';

const paramsSchema = z.object({ id: z.string().uuid() });

const saveSchema = z
  .object({
    report_type: z.enum(['summary', 'detailed']),
    system_prompt_lexical: z.record(z.string(), z.unknown()).nullable().optional(),
    system_prompt: z.string().max(20000).optional(),
    header_lexical: z.record(z.string(), z.unknown()).nullable().optional(),
    footer_lexical: z.record(z.string(), z.unknown()).nullable().optional(),
    provider: z.enum(['anthropic', 'google']).optional(),
    model: z.string().min(1).max(120).optional(),
    max_tokens: z.number().int().min(500).max(200000).optional(),
    is_active: z.boolean().optional(),
    action: z.enum(['save', 'rollback']).default('save'),
  })
  .refine((data) => data.action === 'rollback' || data.system_prompt_lexical !== undefined || data.system_prompt !== undefined, {
    message: 'Provide system_prompt_lexical or system_prompt.',
    path: ['system_prompt'],
  });

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { supabase } = await requireAdmin(request, 'read');
    const { id } = paramsSchema.parse(await params);

    const { data: prompts, error } = await supabase
      .from('health_check_report_prompts')
      .select('*, updated_by_admin:admin_users(full_name)')
      .eq('health_check_id', id)
      .order('report_type', { ascending: true });

    if (error) throw error;

    const normalized = (prompts ?? []).map((prompt: Record<string, unknown>) => {
      const updater = Array.isArray(prompt.updated_by_admin) ? prompt.updated_by_admin[0] : prompt.updated_by_admin;
      return { ...prompt, updated_by_name: (updater as { full_name?: string } | undefined)?.full_name ?? null };
    });

    return NextResponse.json({ prompts: normalized });
  } catch (error) {
    return jsonAdminError(error, 'Failed to load report prompts');
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { supabase, currentAdmin } = await requireAdmin(request, 'update');
    const { id } = paramsSchema.parse(await params);

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
    }

    const parsed = saveSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Validation failed', details: parsed.error.flatten() }, { status: 422 });
    }

    const { report_type, system_prompt_lexical, system_prompt, header_lexical, footer_lexical, provider, model, max_tokens, is_active, action } = parsed.data;

    // Fetch current row so we can compare for rollback.
    const { data: current } = await supabase
      .from('health_check_report_prompts')
      .select('*')
      .eq('health_check_id', id)
      .eq('report_type', report_type)
      .maybeSingle();

    if (!current) {
      // First save — create the row with default prompt if it doesn't exist.
      const { data: created, error: createError } = await supabase
        .from('health_check_report_prompts')
        .insert({
          health_check_id: id,
          report_type,
          system_prompt: system_prompt ?? lexicalToPlainText(system_prompt_lexical ?? {}),
          system_prompt_lexical,
          provider: provider ?? 'anthropic',
          model: model ?? 'claude-sonnet-4-6',
          max_tokens: max_tokens ?? 4000,
          is_active: is_active ?? true,
          updated_by: currentAdmin.id,
        })
        .select()
        .single();

      if (createError) throw createError;
      return NextResponse.json({ prompt: { ...created, updated_by_name: currentAdmin.full_name } }, { status: 201 });
    }

    let payload: Record<string, unknown>;

    if (action === 'rollback') {
      if (!current.previous_system_prompt) {
        return NextResponse.json({ error: 'There is no previous version to roll back to.' }, { status: 422 });
      }
      payload = {
        system_prompt: current.previous_system_prompt,
        previous_system_prompt: null,
        updated_by: currentAdmin.id,
      };
    } else {
      const resolvedPlain =
        system_prompt_lexical !== undefined
          ? lexicalToPlainText(system_prompt_lexical ?? {})
          : system_prompt ?? current.system_prompt;

      payload = {
        system_prompt: resolvedPlain,
        ...(system_prompt_lexical !== undefined ? { system_prompt_lexical } : {}),
        ...(header_lexical !== undefined ? { header_lexical } : {}),
        ...(footer_lexical !== undefined ? { footer_lexical } : {}),
        ...(provider !== undefined ? { provider } : {}),
        ...(model !== undefined ? { model } : {}),
        ...(max_tokens !== undefined ? { max_tokens } : {}),
        ...(is_active !== undefined ? { is_active } : {}),
        updated_by: currentAdmin.id,
      };
    }

    const { data, error } = await supabase
      .from('health_check_report_prompts')
      .update(payload)
      .eq('health_check_id', id)
      .eq('report_type', report_type)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ prompt: { ...data, updated_by_name: currentAdmin.full_name } });
  } catch (error) {
    return jsonAdminError(error, 'Failed to save report prompt');
  }
}
