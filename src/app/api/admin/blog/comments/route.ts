import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { z } from 'zod';
import { requireAdmin, jsonAdminError } from '@/lib/admin-auth';

export const dynamic = 'force-dynamic';

const STATUSES = ['pending', 'approved', 'rejected'] as const;

function normalizeComment(row: Record<string, unknown>) {
  const post = row.blog_post as { title?: string; slug?: string } | null | undefined;
  return {
    id: String(row.id),
    parent_id: row.parent_id ? String(row.parent_id) : null,
    post_id: row.blog_post_id ? String(row.blog_post_id) : null,
    post_title: post?.title ?? 'Untitled post',
    post_slug: post?.slug ?? null,
    author_name: String(row.author_name ?? ''),
    author_email: String(row.author_email ?? ''),
    author_website: row.author_website ? String(row.author_website) : null,
    content: String(row.content ?? ''),
    status: String(row.status ?? 'pending'),
    created_at: String(row.created_at ?? ''),
    ai_moderated: Boolean(row.ai_moderated),
    moderation_verdict: row.moderation_verdict ? String(row.moderation_verdict) : null,
    moderation_reasons: Array.isArray(row.moderation_reasons)
      ? (row.moderation_reasons as unknown[]).map(String)
      : [],
    moderation_model: row.moderation_model ? String(row.moderation_model) : null,
  };
}

export async function GET(request: NextRequest) {
  try {
    const { supabase } = await requireAdmin(request, 'read');
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const rawLimit = Number(searchParams.get('limit'));
    const limit = Number.isFinite(rawLimit) ? Math.min(Math.max(rawLimit, 1), 200) : 50;

    const listQuery = supabase
      .from('blog_comments')
      .select(
        'id,parent_id,blog_post_id,author_name,author_email,author_website,content,status,created_at,ai_moderated,moderation_verdict,moderation_reasons,moderation_model,blog_post:blog_posts!blog_comments_blog_post_id_fkey(title,slug)'
      )
      .order('created_at', { ascending: false })
      .limit(limit);

    const filteredQuery = status && STATUSES.includes(status as (typeof STATUSES)[number]) ? listQuery.eq('status', status) : listQuery;

    const count = (target: string) =>
      supabase.from('blog_comments').select('id', { count: 'exact', head: true }).eq('status', target);

    const [listResult, pendingResult, approvedResult, rejectedResult] = await Promise.all([
      filteredQuery,
      count('pending'),
      count('approved'),
      count('rejected'),
    ]);

    if (listResult.error) throw listResult.error;
    if (pendingResult.error) throw pendingResult.error;
    if (approvedResult.error) throw approvedResult.error;
    if (rejectedResult.error) throw rejectedResult.error;

    const pending = pendingResult.count ?? 0;
    const approved = approvedResult.count ?? 0;
    const rejected = rejectedResult.count ?? 0;

    return NextResponse.json({
      comments: (listResult.data ?? []).map(normalizeComment),
      counts: { pending, approved, rejected, total: pending + approved + rejected },
    });
  } catch (error) {
    return jsonAdminError(error, 'Failed to load comments');
  }
}

const statusUpdateSchema = z.object({
  id: z.string().min(1),
  status: z.enum(STATUSES),
});

export async function PATCH(request: NextRequest) {
  try {
    const { supabase } = await requireAdmin(request, 'update');

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
    }

    const parsed = statusUpdateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Validation failed', details: parsed.error.flatten() }, { status: 422 });
    }

    const { data, error } = await supabase
      .from('blog_comments')
      .update({ status: parsed.data.status })
      .eq('id', parsed.data.id)
      .select(
        'id,parent_id,blog_post_id,author_name,author_email,author_website,content,status,created_at,ai_moderated,moderation_verdict,moderation_reasons,moderation_model,blog_post:blog_posts!blog_comments_blog_post_id_fkey(title,slug)'
      )
      .single();

    if (error) throw error;
    return NextResponse.json({ comment: normalizeComment(data as unknown as Record<string, unknown>) });
  } catch (error) {
    return jsonAdminError(error, 'Failed to update comment');
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { supabase } = await requireAdmin(request, 'delete');
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'Missing comment id' }, { status: 400 });

    const { error } = await supabase.from('blog_comments').delete().eq('id', id);
    if (error) throw error;
    return NextResponse.json({ ok: true });
  } catch (error) {
    return jsonAdminError(error, 'Failed to delete comment');
  }
}
