/** @type {import('next').NextConfig} */
const nextConfig = {
  // Windows-specific environment variables
  env: {
    WATCHPACK_POLLING: 'true',
    CHOKIDAR_USEPOLLING: 'true',
    CHOKIDAR_INTERVAL: '1000',
  },

  // Basic optimizations only
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },

  // Image optimization
  images: {
    formats: ['image/webp'],
    minimumCacheTTL: 60 * 60 * 24 * 7, // 7 days
  },

  // Compression
  compress: true,

  // Simplified webpack config
  webpack: (config, { dev, isServer }) => {
    // Basic alias
    config.resolve.alias = {
      ...config.resolve.alias,
      '@': require('path').resolve(__dirname, 'src'),
    }

    // Windows-specific fixes
    if (process.platform === 'win32') {
      config.watchOptions = {
        poll: 1000,
        aggregateTimeout: 300,
        ignored: [
          '**/node_modules/**',
          '**/.git/**',
          '**/.next/**',
          '**/Application Data/**',
          '**/AppData/**',
          '**/System Volume Information/**'
        ]
      }
    }

    // Simple chunk splitting
    if (!isServer && !dev) {
      config.optimization.splitChunks = {
        chunks: 'all',
        cacheGroups: {
          vendor: {
            test: /node_modules/,
            name: 'vendor',
            chunks: 'all',
          },
        },
      }
    }

    return config
  },

  // Power by header
  poweredByHeader: false,

  // React strict mode
  reactStrictMode: true,

  // Trailing slash
  trailingSlash: false,
}

module.exports = nextConfig