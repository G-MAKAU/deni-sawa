import { NextResponse } from 'next/server';
import { requireBlogAdmin, jsonAdminError } from '../../_auth';

export async function GET(request: Request) {
  try {
    const { supabase } = await requireBlogAdmin(request as Parameters<typeof requireBlogAdmin>[0], 'read');

    const { data, error } = await supabase
      .from('blog_categories')
      .select('id, name, slug, description')
      .eq('is_active', true)
      .order('name');

    if (error) throw error;

    return NextResponse.json({ categories: data ?? [] });
  } catch (error) {
    return jsonAdminError(error, 'Failed to fetch blog categories');
  }
}