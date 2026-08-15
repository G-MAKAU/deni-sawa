import type { MetadataRoute } from 'next';
import { site } from '@/data/site';
import { services as contentServices } from '@/data/content';
import { services as businessServices } from '@/data/site';
import { getBlogPosts } from '@/lib/supabase/queries';

export const dynamic = 'force-static';

const staticRoutes: string[] = [
  '',
  '/about',
  '/about/leadership',
  '/about/philosophy',
  '/about/experience',
  '/academy',
  '/blog',
  '/contact',
  '/deni-sawa-method',
  '/health-checks',
  '/health-checks/business-health-check',
  '/health-checks/professional-financial-health-check',
  '/learning',
  '/learning/executive-finance',
  '/learning/business-recovery',
  '/learning/governance',
  '/learning/financial-resilience',
  '/privacy',
  '/services',
  '/specialsit-network',
  '/terms',
  '/investors',
  '/investors/investor-readiness',
  '/investors/portfolio-oversight',
  '/investors/governance',
  '/investors/investor-representation',
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = site.url.replace(/\/$/, '');

  const entries: MetadataRoute.Sitemap = staticRoutes.map((route) => ({
    url: `${base}${route}`,
    changeFrequency: route === '' ? 'weekly' : 'monthly',
    priority: route === '' ? 1 : 0.7,
  }));

  // Service + business-support pages from their data sources.
  contentServices.forEach((service) => {
    entries.push({
      url: `${base}/services/${service.slug}`,
      changeFrequency: 'monthly',
      priority: 0.7,
    });
  });
  businessServices.forEach((service) => {
    entries.push({
      url: `${base}/business-support/${service.slug}`,
      changeFrequency: 'monthly',
      priority: 0.7,
    });
  });

  // Blog posts (degrade gracefully when the DB isn't ready).
  let posts: { slug: string; published_at: string | null }[] = [];
  try {
    posts = await getBlogPosts({ limit: 200 });
  } catch {
    posts = [];
  }
  posts.forEach((post) => {
    entries.push({
      url: `${base}/blog/${post.slug}`,
      lastModified: post.published_at ? new Date(post.published_at) : undefined,
      changeFrequency: 'weekly',
      priority: 0.8,
    });
  });

  return entries;
}
