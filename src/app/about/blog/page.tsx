import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { BlogsList } from '@/components/blog/BlogsList';
import { getBlogPosts } from '@/lib/supabase/queries';
import { business } from '@/data/content';

const ABSOLUTE_URL = `https://${business.website}`;

export const metadata: Metadata = {
  title: 'Blog & Insights | Deni Sawa',
  description:
    'Practical guides, frameworks and articles on debt management, financial coaching, corporate wellness and money mindset from the Deni Sawa advisory team.',
  alternates: {
    canonical: `${ABSOLUTE_URL}/about/blog`,
  },
  openGraph: {
    title: 'Blog & Insights | Deni Sawa',
    description:
      'Practical guides, frameworks and articles on debt management, financial coaching, corporate wellness and money mindset from the Deni Sawa advisory team.',
    url: `${ABSOLUTE_URL}/about/blog`,
    type: 'website',
    siteName: 'Deni Sawa',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Blog & Insights | Deni Sawa',
    description:
      'Practical guides, frameworks and articles on debt management, financial coaching, corporate wellness and money mindset from the Deni Sawa advisory team.',
  },
  robots: { index: true, follow: true },
};

export default async function BlogPage() {
  const blogPosts = await getBlogPosts({ limit: 100 });

  return (
    <main>
      <Breadcrumbs
        backgroundImage="/images/blog-hero.jpg"
        heading="Blog & Insights"
        items={[
          { label: 'About', to: '/about' },
          { label: 'Blog & Insights' },
        ]}
      />

      <section className="relative overflow-hidden py-20 lg:py-24">
        <div className="absolute -top-40 right-0 h-[420px] w-[420px] rounded-full bg-[radial-gradient(circle_at_center,rgba(45,157,120,0.05),transparent_70%)]" />
        <div className="absolute -left-40 bottom-0 h-[420px] w-[420px] rounded-full bg-[radial-gradient(circle_at_center,rgba(255,116,1,0.05),transparent_70%)]" />
        <div className="container-lux relative">
          <div className="mx-auto mb-14 max-w-3xl text-center">
            <span className="eyebrow mb-5 justify-center">
              Insights & Ideas
            </span>
            <h2 className="section-heading mb-5">
              Guides, frameworks & <span className="text-brand-gradient">financial wisdom</span>
            </h2>
            <p className="text-lg leading-relaxed text-muted-foreground">
              Practical thinking from the Deni Sawa advisory team — written to help you move from
              special situations to best-in-class financial health.
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
