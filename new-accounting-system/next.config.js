/** @type {import('next').NextConfig} */
const nextConfig = {
  // Remove static export for now - use regular build
  // output: 'export',
  // trailingSlash: true,
  // images: {
  //   unoptimized: true,
  // },
  typedRoutes: true,
  serverExternalPackages: ['@prisma/client', 'prisma'],
    transpilePackages: ['lucide-react'],
  // Environment variables for build time
  env: {
    DATABASE_URL: process.env.DATABASE_URL,
    DATABASE_PROVIDER: process.env.DATABASE_PROVIDER,
  },
  // Headers for security
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin',
          },
        ],
      },
    ];
  },
  // Redirects for SPA routing
  async redirects() {
    return [
      {
        source: '/dashboard',
        destination: '/',
        permanent: true,
      },
    ];
  },
};

module.exports = nextConfig;