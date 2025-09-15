import { getConfig } from './db/config'
import { getPrismaClient } from './prisma-clients'
import { cache as cacheClient, CacheKeys, CacheTTL } from '../lib/cache/redis'

// Fallback in-memory cache for when Redis is not available
const userCache = new Map<string, { user: { id: string; username: string; role: string }; timestamp: number }>()
const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes

export async function getCachedUser(token: string) {
  // Try unified cache first
  const cachedUser = await cacheClient.get(CacheKeys.userByToken(token))
  if (cachedUser) {
    console.log('Using cached user for token:', token.substring(0, 10) + '...')
    return cachedUser
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
    const jwt = await import('jsonwebtoken')
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key')

    // Use raw SQL to avoid type issues
    const userResult = await prisma.$queryRaw`
      SELECT id, username, email, role, "isActive" 
      FROM users 
      WHERE id = ${(decoded as { id: string }).id}
    ` as { id: string; username: string; email: string; role: string; isActive: boolean }[]

    await prisma.$disconnect()

    const user = userResult[0] || null

    if (user) {
      // Cache in unified cache
      await cacheClient.set(CacheKeys.userByToken(token), user, { ttl: CacheTTL.USER })

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
    // Clear from unified cache
    await cacheClient.del(CacheKeys.userByToken(token))
    // Clear from memory cache
    userCache.delete(token)
  } else {
    // Clear all users from unified cache
    await cacheClient.invalidatePattern('user:token:*')
    // Clear all from memory cache
    userCache.clear()
  }
}
