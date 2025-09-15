import { cache as cacheClient, CacheKeys, CacheTTL } from './redis'

// Cache optimization utilities
export class CacheOptimizer {
  private static instance: CacheOptimizer
  private hitCount = 0
  private missCount = 0
  private evictionCount = 0

  static getInstance(): CacheOptimizer {
    if (!CacheOptimizer.instance) {
      CacheOptimizer.instance = new CacheOptimizer()
    }
    return CacheOptimizer.instance
  }

  // Optimized cache get with fallback
  async get<T>(
    key: string,
    fallback: () => Promise<T>,
    ttl: number = CacheTTL.MEDIUM
  ): Promise<T> {
    try {
      const cached = await cacheClient.get<T>(key)
      if (cached) {
        this.hitCount++
        return cached
      }
    } catch (error) {
      console.warn('Cache get error:', error)
    }

    this.missCount++
    const data = await fallback()
    
    try {
      await cacheClient.set(key, data, { ttl })
    } catch (error) {
      console.warn('Cache set error:', error)
    }

    return data
  }

  // Batch cache operations
  async getBatch<T>(
    keys: string[],
    fallback: (missingKeys: string[]) => Promise<Record<string, T>>,
    ttl: number = CacheTTL.MEDIUM
  ): Promise<Record<string, T>> {
    const results: Record<string, T> = {}
    const missingKeys: string[] = []

    // Try to get all keys from cache
    for (const key of keys) {
      try {
        const cached = await cacheClient.get<T>(key)
        if (cached) {
          results[key] = cached
          this.hitCount++
        } else {
          missingKeys.push(key)
        }
      } catch (error) {
        console.warn(`Cache get error for key ${key}:`, error)
        missingKeys.push(key)
      }
    }

    // Fetch missing data
    if (missingKeys.length > 0) {
      this.missCount += missingKeys.length
      const missingData = await fallback(missingKeys)
      
      // Cache the missing data
      for (const [key, value] of Object.entries(missingData)) {
        results[key] = value
        try {
          await cacheClient.set(key, value, { ttl })
        } catch (error) {
          console.warn(`Cache set error for key ${key}:`, error)
        }
      }
    }

    return results
  }

  // Cache with compression for large objects
  async getCompressed<T>(
    key: string,
    fallback: () => Promise<T>,
    ttl: number = CacheTTL.LONG
  ): Promise<T> {
    try {
      const compressed = await cacheClient.get<string>(`compressed:${key}`)
      if (compressed) {
        this.hitCount++
        return JSON.parse(compressed)
      }
    } catch (error) {
      console.warn('Cache get compressed error:', error)
    }

    this.missCount++
    const data = await fallback()
    
    try {
      const compressed = JSON.stringify(data)
      await cacheClient.set(`compressed:${key}`, compressed, { ttl })
    } catch (error) {
      console.warn('Cache set compressed error:', error)
    }

    return data
  }

  // Cache invalidation patterns
  async invalidatePattern(pattern: string): Promise<void> {
    try {
      await cacheClient.invalidatePattern(pattern)
      this.evictionCount++
    } catch (error) {
      console.warn('Cache invalidation error:', error)
    }
  }

  // Cache warming
  async warmCache<T>(
    key: string,
    data: T,
    ttl: number = CacheTTL.MEDIUM
  ): Promise<void> {
    try {
      await cacheClient.set(key, data, { ttl })
    } catch (error) {
      console.warn('Cache warming error:', error)
    }
  }

  // Cache statistics
  getStats() {
    const total = this.hitCount + this.missCount
    return {
      hitCount: this.hitCount,
      missCount: this.missCount,
      evictionCount: this.evictionCount,
      hitRate: total > 0 ? (this.hitCount / total) * 100 : 0,
      missRate: total > 0 ? (this.missCount / total) * 100 : 0
    }
  }

  // Reset statistics
  resetStats() {
    this.hitCount = 0
    this.missCount = 0
    this.evictionCount = 0
  }
}

// Predefined cache strategies
export const CacheStrategies = {
  // Dashboard data - cached for 5 minutes
  dashboard: {
    key: CacheKeys.dashboard,
    ttl: CacheTTL.SHORT,
    fallback: async () => {
      // This would be replaced with actual dashboard data fetching
      return {}
    }
  },

  // Entity lists - cached for 10 minutes
  entityList: (entity: string, params: string) => ({
    key: CacheKeys.entityList(entity, params),
    ttl: CacheTTL.MEDIUM,
    fallback: async () => {
      // This would be replaced with actual entity list fetching
      return []
    }
  }),

  // User sessions - cached for 1 hour
  userSession: (userId: string) => ({
    key: `user:session:${userId}`,
    ttl: CacheTTL.LONG,
    fallback: async () => {
      // This would be replaced with actual user session fetching
      return null
    }
  }),

  // API responses - cached for 2 minutes
  apiResponse: (endpoint: string, params: string) => ({
    key: `api:${endpoint}:${params}`,
    ttl: CacheTTL.SHORT,
    fallback: async () => {
      // This would be replaced with actual API call
      return null
    }
  })
}

// Cache middleware for API routes
export function withCache<T extends unknown[], R>(
  fn: (...args: T) => Promise<R>,
  keyGenerator: (...args: T) => string,
  ttl: number = CacheTTL.MEDIUM
) {
  return async (...args: T): Promise<R> => {
    const key = keyGenerator(...args)
    const optimizer = CacheOptimizer.getInstance()
    
    return optimizer.get(
      key,
      () => fn(...args),
      ttl
    )
  }
}

// Cache decorator for class methods
export function cached(
  keyGenerator: (...args: unknown[]) => string,
  ttl: number = CacheTTL.MEDIUM
) {
  return function (target: unknown, propertyName: string, descriptor: PropertyDescriptor) {
    const method = descriptor.value
    const optimizer = CacheOptimizer.getInstance()

    descriptor.value = async function (...args: unknown[]) {
      const key = keyGenerator(...args)
      return optimizer.get(
        key,
        () => method.apply(this, args),
        ttl
      )
    }
  }
}

// Export singleton instance
export const cacheOptimizer = CacheOptimizer.getInstance()
