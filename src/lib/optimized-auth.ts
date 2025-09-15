import { NextRequest } from 'next/server'
import { cache as cacheClient, CacheKeys } from '../lib/cache/redis'
import { getCachedUser } from './cached-auth'

// Enhanced authentication with Redis caching and performance optimization
export interface OptimizedAuthResult {
  user: { id: string; username: string; role: string } | null
  token: string | null
  fromCache: boolean
  cacheHit: boolean
}

// Cache for request-level authentication to prevent duplicate lookups
const requestAuthCache = new Map<string, { result: OptimizedAuthResult; timestamp: number }>()
const REQUEST_CACHE_DURATION = 30 * 1000 // 30 seconds

export async function getOptimizedAuth(request: NextRequest): Promise<OptimizedAuthResult> {
  const requestId = `${request.url}-${Date.now()}`
  const now = Date.now()
  
  // Check request-level cache first (prevents duplicate auth in same request)
  const cachedRequest = requestAuthCache.get(requestId)
  if (cachedRequest && (now - cachedRequest.timestamp) < REQUEST_CACHE_DURATION) {
    console.log('Using request-level auth cache')
    return cachedRequest.result
  }

  // Get token from request
  let token = null
  const authHeader = request.headers.get('authorization')
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.substring(7)
  }

  if (!token) {
    const cookieHeader = request.headers.get('cookie')
    if (cookieHeader) {
      const cookies = cookieHeader.split(';').reduce((acc, cookie) => {
        const [key, value] = cookie.trim().split('=')
        if (key && value) {
          acc[key] = value
        }
        return acc
      }, {} as Record<string, string>)
      token = cookies.authToken
    }
  }

  if (!token) {
    const result: OptimizedAuthResult = {
      user: null,
      token: null,
      fromCache: false,
      cacheHit: false
    }
    
    // Cache the result
    requestAuthCache.set(requestId, { result, timestamp: now })
    return result
  }

  // Try unified cache first
  let user = null
  let fromCache = false
  let cacheHit = false

  user = await cacheClient.get(CacheKeys.userByToken(token))
  if (user) {
    fromCache = true
    cacheHit = true
    console.log('Using cached user for token:', token.substring(0, 10) + '...')
  }

  // Fallback to database if not in cache
  if (!user) {
    user = await getCachedUser(token)
    fromCache = false
    cacheHit = false
  }

  const result: OptimizedAuthResult = {
    user: user as { id: string; username: string; role: string } | null,
    token,
    fromCache,
    cacheHit
  }

  // Cache the result at request level
  requestAuthCache.set(requestId, { result, timestamp: now })

  return result
}

// Clear request-level cache (useful for testing or memory management)
export function clearRequestAuthCache() {
  requestAuthCache.clear()
}

// Enhanced middleware with performance monitoring
export async function requireOptimizedAuth(requiredRole: string = 'user') {
  return async (request: NextRequest) => {
    const startTime = Date.now()
    
    const { user, cacheHit } = await getOptimizedAuth(request)
    
    const authTime = Date.now() - startTime
    console.log(`Auth completed in ${authTime}ms (cache: ${cacheHit ? 'hit' : 'miss'})`)
    
    if (!user) {
      return new Response(
        JSON.stringify({ success: false, error: 'غير مخول للوصول' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      )
    }
    
    // Check role permissions
    const roleHierarchy = {
      'admin': 3,
      'user': 1
    }
    
    const userLevel = roleHierarchy[user.role as keyof typeof roleHierarchy] || 0
    const requiredLevel = roleHierarchy[requiredRole as keyof typeof roleHierarchy] || 0
    
    if (userLevel < requiredLevel) {
      return new Response(
        JSON.stringify({ success: false, error: 'غير مخول للوصول' }),
        { status: 403, headers: { 'Content-Type': 'application/json' } }
      )
    }
    
    return null
  }
}

// Performance monitoring utilities
export class AuthPerformanceMonitor {
  private static metrics = {
    totalRequests: 0,
    cacheHits: 0,
    cacheMisses: 0,
    totalAuthTime: 0,
    averageAuthTime: 0
  }

  static recordAuth(fromCache: boolean, authTime: number) {
    this.metrics.totalRequests++
    if (fromCache) {
      this.metrics.cacheHits++
    } else {
      this.metrics.cacheMisses++
    }
    
    this.metrics.totalAuthTime += authTime
    this.metrics.averageAuthTime = this.metrics.totalAuthTime / this.metrics.totalRequests
  }

  static getMetrics() {
    return {
      ...this.metrics,
      cacheHitRate: this.metrics.totalRequests > 0 
        ? (this.metrics.cacheHits / this.metrics.totalRequests * 100).toFixed(2) + '%'
        : '0%'
    }
  }

  static reset() {
    this.metrics = {
      totalRequests: 0,
      cacheHits: 0,
      cacheMisses: 0,
      totalAuthTime: 0,
      averageAuthTime: 0
    }
  }
}

// Enhanced getUserFromToken with better error handling and performance
export async function getOptimizedUserFromToken(token: string): Promise<{ id: string; username: string; role: string } | null> {
  const startTime = Date.now()
  
  try {
    // Try Redis cache first
    let user = await cacheClient.get(CacheKeys.userByToken(token))
    if (user) {
      AuthPerformanceMonitor.recordAuth(true, Date.now() - startTime)
      return user as { id: string; username: string; role: string }
    }

    // Fallback to database
    user = await getCachedUser(token)
    AuthPerformanceMonitor.recordAuth(false, Date.now() - startTime)
    
    return user as { id: string; username: string; role: string } | null
  } catch (error) {
    console.error('Error in getOptimizedUserFromToken:', error)
    AuthPerformanceMonitor.recordAuth(false, Date.now() - startTime)
    return null
  }
}
