import { unstable_cache } from 'next/cache';
import { getSupabaseClient } from './client';

export function cacheFunction<Args extends unknown[], Result>(
  keyPrefix: string,
  handler: (...args: Args) => Promise<Result>,
  options?: {
    revalidate?: number;
    tags?: string[];
  }
) {
  return unstable_cache(handler, [keyPrefix], {
    revalidate: options?.revalidate ?? 300,
    tags: options?.tags,
  });
}

export interface BlogPostSummary {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  reading_minutes: number | null;
  cover_image_url: string | null;
  featured: boolean;
  published_at: string | null;
  seo_title: string;
  seo_description: string | null;
  canonical_url: string | null;
  og_title: string | null;
  og_description: string | null;
  og_image_url: string | null;
  primary_category: string | null;
  primary_category_slug: string | null;
  author_name: string | null;
  author_slug: string | null;
}

export interface BlogPostDetail {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  content_markdown: string;
  content_html: string | null;
  reading_minutes: number | null;
  published_at: string | null;
  featured: boolean;
  cover_image_url: string | null;
  seo_title: string;
  seo_description: string | null;
  seo_keywords: string | null;
  canonical_url: string | null;
  seo_robots: 'index_follow' | 'index_nofollow' | 'noindex_follow' | 'noindex_nofollow';
  og_title: string | null;
  og_description: string | null;
  og_image_url: string | null;
  twitter_card: 'summary' | 'summary_large_image' | null;
  schema_json: Record<string, unknown>;
  author: { full_name: string | null; slug: string | null } | null;
  primary_category: { name: string | null; slug: string | null } | null;
}

export interface LmsCourse {
  id: string;
  title: string;
  slug: string;
  category: string;
  format: string;
  duration: string;
  level: string;
  description: string | null;
  is_featured: boolean;
}

async function fetchBlogPosts(options?: {
  categorySlug?: string;
  featuredOnly?: boolean;
  limit?: number;
  offset?: number;
}) {
  const supabase = getSupabaseClient();
  const limit = options?.limit ?? 12;
  const offset = options?.offset ?? 0;

  let query = supabase
    .from('v_public_blog_posts')
    .select('*')
    .order('published_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (options?.categorySlug) {
    query = query.eq('primary_category_slug', options.categorySlug);
  }

  if (options?.featuredOnly) {
    query = query.eq('featured', true);
  }

  const { data, error } = await query;

  if (error) {
    // Graceful degradation — if the schema/migration isn't applied yet, render
    // the page with an empty state instead of failing the build.
    console.warn('getBlogPosts: supabase query failed:', error.message);
    return [] as BlogPostSummary[];
  }

  return (data ?? []) as BlogPostSummary[];
}

export const getBlogPosts = cacheFunction('blog-posts', fetchBlogPosts, {
  revalidate: 300,
  tags: ['blog'],
});

async function fetchBlogPostBySlug(slug: string) {
  const supabase = getSupabaseClient();

  const { data, error } = await supabase
    .from('blog_posts')
    .select(
      'id,slug,title,excerpt,content_markdown,content_html,reading_minutes,published_at,featured,cover_image_url,seo_title,seo_description,seo_keywords,canonical_url,seo_robots,og_title,og_description,og_image_url,twitter_card,schema_json,author:blog_authors(full_name,slug),primary_category:blog_categories(name,slug)'
    )
    .eq('slug', slug)
    .eq('status', 'published')
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to fetch blog post: ${error.message}`);
  }

  return (data ?? null) as BlogPostDetail | null;
}

export const getBlogPostBySlug = cacheFunction('blog-post-by-slug', fetchBlogPostBySlug, {
  revalidate: 300,
  tags: ['blog'],
});

async function fetchBlogCategories() {
  const supabase = getSupabaseClient();

  const { data, error } = await supabase
    .from('blog_categories')
    .select('id,name,slug,description')
    .eq('is_active', true)
    .order('name');

  if (error) {
    throw new Error(`Failed to fetch blog categories: ${error.message}`);
  }

  return (data ?? []) as { id: string; name: string; slug: string; description: string | null }[];
}

export const getBlogCategories = cacheFunction('blog-categories', fetchBlogCategories, {
  revalidate: 600,
  tags: ['blog'],
});

async function fetchLmsCourses() {
  const supabase = getSupabaseClient();

  const { data, error } = await supabase
    .from('lms_courses')
    .select('id,title,slug,category,format,duration,level,description,is_featured')
    .eq('is_active', true)
    .order('sort_order');

  if (error) {
    throw new Error(`Failed to fetch courses: ${error.message}`);
  }

  return (data ?? []) as LmsCourse[];
}

export const getLmsCourses = cacheFunction('lms-courses', fetchLmsCourses, {
  revalidate: 600,
  tags: ['academy'],
});

export interface BlogCommentSummary {
  id: string;
  post_slug: string;
  post_title: string;
  author_name: string;
  content: string;
  created_at: string;
}

async function fetchRecentBlogComments(limit = 5) {
  const supabase = getSupabaseClient();

  const { data, error } = await supabase
    .from('blog_comments')
    .select(
      'id,author_name,content,created_at,blog_post:blog_posts!blog_comments_blog_post_id_fkey(slug,title)'
    )
    .eq('status', 'approved')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.warn('getRecentBlogComments: supabase query failed:', error.message);
    return [] as BlogCommentSummary[];
  }

  return (data ?? []).map((comment) => {
    const post = (comment as unknown as { blog_post: { slug: string; title: string } | null }).blog_post;
    return {
      id: String(comment.id),
      post_slug: post?.slug ?? '',
      post_title: post?.title ?? 'Blog post',
      author_name: String(comment.author_name),
      content: String(comment.content),
      created_at: String(comment.created_at),
    };
  });
}

export const getRecentBlogComments = cacheFunction('recent-blog-comments', fetchRecentBlogComments, {
  revalidate: 300,
  tags: ['blog'],
});
