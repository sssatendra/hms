import Redis from 'ioredis';
import { config } from '../config';
import { logger } from '../utils/logger';

let redisClient: Redis | null = null;

export const getRedisClient = (): Redis => {
  if (!redisClient) {
    redisClient = new Redis(config.redis.url, {
      maxRetriesPerRequest: 3,
      retryStrategy(times) {
        const delay = Math.min(times * 50, 2000);
        return delay;
      },
      reconnectOnError(err) {
        const targetError = 'READONLY';
        if (err.message.includes(targetError)) return true;
        return false;
      },
    });

    redisClient.on('connect', () => logger.info('✅ Redis connected'));
    redisClient.on('error', (err) => logger.error('Redis error', { error: err.message }));
    redisClient.on('close', () => logger.warn('Redis connection closed'));
  }
  return redisClient;
};

// Cache helpers
export const cacheSet = async (
  key: string,
  value: unknown,
  ttlSeconds = 300
): Promise<void> => {
  const redis = getRedisClient();
  await redis.setex(key, ttlSeconds, JSON.stringify(value));
};

export const cacheGet = async <T>(key: string): Promise<T | null> => {
  const redis = getRedisClient();
  const data = await redis.get(key);
  if (!data) return null;
  return JSON.parse(data) as T;
};

export const cacheDel = async (key: string): Promise<void> => {
  const redis = getRedisClient();
  await redis.del(key);
};

export const cacheDelPattern = async (pattern: string): Promise<void> => {
  const redis = getRedisClient();
  const keys = await redis.keys(pattern);
  if (keys.length) await redis.del(...keys);
};

// Cache key builders
export const CacheKeys = {
  user: (tenantId: string, userId: string) => `tenant:${tenantId}:user:${userId}`,
  patient: (tenantId: string, patientId: string) => `tenant:${tenantId}:patient:${patientId}`,
  inventory: (tenantId: string) => `tenant:${tenantId}:inventory`,
  inventoryItem: (tenantId: string, itemId: string) => `tenant:${tenantId}:inventory:${itemId}`,
  labTests: (tenantId: string) => `tenant:${tenantId}:lab_tests`,
  dashboard: (tenantId: string) => `tenant:${tenantId}:dashboard`,
  notifications: (tenantId: string, userId: string) => `tenant:${tenantId}:notif:${userId}`,
  rateLimit: (key: string) => `rate_limit:${key}`,
  session: (sessionId: string) => `session:${sessionId}`,
  blacklist: (token: string) => `blacklist:${token}`,
};

export async function disconnectRedis(): Promise<void> {
  if (redisClient) {
    await redisClient.quit();
    redisClient = null;
    logger.info('Redis disconnected');
  }
}
