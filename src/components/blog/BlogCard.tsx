'use client';

import Link from 'next/link';
import { Clock, ArrowRight } from 'lucide-react';
import { BlogCoverImage } from '@/components/blog/BlogCoverImage';

export interface BlogPostCard {
  slug: string;
  title: string;
  excerpt?: string | null;
  cover_image_url?: string | null;
  featured?: boolean;
  primary_category?: string | null;
  primary_category_slug?: string | null;
  reading_minutes?: number | null;
  published_at?: string | null;
}

export function formatPublishedDate(value?: string | null) {
  if (!value) return '';
  return new Date(value).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

export function formatReadTime(minutes?: number | null) {
  return `${minutes ?? 5} min read`;
}

export function BlogCard({ post, featured = false }: { post: BlogPostCard; featured?: boolean }) {
  return (
    <Link href={`/blog/${post.slug}`} className="group block h-full">
      <article className="card-elevated flex h-full flex-col overflow-hidden !p-0">
        <BlogCoverImage
          src={post.cover_image_url}
          alt={post.title}
          className="aspect-video"
          fallbackTextSize={featured ? 'text-6xl' : 'text-4xl'}
          overlay={
            featured ? (
              <span className="absolute left-4 top-4 rounded-full bg-brand px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-white shadow-brand-sm">
                Featured
              </span>
            ) : undefined
          }
        />
        <div className="flex flex-1 flex-col p-6">
          <div className="mb-3 flex items-center gap-3">
            <span className="rounded-full bg-brand/10 px-3 py-1 text-xs font-semibold text-brand">
              {post.primary_category ?? 'General'}
            </span>
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <Clock className="h-3 w-3" />
              {formatReadTime(post.reading_minutes)}
            </span>
          </div>

          <h2 className="mb-3 line-clamp-2 font-heading text-xl font-bold leading-snug text-foreground transition-colors duration-300 group-hover:text-brand">
            {post.title}
          </h2>

          <p className="mb-4 line-clamp-3 text-sm leading-relaxed text-muted-foreground">{post.excerpt}</p>

          <div className="mt-auto flex items-center justify-between border-t border-border pt-4">
            <span className="text-xs text-muted-foreground">{formatPublishedDate(post.published_at)}</span>
            <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand transition-all duration-300 group-hover:gap-2.5">
              Read Article
              <ArrowRight className="h-4 w-4" />
            </span>
          </div>
        </div>
      </article>
    </Link>
  );
}
