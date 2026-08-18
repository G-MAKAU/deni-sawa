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
