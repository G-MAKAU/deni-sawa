/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Externalize problematic ESM-only packages for Turbopack/Node runtime
  serverExternalPackages: [
    'pdfkit',
    '@react-pdf/renderer',
    'jsdom',
    'html-encoding-sniffer',
    '@exodus/bytes',
    '@lexical/headless',
    '@lexical/html',
    '@lexical/rich-text',
    '@lexical/list',
    '@lexical/code',
    '@lexical/link',
    '@lexical/mark',
    '@lexical/table',
    'lexical',
    '@lexical/selection',
    '@lexical/utils',
    '@lexical/clipboard',
    '@lexical/dragdrop',
    '@lexical/file',
    '@lexical/hashtag',
    '@lexical/horizontal-rule',
    '@lexical/inline-image',
    '@lexical/markdown',
    '@lexical/mention',
    '@lexical/offset',
    '@lexical/overflow',
    '@lexical/react',
    '@lexical/text',
    '@lexical/yjs',
  ],
  experimental: {
    turbo: {
      resolveAlias: {
        'jsdom': 'jsdom',
        'html-encoding-sniffer': 'html-encoding-sniffer',
        '@exodus/bytes': '@exodus/bytes',
      },
    },
  },
  images: {
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
    formats: ['image/avif', 'image/webp'],
    remotePatterns: [
      // Supabase Storage public objects (health check covers, blog images, etc.)
      { protocol: 'https', hostname: '*.supabase.co', pathname: '/storage/**' },
    ],
  },
  async redirects() {
    return [
      // Consolidate the duplicate insights/blog URLs into one canonical path.
      { source: '/insights', destination: '/blog', permanent: true },
      { source: '/insights/:path*', destination: '/blog/:path*', permanent: true },
      // Legacy "Debt Management" brand pages are replaced by Business Support & Learning.
      { source: '/services', destination: '/business-support', permanent: true },
      { source: '/services/:path*', destination: '/business-support/:path*', permanent: true },
      { source: '/academy', destination: '/learning', permanent: true },
      { source: '/academy/:path*', destination: '/learning/:path*', permanent: true },
    ];
  },
};

export default nextConfig;
