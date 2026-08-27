import rateLimit from 'express-rate-limit';
import RedisStore from 'rate-limit-redis';
import { Request, Response, NextFunction } from 'express';
import { redis as redisClient } from '../config/redis';

const isTest = process.env.NODE_ENV === 'test';
const useRedisStore = !isTest && !!process.env.REDIS_URL && !!redisClient;

/**
 * Helper to check if rate limiting is disabled globally via environment variable.
 * RATE_LIMIT_ENABLED=false disables ALL rate limiters across the entire app.
 */
const isRateLimiterDisabled = () => {
  return process.env.NODE_ENV === 'test' || process.env.RATE_LIMIT_ENABLED === 'false';
};

const createLimiter = (options: {
  windowMs: number;
  max: number;
  message: string;
  skip?: (req: Request) => boolean;
}) => {
  const limiter = rateLimit({
    store: useRedisStore
      ? new RedisStore({
          sendCommand: (...args: string[]) => redisClient.call(args[0], ...args.slice(1)) as any,
        })
      : undefined,
    windowMs: options.windowMs,
    max: options.max,
    standardHeaders: true,
    legacyHeaders: false,
    skip: (req: Request) => {
      if (isRateLimiterDisabled()) return true;
      if (options.skip) return options.skip(req);
      return false;
    },
    message: {
      success: false,
      message: options.message,
      errors: null,
    },
  });

  return (req: Request, res: Response, next: NextFunction) => {
    if (isRateLimiterDisabled()) {
      return next();
    }
    return limiter(req, res, next);
  };
};

/**
 * Global rate limiter — applies to all API endpoints.
 * Allows 100 requests per 15 minutes per IP.
 * Controlled globally by RATE_LIMIT_ENABLED (set to 'false' to disable all).
 */
export const globalRateLimiter = createLimiter({
  windowMs: 15 * 60 * 1000,
  max: 100,
  skip: (req: Request) =>
    req.path === '/health' || req.originalUrl === '/health' || req.path.startsWith('/api-docs'),
  message: 'Too many requests from this IP. Please try again after 15 minutes.',
});

/**
 * Strict auth rate limiter — applies to login and register endpoints.
 * Allows 10 requests per 15 minutes per IP to prevent brute-force attacks.
 * Controlled globally by RATE_LIMIT_ENABLED (set to 'false' to disable all).
 */
export const authRateLimiter = createLimiter({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: 'Too many authentication attempts from this IP. Please try again after 15 minutes.',
});

/**
 * Financial rate limiter — applies to wallet topup and QR code generation.
 * Allows 15 requests per 15 minutes per IP to prevent spamming transactions.
 * Controlled globally by RATE_LIMIT_ENABLED (set to 'false' to disable all).
 */
export const financialRateLimiter = createLimiter({
  windowMs: 15 * 60 * 1000,
  max: 15,
  message: 'Too many financial transactions from this IP. Please try again after 15 minutes.',
});
