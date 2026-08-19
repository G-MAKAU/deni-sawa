import { NextRequest, NextResponse } from 'next/server';
import { requireBlogAdmin, jsonAdminError } from '../../../_auth';
import { normalizeBlogHtml } from '@/lib/normalizeBlogHtml';
import { lexicalStateToHtml } from '@/lib/lexical-state-to-html';

/** Canonical HTML: regenerate from the stored Lexical state with Lexical's own
 *  serializer (lossless — tables, images, custom nodes), sanitized for storage. */
function resolveContentHtml(body: Record<string, unknown>): string | null {
  if (body.contentLexical && typeof body.contentLexical === 'object') {
    try {
      return normalizeBlogHtml(lexicalStateToHtml(body.contentLexical as Record<string, unknown>));
    } catch (error) {
      console.error('lexicalStateToHtml failed (falling back to client HTML):', error);
    }
  }
  return normalizeBlogHtml(typeof body.contentHtml === 'string' ? body.contentHtml : '');
}

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
        content_html: resolveContentHtml(body) ?? undefined,
        content_lexical: body.contentLexical && typeof body.contentLexical === 'object' ? body.contentLexical : undefined,
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
         author:author_id(full_name,slug),
         category:primary_category_id(name,slug)`
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