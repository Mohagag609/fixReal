// Comprehensive performance monitoring and optimization

// import { performanceMonitor } from '@/utils/performance'

export class PerformanceMonitor {
  private static instance: PerformanceMonitor
  private metrics: Map<string, PerformanceMetric> = new Map()
  private observers: PerformanceObserver[] = []

  static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor()
    }
    return PerformanceMonitor.instance
  }

  constructor() {
    this.setupPerformanceObservers()
  }

  private setupPerformanceObservers() {
    if (typeof window === 'undefined') return

    // Monitor navigation timing
    const navObserver = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.entryType === 'navigation') {
          this.recordMetric('navigation', {
            name: 'page_load',
            value: entry.duration,
            timestamp: Date.now()
          })
        }
      }
    })
    navObserver.observe({ entryTypes: ['navigation'] })
    this.observers.push(navObserver)

    // Monitor resource timing
    const resourceObserver = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.entryType === 'resource') {
          this.recordMetric('resource', {
            name: entry.name,
            value: entry.duration,
            timestamp: Date.now()
          })
        }
      }
    })
    resourceObserver.observe({ entryTypes: ['resource'] })
    this.observers.push(resourceObserver)

    // Monitor paint timing
    const paintObserver = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.entryType === 'paint') {
          this.recordMetric('paint', {
            name: entry.name,
            value: entry.startTime,
            timestamp: Date.now()
          })
        }
      }
    })
    paintObserver.observe({ entryTypes: ['paint'] })
    this.observers.push(paintObserver)
  }

  recordMetric(category: string, metric: PerformanceMetric) {
    if (!this.metrics.has(category)) {
      this.metrics.set(category, {
        name: metric.name,
        value: metric.value,
        timestamp: metric.timestamp,
        count: 1,
        average: metric.value,
        min: metric.value,
        max: metric.value
      })
    } else {
      const existing = this.metrics.get(category)!
      existing.count = (existing.count || 0) + 1
      existing.average = ((existing.average || 0) * ((existing.count || 1) - 1) + metric.value) / (existing.count || 1)
      existing.min = Math.min(existing.min || metric.value, metric.value)
      existing.max = Math.max(existing.max || metric.value, metric.value)
      existing.timestamp = metric.timestamp
    }
  }

  getMetrics(category?: string): Record<string, PerformanceMetric> {
    if (category) {
      const metric = this.metrics.get(category)
      return metric ? { [category]: metric } : {}
    }

    return Object.fromEntries(this.metrics.entries())
  }

  getPerformanceScore(): number {
    const metrics = this.getMetrics()
    let score = 100

    // Deduct points for slow metrics
    if ((metrics.navigation?.average || 0) > 3000) score -= 20
    if ((metrics.paint?.average || 0) > 1000) score -= 15
    if ((metrics.resource?.average || 0) > 1000) score -= 10

    return Math.max(0, score)
  }

  generateReport(): PerformanceReport {
    const metrics = this.getMetrics()
    const score = this.getPerformanceScore()

    return {
      score,
      metrics,
      recommendations: this.generateRecommendations(metrics),
      timestamp: Date.now()
    }
  }

  private generateRecommendations(metrics: Record<string, PerformanceMetric>): string[] {
    const recommendations: string[] = []

    if ((metrics.navigation?.average || 0) > 3000) {
      recommendations.push('تحسين وقت تحميل الصفحة - استخدم lazy loading للمكونات')
    }

    if ((metrics.paint?.average || 0) > 1000) {
      recommendations.push('تحسين وقت الرسم - قلل من حجم CSS و JavaScript')
    }

    if ((metrics.resource?.average || 0) > 1000) {
      recommendations.push('تحسين تحميل الموارد - استخدم ضغط الصور والملفات')
    }

    return recommendations
  }

  destroy() {
    this.observers.forEach(observer => observer.disconnect())
    this.observers = []
  }
}

interface PerformanceMetric {
  name: string
  value: number
  timestamp: number
  count?: number
  average?: number
  min?: number
  max?: number
}

interface PerformanceReport {
  score: number
  metrics: Record<string, PerformanceMetric>
  recommendations: string[]
  timestamp: number
}

// API performance monitoring
export class APIPerformanceMonitor {
  private static instance: APIPerformanceMonitor
  private requests: Map<string, number> = new Map()

  static getInstance(): APIPerformanceMonitor {
    if (!APIPerformanceMonitor.instance) {
      APIPerformanceMonitor.instance = new APIPerformanceMonitor()
    }
    return APIPerformanceMonitor.instance
  }

  startRequest(url: string): string {
    const requestId = `${url}_${Date.now()}_${Math.random()}`
    this.requests.set(requestId, performance.now())
    return requestId
  }

  endRequest(requestId: string): number {
    const startTime = this.requests.get(requestId)
    if (!startTime) return 0

    const duration = performance.now() - startTime
    this.requests.delete(requestId)
    return duration
  }

  getAverageResponseTime(url: string): number {
    // This would need to be implemented with proper storage
    return 0
  }
}

// Database performance monitoring
export class DatabasePerformanceMonitor {
  private static instance: DatabasePerformanceMonitor
  private queries: Map<string, number[]> = new Map()

  static getInstance(): DatabasePerformanceMonitor {
    if (!DatabasePerformanceMonitor.instance) {
      DatabasePerformanceMonitor.instance = new DatabasePerformanceMonitor()
    }
    return DatabasePerformanceMonitor.instance
  }

  recordQuery(query: string, duration: number) {
    if (!this.queries.has(query)) {
      this.queries.set(query, [])
    }
    this.queries.get(query)!.push(duration)
  }

  getSlowQueries(threshold: number = 1000): Array<{ query: string; averageTime: number; count: number }> {
    const slowQueries: Array<{ query: string; averageTime: number; count: number }> = []

    for (const [query, times] of this.queries.entries()) {
      const averageTime = times.reduce((sum, time) => sum + time, 0) / times.length
      if (averageTime > threshold) {
        slowQueries.push({
          query,
          averageTime,
          count: times.length
        })
      }
    }

    return slowQueries.sort((a, b) => b.averageTime - a.averageTime)
  }

  getQueryStats(query: string): { average: number; min: number; max: number; count: number } | null {
    const times = this.queries.get(query)
    if (!times || times.length === 0) return null

    return {
      average: times.reduce((sum, time) => sum + time, 0) / times.length,
      min: Math.min(...times),
      max: Math.max(...times),
      count: times.length
    }
  }
}

// Export singleton instances
export const performanceMonitor = PerformanceMonitor.getInstance()
export const apiPerformanceMonitor = APIPerformanceMonitor.getInstance()
export const dbPerformanceMonitor = DatabasePerformanceMonitor.getInstance()
