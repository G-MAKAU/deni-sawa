import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Clock, Calendar, ArrowLeft, ArrowRight } from 'lucide-react';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { BlogContentRenderer } from '@/components/blog/BlogContentRenderer';
import { BlogCoverImage } from '@/components/blog/BlogCoverImage';
import { ClientShareButton } from '@/components/blog/ShareButton';
import { getBlogPosts, getBlogPostBySlug } from '@/lib/supabase/queries';
import { business } from '@/data/content';

interface PageProps {
  params: Promise<{ slug: string }>;
}

function formatPublishedDate(dateValue: string | null) {
  if (!dateValue) return 'Coming soon';
  return new Date(dateValue).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

function formatReadTime(minutes: number | null) {
  return `${minutes ?? 5} min read`;
}

const ABSOLUTE_URL = `https://${business.website}`;

export async function generateStaticParams() {
  try {
    const posts = await getBlogPosts({ limit: 200 });
    return posts.map((post) => ({ slug: post.slug }));
  } catch {
    return [];
  }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = await getBlogPostBySlug(slug).catch(() => null);

  if (!post) {
    return { title: 'Article Not Found' };
  }

  const robots = (() => {
    switch (post.seo_robots) {
      case 'index_follow':
        return { index: true, follow: true };
      case 'index_nofollow':
        return { index: true, follow: false };
      case 'noindex_follow':
        return { index: false, follow: true };
      case 'noindex_nofollow':
        return { index: false, follow: false };
      default:
        return { index: true, follow: true };
    }
  })();

  return {
    title: post.seo_title ?? post.title,
    description: post.seo_description ?? post.excerpt,
    keywords: post.seo_keywords
      ? post.seo_keywords.split(',').map((k) => k.trim()).filter(Boolean)
      : undefined,
    alternates: { canonical: post.canonical_url ?? `${ABSOLUTE_URL}/blog/${post.slug}` },
    robots,
    openGraph: {
      title: post.og_title ?? post.seo_title ?? post.title,
      description: post.og_description ?? post.seo_description ?? post.excerpt ?? undefined,
      url: post.canonical_url ?? `${ABSOLUTE_URL}/blog/${post.slug}`,
      type: 'article',
      images: post.og_image_url ?? post.cover_image_url
        ? [{ url: post.og_image_url ?? post.cover_image_url ?? '' }]
        : undefined,
    },
  };
}

async function getPost(params: { slug: string }) {
  const post = await getBlogPostBySlug(params.slug).catch(() => null);
  return post;
}

export default async function BlogPostPage({ params }: PageProps) {
  const { slug } = await params;
  const post = await getPost({ slug });

  if (!post) {
    notFound();
  }

  const primaryCategorySlug = post.primary_category?.slug ?? null;

  const relatedFromCategory = primaryCategorySlug
    ? await getBlogPosts({ categorySlug: primaryCategorySlug, limit: 6 }).catch(() => [])
    : await getBlogPosts({ limit: 6 }).catch(() => []);

  const relatedPosts = relatedFromCategory
    .filter((relatedPost) => relatedPost.slug !== post.slug)
    .slice(0, 3);

  const author = post.author;
  const category = post.primary_category;

  const canonical = post.canonical_url ?? `${ABSOLUTE_URL}/blog/${post.slug}`;

  return (
    <main>
      {/* Hero */}
      <section className="relative overflow-hidden bg-ink-900 pb-24 pt-8 text-white">
        <div className="absolute inset-0">
          <div className="absolute right-0 top-0 h-[420px] w-[420px] rounded-full bg-[radial-gradient(circle_at_center,rgba(255,116,1,0.14),transparent_72%)]" />
          <div className="absolute bottom-0 left-0 h-[360px] w-[360px] rounded-full bg-[radial-gradient(circle_at_center,rgba(45,157,120,0.16),transparent_72%)]" />
        </div>

        <div className="container-lux relative">
          <div className="mb-6">
            <Breadcrumbs
              items={[
                { label: 'Blog', to: '/blog' },
                { label: post.title },
              ]}
              showHome
            />
          </div>

          <Link
            href="/blog"
            className="mb-8 inline-flex items-center gap-2 text-sm font-medium text-white/60 transition-colors hover:text-brand"
          >
            <ArrowLeft className="h-4 w-4" /> Back to Blog
          </Link>

          <div className="mb-6 flex flex-wrap items-center gap-4">
            <span className="rounded-full bg-brand px-3.5 py-1 text-xs font-bold uppercase tracking-widest text-white">
              {category?.name ?? 'General'}
            </span>
            <span className="flex items-center gap-1.5 text-sm text-white/60">
              <Clock className="h-4 w-4" />
              {formatReadTime(post.reading_minutes)}
            </span>
            <span className="flex items-center gap-1.5 text-sm text-white/60">
              <Calendar className="h-4 w-4" />
              {formatPublishedDate(post.published_at)}
            </span>
          </div>

          <h1 className="mb-5 max-w-4xl font-heading text-3xl font-extrabold leading-tight tracking-tight text-white sm:text-4xl lg:text-5xl">
            {post.title}
          </h1>

          <p className="text-base text-white/60">
            By <span className="font-semibold text-white/90">{author?.full_name ?? 'Deni Sawa Team'}</span>
          </p>
        </div>
      </section>

      {/* Article content */}
      <section className="relative overflow-hidden py-16 lg:py-24">
        <div className="container-lux">
          <div className="mx-auto max-w-3xl">
            <BlogCoverImage
              src={post.cover_image_url}
              alt={post.title}
              className="mb-12 aspect-[16/8] rounded-4xl"
              fallbackTextSize="text-8xl"
              loading="eager"
            />

            <BlogContentRenderer
              html={post.content_html}
              className="rounded-3xl border border-border bg-card p-6 shadow-soft sm:p-8 lg:p-12"
            />

            {/* Share */}
            <div className="mt-12 border-t border-border pt-8">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <span className="text-sm font-medium text-muted-foreground">Share this insight</span>
                <ClientShareButton url={canonical} title={post.title} />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Related posts */}
      <section className="relative overflow-hidden bg-ink-900 py-20">
        <div className="container-lux">
          <div className="mb-10 flex items-end justify-between gap-4">
            <div>
              <span className="eyebrow-dark mb-4">Keep Reading</span>
              <h2 className="font-heading text-3xl font-extrabold text-white">Related Articles</h2>
            </div>
            <Link
              href="/blog"
              className="hidden items-center gap-2 text-sm font-semibold text-brand transition-all duration-300 hover:gap-3 sm:inline-flex"
            >
              View all posts <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          {relatedPosts.length > 0 ? (
            <div className="grid gap-6 md:grid-cols-3">
              {relatedPosts.map((relatedPost) => (
                <Link
                  key={relatedPost.slug}
                  href={`/blog/${relatedPost.slug}`}
                  className="group card-dark flex flex-col"
                >
                  <span className="mb-3 w-fit rounded-full bg-brand/15 px-3 py-1 text-xs font-semibold text-brand">
                    {relatedPost.primary_category ?? 'General'}
                  </span>
                  <h3 className="mb-3 font-heading text-lg font-bold text-white transition-colors duration-300 group-hover:text-brand">
                    {relatedPost.title}
                  </h3>
                  <p className="mb-4 text-sm leading-relaxed text-white/50 line-clamp-3">
                    {relatedPost.excerpt}
                  </p>
                  <span className="mt-auto inline-flex items-center gap-1.5 text-sm font-semibold text-brand transition-all duration-300 group-hover:gap-2.5">
                    Read Article <ArrowRight className="h-4 w-4" />
                  </span>
                </Link>
              ))}
            </div>
          ) : (
            <div className="rounded-4xl border border-white/10 bg-white/5 p-10 text-center text-white/50">
              More related articles are coming soon.
            </div>
          )}
        </div>
      </section>
    </main>
  );
}