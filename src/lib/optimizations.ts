// Main optimization configuration and utilities

import { performanceMonitor } from './performance-monitor'
import { cacheOptimizer } from './cache/optimizations'
import { performanceMonitor as perfMonitor } from '@/utils/performance'

// Optimization configuration
export const OptimizationConfig = {
  // Database optimizations
  database: {
    connectionLimit: 20,
    queryTimeout: 30000,
    enableQueryCache: true,
    enableConnectionPooling: true,
    enableSlowQueryLogging: true,
    slowQueryThreshold: 1000, // 1 second
  },

  // Cache optimizations
  cache: {
    defaultTTL: 5 * 60 * 1000, // 5 minutes
    maxSize: 100 * 1024 * 1024, // 100MB
    enableCompression: true,
    enableLRU: true,
    enableMetrics: true,
  },

  // API optimizations
  api: {
    enableResponseCompression: true,
    enableRequestBatching: true,
    enableResponseCaching: true,
    maxBatchSize: 100,
    enableMetrics: true,
  },

  // Frontend optimizations
  frontend: {
    enableVirtualScrolling: true,
    enableLazyLoading: true,
    enableImageOptimization: true,
    enableBundleSplitting: true,
    enableServiceWorker: true,
    enablePreloading: true,
  },

  // Performance monitoring
  monitoring: {
    enablePerformanceTracking: true,
    enableErrorTracking: true,
    enableUserTiming: true,
    enableResourceTiming: true,
    enableNavigationTiming: true,
  }
}

// Performance optimization utilities
export class OptimizationManager {
  private static instance: OptimizationManager
  private isInitialized = false

  static getInstance(): OptimizationManager {
    if (!OptimizationManager.instance) {
      OptimizationManager.instance = new OptimizationManager()
    }
    return OptimizationManager.instance
  }

  async initialize() {
    if (this.isInitialized) return

    try {
      // Initialize performance monitoring
      if (OptimizationConfig.monitoring.enablePerformanceTracking) {
        await this.initializePerformanceMonitoring()
      }

      // Initialize cache optimizations
      if (OptimizationConfig.cache.enableMetrics) {
        await this.initializeCacheOptimizations()
      }

      // Initialize frontend optimizations
      if (typeof window !== 'undefined') {
        await this.initializeFrontendOptimizations()
      }

      this.isInitialized = true
      console.log('Optimization manager initialized successfully')
    } catch (error) {
      console.error('Failed to initialize optimization manager:', error)
    }
  }

  private async initializePerformanceMonitoring() {
    // Setup performance observers
    if (typeof window !== 'undefined') {
      // Monitor Core Web Vitals
      this.observeCoreWebVitals()
      
      // Monitor API performance
      this.observeAPIPerformance()
      
      // Monitor database performance
      this.observeDatabasePerformance()
    }
  }

  private async initializeCacheOptimizations() {
    // Setup cache warming strategies
    await this.setupCacheWarming()
    
    // Setup cache invalidation strategies
    await this.setupCacheInvalidation()
  }

  private async initializeFrontendOptimizations() {
    // Preload critical resources
    await this.preloadCriticalResources()
    
    // Setup service worker
    await this.setupServiceWorker()
    
    // Setup lazy loading
    await this.setupLazyLoading()
  }

  private observeCoreWebVitals() {
    if (typeof window === 'undefined') return

    // Observe Largest Contentful Paint
    if ('PerformanceObserver' in window) {
      const lcpObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          perfMonitor.startTiming('lcp')
          perfMonitor.endTiming('lcp')
        }
      })
      lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] })

      // Observe First Input Delay
      const fidObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          perfMonitor.startTiming('fid')
          perfMonitor.endTiming('fid')
        }
      })
      fidObserver.observe({ entryTypes: ['first-input'] })

      // Observe Cumulative Layout Shift
      const clsObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          perfMonitor.startTiming('cls')
          perfMonitor.endTiming('cls')
        }
      })
      clsObserver.observe({ entryTypes: ['layout-shift'] })
    }
  }

  private observeAPIPerformance() {
    if (typeof window === 'undefined') return

    // Override fetch to monitor API calls
    const originalFetch = window.fetch
    window.fetch = async (...args) => {
      const startTime = performance.now()
      const url = args[0] as string
      
      try {
        const response = await originalFetch(...args)
        const duration = performance.now() - startTime
        
        perfMonitor.startTiming(`api:${url}`)
        perfMonitor.endTiming(`api:${url}`)
        
        return response
      } catch (error) {
        const duration = performance.now() - startTime
        console.error(`API call failed: ${url} (${duration}ms)`, error)
        throw error
      }
    }
  }

  private observeDatabasePerformance() {
    // This would be implemented in the API routes
    // to monitor database query performance
  }

  private async setupCacheWarming() {
    // Warm up frequently accessed data
    const criticalData = [
      'dashboard',
      'customers',
      'units',
      'contracts'
    ]

    for (const key of criticalData) {
      try {
        await cacheOptimizer.warmCache(key, {}, OptimizationConfig.cache.defaultTTL)
      } catch (error) {
        console.warn(`Failed to warm cache for ${key}:`, error)
      }
    }
  }

  private async setupCacheInvalidation() {
    // Setup automatic cache invalidation
    // This would be implemented based on data changes
  }

  private async preloadCriticalResources() {
    if (typeof window === 'undefined') return

    // Preload critical CSS
    const criticalCSS = document.createElement('link')
    criticalCSS.rel = 'preload'
    criticalCSS.href = '/styles/critical.css'
    criticalCSS.as = 'style'
    document.head.appendChild(criticalCSS)

    // Preload critical fonts
    const criticalFont = document.createElement('link')
    criticalFont.rel = 'preload'
    criticalFont.href = '/fonts/arabic-font.woff2'
    criticalFont.as = 'font'
    criticalFont.crossOrigin = 'anonymous'
    document.head.appendChild(criticalFont)
  }

  private async setupServiceWorker() {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return

    try {
      const registration = await navigator.serviceWorker.register('/sw.js')
      console.log('Service Worker registered:', registration)
    } catch (error) {
      console.warn('Service Worker registration failed:', error)
    }
  }

  private async setupLazyLoading() {
    if (typeof window === 'undefined') return

    // Setup lazy loading for images
    const images = document.querySelectorAll('img[data-src]')
    if (images.length > 0 && 'IntersectionObserver' in window) {
      const imageObserver = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const img = entry.target as HTMLImageElement
            const src = img.dataset.src
            if (src) {
              img.src = src
              img.classList.remove('lazy')
              imageObserver.unobserve(img)
            }
          }
        })
      })

      images.forEach((img) => imageObserver.observe(img))
    }
  }

  // Get optimization status
  getStatus() {
    return {
      initialized: this.isInitialized,
      performance: performanceMonitor.getMetrics(),
      cache: cacheOptimizer.getStats(),
      config: OptimizationConfig
    }
  }

  // Get performance recommendations
  getRecommendations() {
    const report = performanceMonitor.generateReport()
    return report.recommendations
  }

  // Cleanup
  destroy() {
    performanceMonitor.destroy()
    this.isInitialized = false
  }
}

// Export singleton instance
export const optimizationManager = OptimizationManager.getInstance()

// Auto-initialize in browser
if (typeof window !== 'undefined') {
  optimizationManager.initialize()
}
