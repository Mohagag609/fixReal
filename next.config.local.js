/** @type {import('next').NextConfig} */
import path from 'path';
import webpack from 'webpack';

const nextConfig = {
  // Performance optimizations
  experimental: {
    esmExternals: true,
    swcMinify: true,
  },

  // Compiler optimizations
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },

  // Image optimization
  images: {
    formats: ['image/webp', 'image/avif'],
    minimumCacheTTL: 60 * 60 * 24 * 30,
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },

  // Compression
  compress: true,

  // Security & caching headers
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-XSS-Protection', value: '1; mode=block' },
        ],
      },
      {
        source: '/api/(.*)',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=300, s-maxage=300, stale-while-revalidate=600' },
        ],
      },
      {
        source: '/_next/static/(.*)',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
        ],
      },
    ]
  },

  // Webpack custom config
  webpack: (config, { dev, isServer }) => {
    // Ignore Windows restricted folders completely (fix EPERM scandir)
    config.plugins.push(
      new webpack.IgnorePlugin({
        checkResource(resource) {
          return resource.includes('Application Data') || 
                 resource.includes('AppData') ||
                 resource.includes('ProgramData') ||
                 resource.includes('System Volume Information') ||
                 resource.includes('$RECYCLE.BIN') ||
                 resource.includes('Windows') ||
                 resource.includes('Program Files');
        },
      })
    );

    // Add watchOptions to exclude problematic directories
    config.watchOptions = {
      ignored: [
        '**/node_modules/**',
        '**/.git/**',
        '**/Application Data/**',
        '**/AppData/**',
        '**/ProgramData/**',
        '**/System Volume Information/**',
        '**/$RECYCLE.BIN/**',
        '**/Windows/**',
        '**/Program Files/**',
        '**/Program Files (x86)/**'
      ]
    };

    // Disable file system caching for problematic directories
    config.snapshot = {
      managedPaths: [require('path').resolve(__dirname, 'node_modules')],
      immutablePaths: [],
      buildDependencies: {
        hash: true,
        timestamp: true
      },
      module: {
        timestamp: true
      },
      resolve: {
        timestamp: true
      },
      resolveBuildDependencies: {
        hash: true,
        timestamp: true
      }
    };

    if (!dev && !isServer) {
      config.optimization.usedExports = true;
      config.optimization.sideEffects = false;
    }

    config.resolve.alias = {
      ...config.resolve.alias,
      '@': path.resolve(__dirname, 'src'),
    };

    if (!isServer) {
      config.optimization.splitChunks = {
        chunks: 'all',
        cacheGroups: {
          default: false,
          vendors: false,
          vendor: {
            name: 'vendor',
            chunks: 'all',
            test: /node_modules/,
            priority: 20,
          },
          common: {
            name: 'common',
            minChunks: 2,
            chunks: 'all',
            priority: 10,
            reuseExistingChunk: true,
            enforce: true,
          },
        },
      };
    }

    return config;
  },

  // Other settings
  poweredByHeader: false,
  reactStrictMode: true,
  trailingSlash: false,

  // Disable file system caching for problematic directories
  onDemandEntries: {
    maxInactiveAge: 25 * 1000,
    pagesBufferLength: 2,
  },

  // Disable static optimization for problematic files
  generateEtags: false,

  // Env vars
  env: {
    CUSTOM_KEY: process.env.CUSTOM_KEY,
  },
};

module.exports = nextConfig;

