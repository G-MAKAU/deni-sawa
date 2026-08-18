import type { MetadataRoute } from 'next';
import { site } from '@/data/site';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/business-health-checks/report/', '/business-health-checks/assessment/', '/admin', '/api/'],
      },
    ],
    sitemap: `${site.url}/sitemap.xml`,
  };
}
