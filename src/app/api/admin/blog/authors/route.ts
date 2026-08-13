import { NextResponse } from 'next/server';
import { requireBlogAdmin, jsonAdminError } from '../../_auth';

export async function GET(request: Request) {
  try {
    const { supabase } = await requireBlogAdmin(request as Parameters<typeof requireBlogAdmin>[0], 'read');

    const { data, error } = await supabase
      .from('blog_authors')
      .select('id, full_name, slug, bio, avatar_url, is_active')
      .eq('is_active', true)
      .order('full_name');

    if (error) throw error;

    return NextResponse.json({ authors: data ?? [] });
  } catch (error) {
    return jsonAdminError(error, 'Failed to fetch blog authors');
  }
}