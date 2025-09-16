/** @type {import('next').NextConfig} */
const nextConfig = {
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

  // Development optimizations
  experimental: {
    esmExternals: false, // Disable for better compatibility
  },

  // Fix for development issues
  typescript: {
    ignoreBuildErrors: false,
  },

  eslint: {
    ignoreDuringBuilds: true,
  },

  // Enhanced webpack config for development
  webpack: (config, { dev, isServer }) => {
    // Basic alias
    config.resolve.alias = {
      ...config.resolve.alias,
      '@': require('path').resolve(__dirname, 'src'),
    }

    // Development-specific fixes
    if (dev) {
      // Fix for Windows file watching
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

      // Fix for hot reload issues
      config.optimization = {
        ...config.optimization,
        splitChunks: false,
      }

      // Fix for module resolution
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
      }
    }

    // Production optimizations
    if (!dev && !isServer) {
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

    // Fix for common webpack issues
    config.ignoreWarnings = [
      /Failed to parse source map/,
      /Critical dependency: the request of a dependency is an expression/,
    ]

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