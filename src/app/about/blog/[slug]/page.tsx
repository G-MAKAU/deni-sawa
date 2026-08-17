import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Suspense } from 'react';
import { Clock, Calendar, ArrowLeft, ArrowRight } from 'lucide-react';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { BlogContentRenderer } from '@/components/blog/BlogContentRenderer';
import { BlogCoverImage } from '@/components/blog/BlogCoverImage';
import { BlogComments } from '@/components/blog/BlogComments';
import { BlogSidebar } from '@/components/blog/BlogSidebar';
import { ShareMenu } from '@/components/ShareMenu';
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

  const canonical = post.canonical_url ?? `${ABSOLUTE_URL}/about/blog/${post.slug}`;
  const ogImage = post.og_image_url ?? post.cover_image_url;
  const articleTitle = post.og_title ?? post.seo_title ?? post.title;
  const articleDescription = post.og_description ?? post.seo_description ?? post.excerpt ?? undefined;
  const authorName = post.author?.full_name ?? undefined;

  return {
    metadataBase: new URL(ABSOLUTE_URL),
    title: post.seo_title ?? post.title,
    description: post.seo_description ?? post.excerpt,
    keywords: post.seo_keywords
      ? post.seo_keywords.split(',').map((k) => k.trim()).filter(Boolean)
      : undefined,
    alternates: { canonical },
    robots,
    openGraph: {
      title: articleTitle,
      description: articleDescription,
      url: canonical,
      type: 'article',
      siteName: 'Deni Sawa',
      publishedTime: post.published_at ?? undefined,
      modifiedTime: undefined,
      authors: authorName ? [authorName] : undefined,
      section: post.primary_category?.name ?? undefined,
      images: ogImage ? [{ url: ogImage, width: 1200, height: 630, alt: post.title }] : undefined,
    },
    twitter: {
      card: post.twitter_card ?? 'summary_large_image',
      title: articleTitle,
      description: articleDescription,
      images: ogImage ? [ogImage] : undefined,
    },
  };
}

async function getPost(params: { slug: string }) {
  const post = await getBlogPostBySlug(params.slug).catch(() => null);
  return post;
}

function ArticleSkeleton() {
  return (
    <div className="animate-pulse rounded-3xl border border-border bg-card p-6 shadow-soft sm:p-8 lg:p-12">
      <div className="mb-12 aspect-[16/8] rounded-4xl bg-muted/50" />
      <div className="space-y-4">
        <div className="h-4 w-3/4 rounded bg-muted/60" />
        <div className="h-4 w-full rounded bg-muted/50" />
        <div className="h-4 w-5/6 rounded bg-muted/50" />
        <div className="h-4 w-2/3 rounded bg-muted/50" />
      </div>
    </div>
  );
}

/** Streams the article body (cover + content) once the post loads. */
async function ArticleBody({ slug }: { slug: string }) {
  const post = await getPost({ slug });
  if (!post) return null;

  const canonical = post.canonical_url ?? `${ABSOLUTE_URL}/about/blog/${post.slug}`;

  const articleSchema = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.seo_title ?? post.title,
    description: post.seo_description ?? post.excerpt ?? undefined,
    image: post.og_image_url ?? post.cover_image_url ?? undefined,
    datePublished: post.published_at ?? undefined,
    dateModified: post.published_at ?? undefined,
    url: canonical,
    mainEntityOfPage: canonical,
    author: post.author?.full_name
      ? {
          '@type': 'Person',
          name: post.author.full_name,
          url: post.author.slug ? `${ABSOLUTE_URL}/about/blog?author=${post.author.slug}` : undefined,
        }
      : { '@type': 'Organization', name: 'Deni Sawa' },
    publisher: { '@type': 'Organization', name: 'Deni Sawa' },
    keywords: post.seo_keywords ?? undefined,
    articleSection: post.primary_category?.name ?? undefined,
    ...(post.schema_json && Object.keys(post.schema_json).length > 0 ? { ...post.schema_json } : {}),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }}
      />
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

      <div className="mt-12 border-t border-border pt-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <span className="text-sm font-medium text-muted-foreground">Share this insight</span>
          <ShareMenu url={canonical} title={post.title} text={post.excerpt ?? post.title} variant="pill" />
        </div>
      </div>

      <BlogComments slug={post.slug} />
    </>
  );
}

function RelatedSkeleton() {
  return (
    <div className="grid gap-6 md:grid-cols-3">
      {[0, 1, 2].map((i) => (
        <div key={i} className="h-48 animate-pulse rounded-4xl bg-white/5" />
      ))}
    </div>
  );
}

