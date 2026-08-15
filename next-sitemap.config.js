/** @type {import('next-sitemap').IConfig} */
export default {
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL || 'https://denisawa.co.ke',
  generateRobotsTxt: false,
  generateIndexSitemap: false,
  exclude: [
    '/admin',
    '/health-checks/assessment/*',
    '/health-checks/report/*',
  ],
  robotsTxtOptions: {
    policies: [{ userAgent: '*', allow: '/' }],
  },
};
