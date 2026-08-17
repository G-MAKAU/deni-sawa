import { NextResponse } from 'next/server';
import { getSupabaseClient } from '@/lib/supabase/client';

interface PublicComment {
  id: string;
  parent_id: string | null;
  author_name: string;
  author_website: string | null;
  content: string;
  created_at: string;
}

async function resolvePostId(supabase: ReturnType<typeof getSupabaseClient>, slug: string) {
  const { data, error } = await supabase
    .from('blog_posts')
    .select('id')
    .eq('slug', slug)
    .eq('status', 'published')
    .maybeSingle();

  if (error || !data) return null;
  return data.id;
}

function sanitizeName(raw: string) {
  return raw.replace(/[<>&"]/g, '').trim().slice(0, 120);
}

function sanitizeComment(raw: string) {
  return raw.replace(/<[^>]*>/g, '').trim().slice(0, 2000);
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const slug = searchParams.get('slug');
  const postId = searchParams.get('postId');

  const supabase = getSupabaseClient();

  try {
    let commentsQuery = supabase
      .from('blog_comments')
      .select('id,parent_id,author_name,author_website,content,created_at')
      .eq('status', 'approved')
      .order('created_at', { ascending: false });

    if (slug) {
      const id = await resolvePostId(supabase, slug);
      if (!id) {
        return NextResponse.json({ comments: [] });
      }
      commentsQuery = commentsQuery.eq('blog_post_id', id);
    } else if (postId) {
      commentsQuery = commentsQuery.eq('blog_post_id', postId);
    }

    const { data, error } = await commentsQuery.limit(50);

    if (error) {
      return NextResponse.json({ error: 'Failed to load comments' }, { status: 500 });
    }

    const comments: PublicComment[] = (data ?? []).map((comment) => ({
      id: String(comment.id),
      parent_id: comment.parent_id ? String(comment.parent_id) : null,
      author_name: String(comment.author_name),
      author_website: comment.author_website ? String(comment.author_website) : null,
      content: String(comment.content),
      created_at: String(comment.created_at),
    }));

    return NextResponse.json({ comments });
  } catch {
    return NextResponse.json({ error: 'Failed to load comments' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const supabase = getSupabaseClient();

  try {
    const body = await request.json().catch(() => null);
    if (!body) {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
    }

    const slug = typeof body.slug === 'string' ? body.slug.trim() : '';
    const name = sanitizeName(typeof body.name === 'string' ? body.name : '');
    const email = typeof body.email === 'string' ? body.email.trim().slice(0, 254) : '';
    const website = typeof body.website === 'string' ? body.website.trim().slice(0, 254) : '';
    const comment = sanitizeComment(typeof body.content === 'string' ? body.content : '');

    if (!slug || !name || !email || !comment) {
      return NextResponse.json({ error: 'Please fill in your name, email and comment.' }, { status: 400 });
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: 'Please enter a valid email address.' }, { status: 400 });
    }

    const postId = await resolvePostId(supabase, slug);
    if (!postId) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    const { error } = await supabase
      .from('blog_comments')
      .insert({
        blog_post_id: postId,
        author_name: name,
        author_email: email,
        author_website: website || null,
        content: comment,
        status: 'pending',
      });

    if (error) {
      return NextResponse.json({ error: 'Failed to submit comment' }, { status: 500 });
    }

    return NextResponse.json(
      {
        comment: {
          id: crypto.randomUUID(),
          author_name: name,
          created_at: new Date().toISOString(),
        },
        message: `Thank you, ${name}. Your comment has been submitted and is awaiting moderation.`,
      },
      { status: 201 }
    );
  } catch {
    return NextResponse.json({ error: 'Failed to submit comment' }, { status: 500 });
  }
}