function SidebarSkeleton() {
  return (
    <div className="space-y-8">
      {[0, 1].map((i) => (
        <div key={i} className="animate-pulse rounded-3xl border border-border bg-card">
          <div className="h-16 border-b border-border px-6 py-5">
            <div className="h-4 w-28 rounded bg-muted/60" />
            <div className="mt-2 h-3 w-40 rounded bg-muted/40" />
          </div>
          <div className="space-y-4 px-6 py-5">
            {[0, 1, 2].map((j) => (
              <div key={j} className="flex items-center gap-4">
                <div className="h-14 w-16 rounded-xl bg-muted/40" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 w-full rounded bg-muted/50" />
                  <div className="h-3 w-2/3 rounded bg-muted/40" />
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

/** Streams the related posts once fetched. */
async function RelatedPosts({ slug, categorySlug }: { slug: string; categorySlug: string | null }) {
  const relatedFromCategory = categorySlug
    ? await getBlogPosts({ categorySlug, limit: 6 }).catch(() => [])
    : await getBlogPosts({ limit: 6 }).catch(() => []);

  const relatedPosts = relatedFromCategory.filter((relatedPost) => relatedPost.slug !== slug).slice(0, 3);

  return (
    <div className="grid gap-6 md:grid-cols-3">
      {relatedPosts.map((relatedPost) => (
        <Link
          key={relatedPost.slug}
          href={`/about/blog/${relatedPost.slug}`}
          className="group card-dark flex flex-col"
        >
          <span className="mb-3 w-fit rounded-full bg-brand/15 px-3 py-1 text-xs font-semibold text-brand">
            {relatedPost.primary_category ?? 'General'}
          </span>
          <h3 className="mb-3 font-heading text-lg font-bold text-white transition-colors duration-300 group-hover:text-brand">
            {relatedPost.title}
          </h3>
          <p className="mb-4 text-sm leading-relaxed text-white/50 line-clamp-3">{relatedPost.excerpt}</p>
          <span className="mt-auto inline-flex items-center gap-1.5 text-sm font-semibold text-brand transition-all duration-300 group-hover:gap-2.5">
            Read Article <ArrowRight className="h-4 w-4" />
          </span>
        </Link>
      ))}
    </div>
  );
}

export default async function BlogPostPage({ params }: PageProps) {
  const { slug } = await params;
  const post = await getPost({ slug });

  if (!post) {
    notFound();
  }

  const primaryCategorySlug = post.primary_category?.slug ?? null;

  const author = post.author;
  const category = post.primary_category;

  return (
    <main>
      {/* Hero */}
      <section className="hero-pattern relative overflow-hidden bg-charcoal pb-24 pt-8 text-white">
        <div className="absolute inset-0">
          <div className="absolute right-0 top-0 h-[420px] w-[420px] rounded-full bg-[radial-gradient(circle_at_center,rgba(255,116,1,0.14),transparent_72%)]" />
          <div className="absolute bottom-0 left-0 h-[360px] w-[360px] rounded-full bg-[radial-gradient(circle_at_center,rgba(45,157,120,0.16),transparent_72%)]" />
        </div>

        <div className="container-lux relative">
          <div className="mb-6">
            <Breadcrumbs
              items={[
                { label: 'About', to: '/about' }, { label: 'Blog', to: '/about/blog' },
                { label: post.title },
              ]}
              showHome
              onDark
            />
          </div>

          <Link
            href="/about/blog"
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

      {/* Article content + sidebar — streamed with Suspense */}
      <section className="relative overflow-hidden py-16 lg:py-24">
        <div className="container-lux">
          <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_360px] lg:gap-14">
            <div className="min-w-0">
              <Suspense fallback={<ArticleSkeleton />}>
                <ArticleBody slug={slug} />
              </Suspense>
            </div>

            <aside className="min-w-0">
              <div className="lg:sticky lg:top-28">
                <Suspense fallback={<SidebarSkeleton />}>
                  <BlogSidebar currentSlug={slug} />
                </Suspense>
              </div>
            </aside>
          </div>
        </div>
      </section>

      {/* Related posts */}
      <section className="relative overflow-hidden bg-ink-900 py-8">
        <div className="container-lux">
          <div className="mb-10 flex items-end justify-between gap-4">
            <div>
              <span className="text-growth font-bold italic mb-4">Keep Reading</span>
              <h2 className="font-heading text-3xl font-extrabold text-white">Related Articles</h2>
            </div>
            <Link
              href="/about/blog"
              className="hidden items-center gap-2 text-sm font-semibold text-brand transition-all duration-300 hover:gap-3 sm:inline-flex"
            >
              View all posts <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <Suspense fallback={<RelatedSkeleton />}>
            <RelatedPosts slug={slug} categorySlug={primaryCategorySlug} />
          </Suspense>
        </div>
      </section>
    </main>
  );
}