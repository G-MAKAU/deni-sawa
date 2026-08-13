import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { BlogsList } from '@/components/blog/BlogsList';
import { getBlogPosts } from '@/lib/supabase/queries';
import { business } from '@/data/content';

export const metadata: Metadata = {
  title: 'Blog & Financial Resources | Deni Sawa',
  description:
    'Practical guides and articles on debt management, financial coaching, corporate wellness and money mindset from the Deni Sawa team.',
  alternates: {
    canonical: `${business.website}/blog`,
  },
};

export default async function BlogPage() {
  const blogPosts = await getBlogPosts({ limit: 100 });

  return (
    <main>
      <Breadcrumbs
        backgroundImage="/images/blog-hero.jpg"
        heading="Our Blog"
        items={[{ label: 'Blog' }]}
      />

      <section className="relative overflow-hidden py-20 lg:py-28">
        <div className="absolute -top-40 right-0 h-[420px] w-[420px] rounded-full bg-[radial-gradient(circle_at_center,rgba(45,157,120,0.05),transparent_70%)]" />
        <div className="container-lux relative">
          <div className="mx-auto mb-14 max-w-2xl text-center">
            <span className="eyebrow mb-5 justify-center">Insights & Ideas</span>
            <h2 className="section-heading mb-5">
              Guides, articles & <span className="text-brand-gradient">financial tips</span>
            </h2>
            <p className="text-lg leading-relaxed text-muted-foreground">
              Stories, frameworks and practical insights from the Deni Sawa advisory team —
              written to support your journey to financial freedom.
            </p>
          </div>

          {blogPosts.length > 0 ? (
            <BlogsList blogPosts={blogPosts} />
          ) : (
            <div className="rounded-4xl border border-border bg-card p-12 text-center">
              <p className="mb-4 text-muted-foreground">
                No blog posts are published yet. Please check back soon.
              </p>
              <Link
                href="/"
                className="btn-brand-outline text-sm"
              >
                <ArrowLeft className="h-4 w-4" /> Back to Home
              </Link>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
