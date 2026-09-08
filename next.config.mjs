/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // pdfkit's ESM build references __dirname and breaks when bundled by
  // Turbopack; @react-pdf/renderer resolves to its browser build. Keep both
  // external so route handlers load the Node builds at runtime.
  serverExternalPackages: ['pdfkit', '@react-pdf/renderer'],
  images: {
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
    formats: ['image/avif', 'image/webp'],
    remotePatterns: [
      // Supabase Storage public objects (health check covers, blog images, etc.)
      { protocol: 'https', hostname: '*.supabase.co', pathname: '/storage/**' },
    ],
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
        ],
      },
    ];
  },
  async redirects() {
    return [
      // Consolidate the duplicate insights/blog URLs into one canonical path.
      { source: '/insights', destination: '/blog', permanent: true },
      { source: '/insights/:path*', destination: '/blog/:path*', permanent: true },
      // Academy brand pages are replaced by the Learning Centre.
      { source: '/academy', destination: '/learning', permanent: true },
      { source: '/academy/:path*', destination: '/learning/:path*', permanent: true },
      // /health-checks is the canonical short alias for the health check suite.
      { source: '/health-checks', destination: '/business-health-checks', permanent: true },
      { source: '/health-checks/:path*', destination: '/business-health-checks/:path*', permanent: true },
    ];
  },
};

export default nextConfig;
