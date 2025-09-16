/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone', // For optimized Docker builds
  experimental: {
    typedRoutes: true,
    serverActions: true,
    serverComponentsExternalPackages: ['@prisma/client', 'prisma'],
  },
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