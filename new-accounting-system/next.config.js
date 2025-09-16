/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    turbo: {
      rules: {
        '*.svg': {
          loaders: ['@svgr/webpack'],
          as: '*.js',
        },
      },
    },
  },
  images: {
    domains: ['localhost'],
  },
  // تحسين الأداء
  swcMinify: true,
  compress: true,
  
  // إعدادات التطوير
  devIndicators: {
    buildActivity: true,
    buildActivityPosition: 'bottom-right',
  },
  
  // إعدادات البناء
  output: 'standalone',
  
  // إعدادات الأمان
  poweredByHeader: false,
  
  // إعدادات التحسين
  optimizeFonts: true,
  
  // إعدادات التجريبية
  experimental: {
    optimizeCss: true,
    optimizePackageImports: ['lucide-react', 'framer-motion'],
  },
}

module.exports = nextConfig