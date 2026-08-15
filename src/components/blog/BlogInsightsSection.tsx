import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { BlogCard, type BlogPostCard } from '@/components/blog/BlogCard';
import { SectionHeading } from '@/components/SectionHeading';
import { Reveal } from '@/components/Reveal';
import { cn } from '@/lib/utils';

interface BlogInsightsSectionProps {
  eyebrow: string;
  title: string;
  subtitle?: string;
  posts: BlogPostCard[];
  viewAllHref?: string;
  viewAllLabel?: string;
  tone?: 'light' | 'alt';
}

/**
 * Reusable "Blog Insights" section — renders the given posts as cards with an
 * optional "view all" link. Renders nothing when there are no posts so pages
 * degrade gracefully before any posts are published.
 */
export function BlogInsightsSection({
  eyebrow,
  title,
  subtitle,
  posts,
  viewAllHref,
  viewAllLabel = 'View all insights',
  tone = 'light',
}: BlogInsightsSectionProps) {
  if (!posts || posts.length === 0) return null;

  return (
    <section className={cn('section-pad', tone === 'alt' ? 'bg-bgalt' : 'bg-background')}>
      <div className="container-lux">
        <SectionHeading eyebrow={eyebrow} title={title} subtitle={subtitle} />

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {posts.map((post, i) => (
            <Reveal key={post.slug} delay={(i % 3) * 80} className="h-full">
              <BlogCard post={post} featured={Boolean(post.featured)} />
            </Reveal>
          ))}
        </div>

        {viewAllHref && (
          <Reveal className="mt-12 text-center">
            <Link
              href={viewAllHref}
              className="group inline-flex items-center gap-2 text-sm font-semibold text-brand transition-colors hover:text-brand-600"
            >
              {viewAllLabel}
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </Reveal>
        )}
      </div>
    </section>
  );
}
