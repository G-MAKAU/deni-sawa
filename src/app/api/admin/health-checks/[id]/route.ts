import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { z } from 'zod';
import { requireAdmin, jsonAdminError } from '@/lib/admin-auth';
import { isReservedHealthCheckSlug } from '@/lib/health-check-slugs';

export const dynamic = 'force-dynamic';

const paramsSchema = z.object({ id: z.string().uuid() });

const updateSchema = z.object({
  name: z.string().min(1).max(120).optional(),
  slug: z.string().min(1).max(120).optional(),
  description: z.string().max(1000).nullable().optional(),
  image_url: z.string().max(500).nullable().optional(),
  estimated_minutes: z.number().int().min(1).max(600).nullable().optional(),
  tags: z.array(z.string()).max(20).optional(),
  is_active: z.boolean().optional(),
  sort_order: z.number().int().optional(),
  detailed_price: z.number().min(0).optional(),
  detailed_call_price: z.number().min(0).optional(),
});

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { supabase } = await requireAdmin(_request, 'read');
    const { id } = paramsSchema.parse(await params);

    const { data, error } = await supabase
      .from('health_checks')
      .select('*, sections:health_check_sections(count)')
      .eq('id', id)
      .single();

    if (error) throw error;

    const sections = Array.isArray(data.sections) ? data.sections[0] : data.sections;
    return NextResponse.json({ check: { ...data, section_count: (sections as { count?: number } | undefined)?.count ?? 0 } });
  } catch (error) {
    return jsonAdminError(error, 'Failed to load health check');
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { supabase } = await requireAdmin(request, 'update');
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

    // Reserved public slugs (e.g. /business-health-check) must never change.
    if (parsed.data.slug !== undefined) {
      const { data: existing } = await supabase.from('health_checks').select('slug').eq('id', id).single();
      if (!existing) throw new Error('Health check not found.');
      const currentSlug = existing.slug as string;
      if (parsed.data.slug !== currentSlug && (isReservedHealthCheckSlug(currentSlug) || isReservedHealthCheckSlug(parsed.data.slug))) {
        return NextResponse.json(
          { error: `The slug "${currentSlug}" is reserved for the public site and cannot be changed.` },
          { status: 400 }
        );
      }
    }

    const { data, error } = await supabase.from('health_checks').update(parsed.data).eq('id', id).select().single();
    if (error) throw error;

    return NextResponse.json({ check: data });
  } catch (error) {
    return jsonAdminError(error, 'Failed to update health check');
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { supabase } = await requireAdmin(request, 'delete');
    const { id } = paramsSchema.parse(await params);

    const { data: existing } = await supabase.from('health_checks').select('slug').eq('id', id).single();
    if (existing && isReservedHealthCheckSlug(existing.slug as string)) {
      return NextResponse.json(
        { error: `"${existing.slug}" is reserved for the public site and cannot be deleted.` },
        { status: 400 }
      );
    }

    const { error } = await supabase.from('health_checks').delete().eq('id', id);
    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    return jsonAdminError(error, 'Failed to delete health check');
  }
}
