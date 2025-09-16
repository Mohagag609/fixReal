import { PrismaClient } from "@prisma/client"
import Redis from "ioredis"
import { getConfig } from './db/config'

// Global Prisma client instance
let prismaInstance: PrismaClient | null = null

export const getPrismaInstance = (): PrismaClient => {
  if (!prismaInstance) {
    const config = getConfig()
    if (!config) {
      throw new Error('Database configuration not found')
    }
    
    prismaInstance = new PrismaClient({
      datasources: {
        db: {
          url: config.databaseUrl
        }
      },
      log: ['error', 'warn']
    })
  }
  
  return prismaInstance
}

// Global Redis client instance
let redisInstance: Redis | null = null

export const getRedisInstance = (): Redis | null => {
  if (!redisInstance && process.env.REDIS_URL) {
    try {
      redisInstance = new Redis(process.env.REDIS_URL, {
        retryDelayOnFailover: 100,
        maxRetriesPerRequest: 3,
        lazyConnect: true
      })
    } catch (error) {
      console.warn('Redis connection failed:', error)
      return null
    }
  }
  
  return redisInstance
}

// Cache client wrapper
export const cacheClient = () => {
  return getRedisInstance()
}

// Cleanup function
export const cleanupClients = async () => {
  if (prismaInstance) {
    await prismaInstance.$disconnect()
    prismaInstance = null
  }
  
  if (redisInstance) {
    await redisInstance.quit()
    redisInstance = null
  }
}

// Export commonly used instances
export const prisma = getPrismaInstance()
export const redis = getRedisInstance()
