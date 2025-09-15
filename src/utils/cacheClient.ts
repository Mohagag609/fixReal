// Redis cache client for the application
import Redis from 'ioredis';

let redisClient: Redis | null = null;

export function getCacheClient(): Redis | null {
  if (!redisClient) {
    try {
      const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
      redisClient = new Redis(redisUrl, {
        enableReadyCheck: false,
        maxRetriesPerRequest: null,
      });
      
      redisClient.on('error', (err) => {
        console.warn('Redis connection error:', err);
        redisClient = null;
      });
      
      redisClient.on('connect', () => {
        console.log('Redis connected successfully');
      });
    } catch (error) {
      console.warn('Failed to connect to Redis:', error);
      redisClient = null;
    }
  }
  
  return redisClient;
}

export async function setCache(key: string, value: unknown, ttl: number = 3600): Promise<boolean> {
  const client = getCacheClient();
  if (!client) return false;
  
  try {
    await client.setex(key, ttl, JSON.stringify(value));
    return true;
  } catch (error) {
    console.warn('Cache set error:', error);
    return false;
  }
}

export async function getCache(key: string): Promise<unknown> {
  const client = getCacheClient();
  if (!client) return null;
  
  try {
    const value = await client.get(key);
    return value ? JSON.parse(value) : null;
  } catch (error) {
    console.warn('Cache get error:', error);
    return null;
  }
}

export async function deleteCache(key: string): Promise<boolean> {
  const client = getCacheClient();
  if (!client) return false;
  
  try {
    await client.del(key);
    return true;
  } catch (error) {
    console.warn('Cache delete error:', error);
    return false;
  }
}

export async function clearCache(): Promise<boolean> {
  const client = getCacheClient();
  if (!client) return false;
  
  try {
    await client.flushall();
    return true;
  } catch (error) {
    console.warn('Cache clear error:', error);
    return false;
  }
}

export { getCacheClient as cacheClient };
export default getCacheClient;
