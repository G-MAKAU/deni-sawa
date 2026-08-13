import { NextRequest, NextResponse } from 'next/server';
import { requireBlogAdmin, jsonAdminError } from '../../../_auth';
import { normalizeBlogHtml } from '@/lib/normalizeBlogHtml';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { supabase } = await requireBlogAdmin(request, 'update');
    const body = await request.json();

    const { data, error } = await supabase
      .from('blog_posts')
      .update({
        title: typeof body.title === 'string' && body.title.trim() ? body.title.trim() : undefined,
        slug: typeof body.slug === 'string' ? body.slug.trim() : undefined,
        excerpt: typeof body.excerpt === 'string' ? body.excerpt.trim() : undefined,
        content_markdown: typeof body.contentMarkdown === 'string' ? body.contentMarkdown : undefined,
        content_html: normalizeBlogHtml(body.contentHtml) ?? undefined,
        status: body.status,
        featured: Boolean(body.isFeatured),
        published_at:
          body.status === 'published' && !body.publishedAt
            ? new Date().toISOString()
            : body.publishedAt ?? undefined,
        cover_image_url: typeof body.featuredImageUrl === 'string' ? body.featuredImageUrl || null : undefined,
        author_id: body.authorId ?? undefined,
        primary_category_id: body.categoryId ?? undefined,
        reading_minutes: body.readingMinutes ?? undefined,
        seo_title: typeof body.seoTitle === 'string' ? body.seoTitle : undefined,
        seo_description: typeof body.seoDescription === 'string' ? body.seoDescription : undefined,
        seo_keywords: typeof body.seoKeywords === 'string' ? body.seoKeywords : undefined,
      })
      .eq('id', id)
      .select(
        `*,
         author:blog_authors(full_name,slug),
         category:blog_categories(name,slug)`
      )
      .single();

    if (error) throw error;

    return NextResponse.json({ post: data });
  } catch (error) {
    return jsonAdminError(error, 'Failed to update blog post');
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { supabase } = await requireBlogAdmin(request, 'delete');

    const { error } = await supabase.from('blog_posts').delete().eq('id', id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    return jsonAdminError(error, 'Failed to delete blog post');
  }
}