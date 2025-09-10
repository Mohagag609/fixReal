import { Redis } from 'ioredis'

// Redis configuration
const redisConfig = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD,
  retryDelayOnFailover: 100,
  maxRetriesPerRequest: 3,
  lazyConnect: true,
}

// Create Redis client
let redis: Redis | null = null

export function getRedisClient(): Redis | null {
  if (!redis) {
    try {
      redis = new Redis(redisConfig)
      redis.on('error', (err) => {
        console.error('Redis connection error:', err)
        redis = null
      })
      redis.on('connect', () => {
        console.log('✅ Redis connected successfully')
      })
    } catch (error) {
      console.error('Failed to create Redis client:', error)
      return null
    }
  }
  return redis
}

// Cache interface
export interface CacheOptions {
  ttl?: number // Time to live in seconds
  prefix?: string
}

// Cache service
export class CacheService {
  private client: Redis | null
  private defaultTTL = 300 // 5 minutes

  constructor() {
    this.client = getRedisClient()
  }

  async get<T>(key: string): Promise<T | null> {
    if (!this.client) return null
    
    try {
      const value = await this.client.get(key)
      return value ? JSON.parse(value) : null
    } catch (error) {
      console.error('Cache get error:', error)
      return null
    }
  }

  async set<T>(key: string, value: T, options: CacheOptions = {}): Promise<boolean> {
    if (!this.client) return false
    
    try {
      const ttl = options.ttl || this.defaultTTL
      const prefixedKey = options.prefix ? `${options.prefix}:${key}` : key
      
      await this.client.setex(prefixedKey, ttl, JSON.stringify(value))
      return true
    } catch (error) {
      console.error('Cache set error:', error)
      return false
    }
  }

  async del(key: string, prefix?: string): Promise<boolean> {
    if (!this.client) return false
    
    try {
      const prefixedKey = prefix ? `${prefix}:${key}` : key
      await this.client.del(prefixedKey)
      return true
    } catch (error) {
      console.error('Cache delete error:', error)
      return false
    }
  }

  async invalidatePattern(pattern: string): Promise<boolean> {
    if (!this.client) return false
    
    try {
      const keys = await this.client.keys(pattern)
      if (keys.length > 0) {
        await this.client.del(...keys)
      }
      return true
    } catch (error) {
      console.error('Cache pattern invalidation error:', error)
      return false
    }
  }

  async flush(): Promise<boolean> {
    if (!this.client) return false
    
    try {
      await this.client.flushdb()
      return true
    } catch (error) {
      console.error('Cache flush error:', error)
      return false
    }
  }

  // Health check
  async ping(): Promise<boolean> {
    if (!this.client) return false
    
    try {
      const result = await this.client.ping()
      return result === 'PONG'
    } catch (error) {
      console.error('Cache ping error:', error)
      return false
    }
  }
}

// Export singleton instance
export const cache = new CacheService()

// Cache key generators
export const CacheKeys = {
  // User cache
  user: (id: string) => `user:${id}`,
  userByToken: (token: string) => `user:token:${token}`,
  
  // Dashboard cache
  dashboard: 'dashboard:kpis',
  dashboardStats: 'dashboard:stats',
  
  // Entity caches
  entity: (entity: string, id: string) => `${entity}:${id}`,
  entityList: (entity: string, params: string) => `${entity}:list:${params}`,
  
  // API response cache
  apiResponse: (endpoint: string, params: string) => `api:${endpoint}:${params}`,
  
  // Materialized view cache
  materializedView: (view: string) => `mv:${view}`,
}

// Cache TTL constants
export const CacheTTL = {
  USER: 1800, // 30 minutes
  DASHBOARD: 300, // 5 minutes
  ENTITY: 600, // 10 minutes
  API_RESPONSE: 60, // 1 minute
  MATERIALIZED_VIEW: 3600, // 1 hour
}
