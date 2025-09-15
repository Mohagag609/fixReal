import { PrismaClient } from '@prisma/client'

// Enhanced Prisma logging configuration
export interface QueryLog {
  query: string
  params: string
  duration: number
  timestamp: Date
  target: string
}

// Query performance monitoring
class QueryPerformanceMonitor {
  private static queryLogs: QueryLog[] = []
  private static duplicateQueries = new Map<string, number>()
  private static slowQueries: QueryLog[] = []
  private static readonly MAX_LOGS = 1000
  private static readonly SLOW_QUERY_THRESHOLD = 1000 // 1 second

  static logQuery(query: string, params: string, duration: number, target: string) {
    const log: QueryLog = {
      query,
      params,
      duration,
      timestamp: new Date(),
      target
    }

    // Add to logs
    this.queryLogs.push(log)
    
    // Keep only recent logs
    if (this.queryLogs.length > this.MAX_LOGS) {
      this.queryLogs = this.queryLogs.slice(-this.MAX_LOGS)
    }

    // Track duplicate queries
    const queryKey = `${query}-${params}`
    const count = this.duplicateQueries.get(queryKey) || 0
    this.duplicateQueries.set(queryKey, count + 1)

    // Track slow queries
    if (duration > this.SLOW_QUERY_THRESHOLD) {
      this.slowQueries.push(log)
      console.warn(`🐌 Slow query detected (${duration}ms):`, {
        query: query.substring(0, 100) + '...',
        target,
        duration
      })
    }

    // Log query details
    console.log(`🔍 Prisma Query [${target}] (${duration}ms):`, {
      query: query.substring(0, 200) + (query.length > 200 ? '...' : ''),
      params: params.substring(0, 100) + (params.length > 100 ? '...' : ''),
      duration
    })
  }

  static getDuplicateQueries() {
    return Array.from(this.duplicateQueries.entries())
      .filter(([_, count]) => count > 1)
      .sort((a, b) => b[1] - a[1])
  }

  static getSlowQueries() {
    return this.slowQueries.sort((a, b) => b.duration - a.duration)
  }

  static getPerformanceStats() {
    const totalQueries = this.queryLogs.length
    const totalDuration = this.queryLogs.reduce((sum, log) => sum + log.duration, 0)
    const averageDuration = totalQueries > 0 ? totalDuration / totalQueries : 0
    const slowQueryCount = this.slowQueries.length
    const duplicateQueryCount = this.getDuplicateQueries().length

    return {
      totalQueries,
      averageDuration: Math.round(averageDuration),
      slowQueryCount,
      duplicateQueryCount,
      slowQueries: this.slowQueries.slice(0, 10), // Top 10 slow queries
      duplicateQueries: this.getDuplicateQueries().slice(0, 10) // Top 10 duplicate queries
    }
  }

  static reset() {
    this.queryLogs = []
    this.duplicateQueries.clear()
    this.slowQueries = []
  }
}

// Enhanced Prisma logging middleware
export function createPrismaLogger(): unknown[] {
  return [
    {
      level: 'query',
      emit: 'event',
    },
    {
      level: 'error',
      emit: 'event',
    },
    {
      level: 'info',
      emit: 'event',
    },
    {
      level: 'warn',
      emit: 'event',
    },
  ]
}

// Prisma event handlers
export function setupPrismaLogging(prisma: PrismaClient) {
  // Query logging
  prisma.$on('query', (e) => {
    QueryPerformanceMonitor.logQuery(
      e.query,
      e.params,
      e.duration,
      e.target || 'unknown'
    )
  })

  // Error logging
  prisma.$on('error', (e) => {
    console.error('❌ Prisma Error:', {
      message: e.message,
      target: e.target,
      timestamp: new Date().toISOString()
    })
  })

  // Info logging
  prisma.$on('info', (e) => {
    console.info('ℹ️ Prisma Info:', {
      message: e.message,
      target: e.target,
      timestamp: new Date().toISOString()
    })
  })

  // Warning logging
  prisma.$on('warn', (e) => {
    console.warn('⚠️ Prisma Warning:', {
      message: e.message,
      target: e.target,
      timestamp: new Date().toISOString()
    })
  })

  return QueryPerformanceMonitor
}

// Query deduplication middleware
export class QueryDeduplication {
  private static pendingQueries = new Map<string, Promise<unknown>>()

  static async deduplicate<T>(
    queryKey: string,
    queryFn: () => Promise<T>
  ): Promise<T> {
    // Check if query is already running
    if (this.pendingQueries.has(queryKey)) {
      console.log(`🔄 Deduplicating query: ${queryKey}`)
      return this.pendingQueries.get(queryKey)!
    }

    // Execute query and cache promise
    const promise = queryFn().finally(() => {
      this.pendingQueries.delete(queryKey)
    })

    this.pendingQueries.set(queryKey, promise)
    return promise
  }

  static clear() {
    this.pendingQueries.clear()
  }

  static getPendingQueries() {
    return Array.from(this.pendingQueries.keys())
  }
}

// Performance monitoring API endpoint data
export function getPrismaPerformanceData() {
  return {
    queryStats: QueryPerformanceMonitor.getPerformanceStats(),
    pendingQueries: QueryDeduplication.getPendingQueries(),
    timestamp: new Date().toISOString()
  }
}

// Health check for Prisma performance
export function checkPrismaHealth() {
  const stats = QueryPerformanceMonitor.getPerformanceStats()
  const health = {
    status: 'healthy',
    issues: [] as string[],
    recommendations: [] as string[]
  }

  // Check for slow queries
  if (stats.slowQueryCount > 0) {
    health.issues.push(`${stats.slowQueryCount} slow queries detected`)
    health.recommendations.push('Consider adding database indexes or optimizing queries')
  }

  // Check for duplicate queries
  if (stats.duplicateQueryCount > 0) {
    health.issues.push(`${stats.duplicateQueryCount} duplicate queries detected`)
    health.recommendations.push('Consider implementing query deduplication or caching')
  }

  // Check average query time
  if (stats.averageDuration > 500) {
    health.issues.push(`High average query time: ${stats.averageDuration}ms`)
    health.recommendations.push('Consider database optimization or connection pooling')
  }

  if (health.issues.length > 0) {
    health.status = 'warning'
  }

  return health
}

// Export the monitor for external use
export { QueryPerformanceMonitor }
