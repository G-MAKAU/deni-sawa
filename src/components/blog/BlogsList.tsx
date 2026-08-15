'use client';

import { useMemo, useState } from 'react';
import { Reveal } from '@/components/Reveal';
import { BlogCard, type BlogPostCard } from '@/components/blog/BlogCard';
import { cn } from '@/lib/utils';

interface BlogsListProps {
  blogPosts: BlogPostCard[];
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
  const regular = filtered.filter((p) => !fallbackFeatured.some((f) => f.slug === p.slug));

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
