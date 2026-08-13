import { NextRequest, NextResponse } from 'next/server';
import { requireBlogAdmin, jsonAdminError } from '../../_auth';
import { normalizeBlogHtml } from '@/lib/normalizeBlogHtml';

export async function GET(request: NextRequest) {
  try {
    const { supabase } = await requireBlogAdmin(request, 'read');
    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') ?? '20', 10)));
    const status = searchParams.get('status');
    const search = searchParams.get('search');

    let query = supabase
      .from('blog_posts')
      .select(
        `*,
         author:blog_authors(full_name,slug),
         category:blog_categories(name,slug)`,
        { count: 'exact' }
      )
      .order('updated_at', { ascending: false });

    if (status && status !== 'all') {
      query = query.eq('status', status);
    }

    if (search) {
      query = query.or(`title.ilike.%${search}%,content_markdown.ilike.%${search}%`);
    }

    const from = (page - 1) * limit;
    const { data, error, count } = await query.range(from, from + limit - 1);

    if (error) throw error;

    return NextResponse.json({
      posts: data ?? [],
      pagination: {
        page,
        limit,
        total: count ?? 0,
        pages: Math.ceil((count ?? 0) / limit),
      },
    });
  } catch (error) {
    return jsonAdminError(error, 'Failed to fetch blog posts');
  }
}

export async function POST(request: NextRequest) {
  try {
    const { supabase } = await requireBlogAdmin(request, 'create');
    const body = await request.json();

    const { data, error } = await supabase
      .from('blog_posts')
      .insert({
        title: typeof body.title === 'string' && body.title.trim() ? body.title.trim() : 'Untitled Post',
        slug: typeof body.slug === 'string' ? body.slug.trim() : '',
        excerpt: typeof body.excerpt === 'string' ? body.excerpt.trim() : '',
        content_markdown: typeof body.contentMarkdown === 'string' ? body.contentMarkdown : '',
        content_html: normalizeBlogHtml(body.contentHtml),
        status: body.status ?? 'draft',
        featured: Boolean(body.isFeatured),
        published_at: body.status === 'published' ? new Date().toISOString() : null,
        cover_image_url: typeof body.featuredImageUrl === 'string' ? body.featuredImageUrl || null : null,
        author_id: body.authorId || null,
        primary_category_id: body.categoryId || null,
        reading_minutes: body.readingMinutes || null,
        seo_title: typeof body.seoTitle === 'string' ? body.seoTitle : null,
        seo_description: typeof body.seoDescription === 'string' ? body.seoDescription : null,
        seo_keywords: typeof body.seoKeywords === 'string' ? body.seoKeywords : null,
      })
      .select(
        `*,
         author:blog_authors(full_name,slug),
         category:blog_categories(name,slug)`
      )
      .single();

    if (error) throw error;

    return NextResponse.json({ post: data });
  } catch (error) {
    return jsonAdminError(error, 'Failed to create blog post');
  }
}