import { getConfig } from './db/config'
import { getPrismaClient } from './prisma-clients'

// Cache for user tokens to avoid repeated database queries
const userCache = new Map<string, { user: any; timestamp: number }>()
const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes

export async function getCachedUser(token: string) {
  // Check cache first
  const cached = userCache.get(token)
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    console.log('Using cached user for token:', token.substring(0, 10) + '...')
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
      // Cache the user
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

export function clearUserCache(token?: string) {
  if (token) {
    userCache.delete(token)
  } else {
    userCache.clear()
  }
}
