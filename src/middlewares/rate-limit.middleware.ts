import rateLimit from 'express-rate-limit';
import RedisStore from 'rate-limit-redis';
import { Request, Response, NextFunction } from 'express';
import { redis as redisClient } from '../config/redis';

const isTest = process.env.NODE_ENV === 'test';
const isRateLimitEnabled = !isTest && process.env.RATE_LIMIT_ENABLED !== 'false';
const useRedisStore = !isTest && !!process.env.REDIS_URL && !!redisClient;

// No-op middleware that just passes through
const noopMiddleware = (_req: Request, _res: Response, next: NextFunction) => next();

/**
 * Global rate limiter — applies to all API endpoints.
 * Allows 100 requests per 15 minutes per IP.
 * Disabled when RATE_LIMIT_ENABLED=false or in test mode.
 */
export const globalRateLimiter = isRateLimitEnabled
  ? rateLimit({
      store: useRedisStore ? new RedisStore({
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
 * Disabled when RATE_LIMIT_ENABLED=false or in test mode.
 */
export const authRateLimiter = isRateLimitEnabled
  ? rateLimit({
      store: useRedisStore ? new RedisStore({
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
