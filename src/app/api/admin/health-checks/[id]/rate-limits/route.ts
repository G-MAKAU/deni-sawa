import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { z } from 'zod';
import { requireAdmin, jsonAdminError } from '@/lib/admin-auth';

export const dynamic = 'force-dynamic';

const paramsSchema = z.object({ id: z.string().uuid() });

const updateSchema = z.object({
  monthly_limit_per_ip: z.number().int().min(0).max(10000),
  monthly_limit_per_email: z.number().int().min(0).max(10000),
  monthly_limit_per_whatsapp: z.number().int().min(0).max(10000),
  is_active: z.boolean().optional(),
});

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { supabase } = await requireAdmin(request, 'read');
    const { id } = paramsSchema.parse(await params);

    const { data, error } = await supabase
      .from('health_check_rate_limit_config')
      .select('*')
      .eq('health_check_id', id)
      .maybeSingle();

    if (error) throw error;

    return NextResponse.json({
      config: data ?? {
        health_check_id: id,
        monthly_limit_per_ip: 5,
        monthly_limit_per_email: 5,
        monthly_limit_per_whatsapp: 5,
        is_active: true,
      },
    });
  } catch (error) {
    return jsonAdminError(error, 'Failed to load rate limit config');
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

    const parsed = updateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Validation failed', details: parsed.error.flatten() }, { status: 422 });
    }

    const { data: existing } = await supabase
      .from('health_check_rate_limit_config')
      .select('id')
      .eq('health_check_id', id)
      .maybeSingle();

    let result;
    if (existing) {
      const { data, error } = await supabase
        .from('health_check_rate_limit_config')
        .update({ ...parsed.data, updated_by: currentAdmin.id })
        .eq('health_check_id', id)
        .select()
        .single();
      if (error) throw error;
      result = data;
    } else {
      const { data, error } = await supabase
        .from('health_check_rate_limit_config')
        .insert({ health_check_id: id, ...parsed.data, updated_by: currentAdmin.id })
        .select()
        .single();
      if (error) throw error;
      result = data;
    }

    return NextResponse.json({ config: result });
  } catch (error) {
    return jsonAdminError(error, 'Failed to save rate limit config');
  }
}
