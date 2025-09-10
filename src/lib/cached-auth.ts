import { getConfig } from './db/config'
import { getPrismaClient } from './prisma-clients'
import { cache, CacheKeys, CacheTTL } from './cache/redis'

// Fallback in-memory cache for when Redis is not available
const userCache = new Map<string, { user: any; timestamp: number }>()
const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes

export async function getCachedUser(token: string) {
  // Try Redis cache first
  try {
    const cachedUser = await cache.get(CacheKeys.userByToken(token))
    if (cachedUser) {
      console.log('Using Redis cached user for token:', token.substring(0, 10) + '...')
      return cachedUser
    }
  } catch (error) {
    console.log('Redis cache unavailable, falling back to memory cache')
  }

  // Fallback to memory cache
  const cached = userCache.get(token)
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    console.log('Using memory cached user for token:', token.substring(0, 10) + '...')
    return cached.user
  }

  console.log('Fetching user from database for token:', token.substring(0, 10) + '...')

  // Get user from database directly
  try {
    const config = getConfig()
    if (!config) {
      return null
    }

    const prisma = getPrismaClient(config)
    await prisma.$connect()

    // Decode JWT token
    const jwt = require('jsonwebtoken')
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key')

    // Use raw SQL to avoid type issues
    const userResult = await prisma.$queryRaw`
      SELECT id, username, email, role, "isActive" 
      FROM users 
      WHERE id = ${decoded.id}
    ` as any[]

    await prisma.$disconnect()

    const user = userResult[0] || null

    if (user) {
      // Cache in both Redis and memory
      try {
        await cache.set(CacheKeys.userByToken(token), user, { 
          ttl: CacheTTL.USER,
          prefix: 'auth' 
        })
      } catch (error) {
        console.log('Failed to cache user in Redis, using memory cache only')
      }

      // Memory cache fallback
      userCache.set(token, {
        user,
        timestamp: Date.now()
      })
      console.log('User cached successfully')
    }

    return user
  } catch (error) {
    console.error('Error getting cached user:', error)
    return null
  }
}

export async function clearUserCache(token?: string) {
  if (token) {
    // Clear from Redis
    try {
      await cache.del(CacheKeys.userByToken(token), 'auth')
    } catch (error) {
      console.log('Failed to clear user from Redis cache')
    }
    // Clear from memory cache
    userCache.delete(token)
  } else {
    // Clear all users from Redis
    try {
      await cache.invalidatePattern('auth:user:token:*')
    } catch (error) {
      console.log('Failed to clear all users from Redis cache')
    }
    // Clear all from memory cache
    userCache.clear()
  }
}
