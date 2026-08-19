import rateLimit from 'express-rate-limit';
import RedisStore from 'rate-limit-redis';
import Redis from 'ioredis';
import { Request, Response, NextFunction } from 'express';

const isRateLimitEnabled = process.env.RATE_LIMIT_ENABLED !== 'false';

// Initialize Redis client if URL is provided
const redisClient = process.env.REDIS_URL ? new Redis(process.env.REDIS_URL) : undefined;

if (redisClient) {
  redisClient.on('error', (err) => console.error('Redis Client Error', err));
}

// No-op middleware that just passes through
const noopMiddleware = (_req: Request, _res: Response, next: NextFunction) => next();

/**
 * Global rate limiter — applies to all API endpoints.
 * Allows 100 requests per 15 minutes per IP.
 * Disabled when RATE_LIMIT_ENABLED=false
 */
export const globalRateLimiter = isRateLimitEnabled
  ? rateLimit({
      store: redisClient ? new RedisStore({
        sendCommand: (...args: string[]) => redisClient.call(args[0], ...args.slice(1)) as any,
      }) : undefined,
      windowMs: 15 * 60 * 1000,
      max: 100,
      standardHeaders: true,
      legacyHeaders: false,
      skip: (req: Request) => req.path === '/health' || req.originalUrl === '/health' || req.path.startsWith('/api-docs'),
      message: {
        success: false,
        message: 'Too many requests from this IP. Please try again after 15 minutes.',
        errors: null,
      },
    })
  : noopMiddleware;

/**
 * Strict auth rate limiter — applies to login and register endpoints.
 * Allows 10 requests per 15 minutes per IP to prevent brute-force attacks.
 * Disabled when RATE_LIMIT_ENABLED=false
 */
export const authRateLimiter = isRateLimitEnabled
  ? rateLimit({
      store: redisClient ? new RedisStore({
        sendCommand: (...args: string[]) => redisClient.call(args[0], ...args.slice(1)) as any,
      }) : undefined,
      windowMs: 15 * 60 * 1000,
      max: 10,
      standardHeaders: true,
      legacyHeaders: false,
      message: {
        success: false,
        message: 'Too many authentication attempts from this IP. Please try again after 15 minutes.',
        errors: null,
      },
    })
  : noopMiddleware;
