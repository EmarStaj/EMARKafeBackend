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
  }),
});

const loginSchema = z.object({
  body: z.object({
    email: z.string({ required_error: 'Email is required' }).email('Invalid email address'),
    password: z.string({ required_error: 'Password is required' }),
  }),
});

// Endpoints
router.post('/register', authRateLimiter, validate(registerSchema), controller.signUp);
router.post('/login', authRateLimiter, validate(loginSchema), controller.signIn);
router.post('/logout', requireAuth, controller.signOut);
router.get('/me', requireAuth, controller.getMe);

export default router;
