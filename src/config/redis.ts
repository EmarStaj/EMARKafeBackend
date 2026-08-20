import Redis from 'ioredis';
import { logger } from './logger';

const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

export const redis = new Redis(redisUrl, {
  lazyConnect: true,
  enableOfflineQueue: false,
  connectTimeout: 2000,
  maxRetriesPerRequest: 1,
  retryStrategy(times) {
    if (times > 2) {
      logger.warn('Redis retry limit reached. Disabling Redis for this instance.');
      return null; // Stop retrying
    }
    return Math.min(times * 100, 2000);
  },
});

redis.on('connect', () => {
  logger.info('Connected to Redis successfully');
});

redis.on('error', (err) => {
  logger.error('Redis connection error:', err);
});
