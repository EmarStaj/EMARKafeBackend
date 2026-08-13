import rateLimit from 'express-rate-limit';
import { Request, Response, NextFunction } from 'express';

const isRateLimitEnabled = process.env.RATE_LIMIT_ENABLED !== 'false';

// No-op middleware that just passes through
const noopMiddleware = (_req: Request, _res: Response, next: NextFunction) => next();

/**
 * Global rate limiter — applies to all API endpoints.
 * Allows 100 requests per 15 minutes per IP.
 * Disabled when RATE_LIMIT_ENABLED=false
 */
export const globalRateLimiter = isRateLimitEnabled
  ? rateLimit({
      windowMs: 15 * 60 * 1000,
      max: 100,
      standardHeaders: true,
      legacyHeaders: false,
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
