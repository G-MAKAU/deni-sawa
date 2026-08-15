import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { z } from 'zod';
import { requireAdmin, jsonAdminError } from '@/lib/admin-auth';

export const dynamic = 'force-dynamic';

const createSchema = z.object({
  name: z.string().min(1).max(120),
  slug: z.string().min(1).max(120).optional(),
  description: z.string().max(1000).optional().nullable(),
  estimated_minutes: z.number().int().min(1).max(600).optional().nullable(),
  tags: z.array(z.string()).max(20).optional(),
  is_active: z.boolean().optional(),
  sort_order: z.number().int().optional(),
});

function makeSlug(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export async function GET(request: NextRequest) {
  try {
    const { supabase } = await requireAdmin(request, 'read');

    const { data, error } = await supabase
      .from('health_checks')
      .select('*, sections:health_check_sections(count)')
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: true });

    if (error) throw error;

    const checks = (data ?? []).map((check: Record<string, unknown>) => {
      const sections = Array.isArray(check.sections) ? check.sections[0] : check.sections;
      return { ...check, section_count: (sections as { count?: number } | undefined)?.count ?? 0 };
    });

    return NextResponse.json({ checks });
  } catch (error) {
    return jsonAdminError(error, 'Failed to load health checks');
  }
}

export async function POST(request: NextRequest) {
  try {
    const { supabase, currentAdmin } = await requireAdmin(request, 'create');

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
    }

    const parsed = createSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Validation failed', details: parsed.error.flatten() }, { status: 422 });
    }

    const { name, slug, description, estimated_minutes, tags, is_active, sort_order } = parsed.data;
    const autoSlug = slug?.trim() ? makeSlug(slug) : makeSlug(name);

    const { data, error } = await supabase
      .from('health_checks')
      .insert({
        name,
        slug: autoSlug,
        description,
        estimated_minutes,
        tags: tags ?? [],
        is_active: is_active ?? true,
        sort_order: sort_order ?? 0,
      })
      .select()
      .single();

    if (error) throw error;

    // Create the default report prompts (summary + detailed) with a sensible default.
    const defaultPrompt =
      'You are a professional financial analyst for Deni Sawa Partners. The user has completed a health check. Return ONLY a valid Lexical EditorState JSON object. Use HeadingNode H1 for the report title, HeadingNode H2 for each section, ParagraphNode for findings. Do NOT return any text outside the JSON object.';

    const { error: promptError } = await supabase.from('health_check_report_prompts').insert([
      { health_check_id: data.id, report_type: 'summary', system_prompt: defaultPrompt, max_tokens: 2000, updated_by: currentAdmin.id },
      { health_check_id: data.id, report_type: 'detailed', system_prompt: defaultPrompt, max_tokens: 4000, updated_by: currentAdmin.id },
    ]);

    if (promptError) throw promptError;

    // Default rate-limit config.
    const { error: rlError } = await supabase.from('health_check_rate_limit_config').insert({
      health_check_id: data.id,
      monthly_limit_per_ip: 5,
      monthly_limit_per_email: 5,
      monthly_limit_per_whatsapp: 5,
      updated_by: currentAdmin.id,
    });

    if (rlError) throw rlError;

    return NextResponse.json({ check: data }, { status: 201 });
  } catch (error) {
    return jsonAdminError(error, 'Failed to create health check');
  }
}
