import { container } from 'tsyringe';
import { Router } from 'express';
import { z } from 'zod';
import { AuthController } from './auth.controller';
import { validate } from '../../middlewares/validate.middleware';
import { requireAuth } from '../../middlewares/auth.middleware';
import { authRateLimiter } from '../../middlewares/rate-limit.middleware';

const router = Router();
const controller = container.resolve(AuthController);

// Zod Validation Schemas
const registerSchema = z.object({
  body: z.object({
    email: z.string({ required_error: 'Email is required' }).email('Invalid email address'),
    password: z.string({ required_error: 'Password is required' }).min(6, 'Password must be at least 6 characters'),
    full_name: z.string().trim().max(100, 'Full name cannot exceed 100 characters').optional(),
    phone: z.string().regex(/^[0-9+\-\s]{10,15}$/, 'Invalid phone number format').optional(),
    birth_date: z.string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, 'Birth date must be in YYYY-MM-DD format')
      .refine(d => new Date(d) < new Date(), { message: 'Birth date must be in the past' })
      .optional(),
  }),
});

const loginSchema = z.object({
  body: z.object({
    email: z.string({ required_error: 'Email is required' }).email('Invalid email address'),
    password: z.string({ required_error: 'Password is required' }),
  }),
});

const forgotPasswordSchema = z.object({
  body: z.object({
    email: z.string({ required_error: 'Email is required' }).email('Invalid email address'),
  }),
});

const resetPasswordSchema = z.object({
  body: z.object({
    password: z.string({ required_error: 'Password is required' }).min(6, 'Password must be at least 6 characters'),
  }),
});

const refreshSchema = z.object({
  body: z.object({
    refresh_token: z.string({ required_error: 'Refresh token is required' }),
  }),
});

// Endpoints
router.post('/register', authRateLimiter, validate(registerSchema), controller.signUp);
router.post('/login', authRateLimiter, validate(loginSchema), controller.signIn);
router.post('/logout', requireAuth, controller.signOut);
router.get('/me', requireAuth, controller.getMe);
router.post('/forgot-password', authRateLimiter, validate(forgotPasswordSchema), controller.forgotPassword);
router.post('/reset-password', authRateLimiter, validate(resetPasswordSchema), controller.resetPassword);
router.post('/refresh', authRateLimiter, validate(refreshSchema), controller.refresh);

export default router;
