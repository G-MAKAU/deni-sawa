'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { Clock, ArrowRight, Sparkles } from 'lucide-react';
import { Reveal } from '@/components/Reveal';
import { BlogCard, type BlogPostCard } from '@/components/blog/BlogCard';
import { BlogCoverImage } from '@/components/blog/BlogCoverImage';
import { cn } from '@/lib/utils';

interface BlogsListProps {
  blogPosts: BlogPostCard[];
}

function formatDate(value?: string | null) {
  if (!value) return '';
  return new Date(value).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

/** Large editorial spotlight for the featured post. */
function FeaturedSpotlight({ post }: { post: BlogPostCard }) {
  return (
    <Link
      href={`/about/blog/${post.slug}`}
      className="group relative block overflow-hidden rounded-4xl border border-border bg-card shadow-soft transition-shadow duration-300 hover:shadow-card"
    >
      <div className="grid lg:grid-cols-2">
        <div className="relative min-h-[260px] lg:min-h-[380px]">
          <BlogCoverImage
            src={post.cover_image_url}
            alt={post.title}
            className="absolute inset-0"
            fallbackTextSize="text-6xl"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-ink-950/50 via-transparent to-transparent lg:bg-gradient-to-r" />
        </div>
        <div className="flex flex-col justify-center p-8 lg:p-12">
          <div className="mb-4 flex flex-wrap items-center gap-3">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-brand px-3.5 py-1.5 text-[11px] font-bold uppercase tracking-widest text-white shadow-brand-sm">
              <Sparkles className="h-3 w-3" /> Featured
            </span>
            <span className="rounded-full bg-brand/10 px-3.5 py-1.5 text-xs font-semibold text-brand">
              {post.primary_category ?? 'General'}
            </span>
          </div>

          <h3 className="mb-4 font-heading text-2xl font-extrabold leading-tight text-foreground transition-colors duration-300 group-hover:text-brand lg:text-3xl">
            {post.title}
          </h3>

          <p className="mb-6 line-clamp-3 text-[15px] leading-relaxed text-muted-foreground">
            {post.excerpt}
          </p>

          <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5 text-brand" />
              {post.reading_minutes ?? 5} min read
            </span>
            <span className="h-1 w-1 rounded-full bg-muted-foreground/40" />
            <span>{formatDate(post.published_at)}</span>
          </div>

          <span className="mt-7 inline-flex w-fit items-center gap-2 text-sm font-semibold text-brand transition-all duration-300 group-hover:gap-3">
            Read Article <ArrowRight className="h-4 w-4" />
          </span>
        </div>
      </div>
    </Link>
  );
}

export function BlogsList({ blogPosts }: BlogsListProps) {
  const categories = useMemo(() => {
    const counts = new Map<string, number>();
    blogPosts.forEach((p) => {
      const c = p.primary_category ?? 'General';
      counts.set(c, (counts.get(c) ?? 0) + 1);
    });
    return [
      { label: 'All', count: blogPosts.length },
      ...[...counts.entries()].map(([label, count]) => ({ label, count })),
    ];
  }, [blogPosts]);

  const [selected, setSelected] = useState('All');

  const filtered = useMemo(() => {
    if (selected === 'All') return blogPosts;
    return blogPosts.filter((p) => (p.primary_category ?? 'General') === selected);
  }, [blogPosts, selected]);

  const featuredPost = filtered.find((p) => p.featured) ?? filtered[0] ?? null;
  const regular = featuredPost ? filtered.filter((p) => p.slug !== featuredPost.slug) : filtered;

  return (
    <>
      {/* Category filter with counts */}
      <Reveal>
        <div className="mb-14 grid grid-cols-2 gap-2.5 sm:flex sm:flex-wrap sm:justify-center">
          {categories.map((category) => {
            const active = selected === category.label;
            return (
              <button
                key={category.label}
                type="button"
                onClick={() => setSelected(category.label)}
                aria-pressed={active}
                className={cn(
                  'group inline-flex items-center justify-center gap-2 rounded-full px-4 py-2.5 text-sm font-semibold transition-all duration-300 sm:justify-start',
                  active
                    ? 'bg-brand text-white shadow-brand-sm'
                    : 'border border-border bg-card text-muted-foreground hover:border-brand/40 hover:text-brand'
                )}
              >
                {category.label}
                <span
                  className={cn(
                    'rounded-full px-2 py-0.5 text-[11px] font-bold leading-none transition-colors',
                    active ? 'bg-white/20 text-white' : 'bg-muted/70 text-muted-foreground group-hover:bg-brand/10 group-hover:text-brand'
                  )}
                >
                  {category.count}
                </span>
              </button>
            );
          })}
        </div>
      </Reveal>

      {/* Featured spotlight */}
      {featuredPost && (
        <Reveal className="mb-14">
          <FeaturedSpotlight post={featuredPost} />
        </Reveal>
      )}

      {/* Article grid */}
      {regular.length > 0 && (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {regular.map((post, index) => (
            <Reveal key={post.slug} delay={(index % 3) * 80} className="h-full">
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