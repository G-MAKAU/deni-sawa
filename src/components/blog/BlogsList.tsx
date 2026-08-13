'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { Clock, ArrowRight } from 'lucide-react';
import { Reveal } from '@/components/Reveal';
import { BlogCoverImage } from '@/components/blog/BlogCoverImage';
import { cn } from '@/lib/utils';

interface Post {
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

interface BlogsListProps {
  blogPosts: Post[];
}

function formatPublishedDate(dateValue?: string | null) {
  if (!dateValue) return '';
  return new Date(dateValue).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

function formatReadTime(minutes?: number | null) {
  return `${minutes ?? 5} min read`;
}

function BlogCard({ post, featured = false }: { post: Post; featured?: boolean }) {
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

          <h2 className="mb-3 font-heading text-xl font-bold leading-snug text-foreground transition-colors duration-300 group-hover:text-brand line-clamp-2">
            {post.title}
          </h2>

          <p className="mb-4 text-sm leading-relaxed text-muted-foreground line-clamp-3">
            {post.excerpt}
          </p>

          <div className="mt-auto flex items-center justify-between border-t border-border pt-4">
            <span className="text-xs text-muted-foreground">
              {formatPublishedDate(post.published_at)}
            </span>
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

export function BlogsList({ blogPosts }: BlogsListProps) {
  const categories = useMemo(
    () => ['All', ...Array.from(new Set(blogPosts.map((p) => p.primary_category ?? 'General')))],
    [blogPosts]
  );

  const [selected, setSelected] = useState('All');

  const filtered = useMemo(() => {
    if (selected === 'All') return blogPosts;
    return blogPosts.filter((p) => (p.primary_category ?? 'General') === selected);
  }, [blogPosts, selected]);

  const featured = filtered.filter((p) => p.featured);
  const fallbackFeatured = featured.length > 0 ? featured : filtered.slice(0, 2);
  const regular = filtered.filter(
    (p) => !fallbackFeatured.some((f) => f.slug === p.slug)
  );

  return (
    <>
      <Reveal>
        <div className="mb-12 flex flex-wrap justify-center gap-2.5">
          {categories.map((category) => {
            const active = selected === category;
            return (
              <button
                key={category}
                type="button"
                onClick={() => setSelected(category)}
                aria-pressed={active}
                className={cn(
                  'rounded-full px-4 py-2 text-sm font-semibold transition-all duration-300',
                  active
                    ? 'bg-brand text-white shadow-brand-sm'
                    : 'border border-border bg-card text-muted-foreground hover:border-brand/40 hover:text-brand'
                )}
              >
                {category}
              </button>
            );
          })}
        </div>
      </Reveal>

      {fallbackFeatured.length > 0 && (
        <div className="mb-14 grid gap-8 lg:grid-cols-2">
          {fallbackFeatured.map((post, i) => (
            <Reveal key={post.slug} direction={i % 2 === 0 ? 'left' : 'right'}>
              <BlogCard post={post} featured />
            </Reveal>
          ))}
        </div>
      )}

      {regular.length > 0 && (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {regular.map((post, index) => (
            <Reveal key={post.slug} delay={(index % 3) * 100}>
              <BlogCard post={post} />
            </Reveal>
          ))}
        </div>
      )}

      {filtered.length === 0 && (
        <Reveal>
          <div className="rounded-4xl border border-border bg-card p-12 text-center text-muted-foreground">
            No posts in this category yet. Please check back soon.
          </div>
        </Reveal>
      )}
    </>
  );
}