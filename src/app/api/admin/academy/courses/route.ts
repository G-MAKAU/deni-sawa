import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { z } from 'zod';
import { requireAdmin, jsonAdminError } from '@/lib/admin-auth';

export const dynamic = 'force-dynamic';

const courseSchema = z.object({
  title: z.string().min(1).max(200),
  slug: z.string().min(1).max(200).optional(),
  category: z.string().min(1).max(100),
  format: z.string().min(1).max(100),
  duration: z.string().min(1).max(100),
  level: z.string().min(1).max(100).default('All Levels'),
  description: z.string().max(2000).optional().nullable(),
  image_url: z.string().max(500).nullable().optional(),
  is_featured: z.boolean().optional(),
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
    const { data, error } = await supabase.from('lms_courses').select('*').order('sort_order', { ascending: true });
    if (error) throw error;
    return NextResponse.json({ courses: data ?? [] });
  } catch (error) {
    return jsonAdminError(error, 'Failed to load courses');
  }
}

export async function POST(request: NextRequest) {
  try {
    const { supabase } = await requireAdmin(request, 'create');

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
    }

    const parsed = courseSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Validation failed', details: parsed.error.flatten() }, { status: 422 });
    }

    const { title, slug, category, format, duration, level, description, image_url, is_featured, is_active, sort_order } = parsed.data;

    const { data, error } = await supabase
      .from('lms_courses')
      .insert({
        title,
        slug: slug?.trim() ? makeSlug(slug) : makeSlug(title),
        category,
        format,
        duration,
        level,
        description,
        image_url,
        is_featured: is_featured ?? false,
        is_active: is_active ?? true,
        sort_order: sort_order ?? 0,
      })
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ course: data }, { status: 201 });
  } catch (error) {
    return jsonAdminError(error, 'Failed to create course');
  }
}
