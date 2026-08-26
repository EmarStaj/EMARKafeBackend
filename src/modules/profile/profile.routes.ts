import { container } from 'tsyringe';
import { Router } from 'express';
import { z } from 'zod';
import { ProfileController } from './profile.controller';
import { requireAuth } from '../../middlewares/auth.middleware';
import { validate } from '../../middlewares/validate.middleware';

const router = Router();
const controller = container.resolve(ProfileController);

// Zod Validation Schemas
const updateProfileSchema = z.object({
  body: z.object({
    full_name: z.string().trim().max(100, 'Full name cannot exceed 100 characters').optional(),
    email: z.string().email('Invalid email format').optional(),
    phone: z.string().regex(/^[0-9+\-\s]{10,15}$/, 'Invalid phone number format').optional().or(z.literal('')),
    birth_date: z.string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, 'Birth date must be in YYYY-MM-DD format')
      .refine(d => new Date(d) < new Date(), { message: 'Birth date must be in the past' })
      .optional()
      .nullable(),
    avatar_url: z.string().url('Avatar must be a valid URL').optional().or(z.literal('')),
  }),
});

const updateDefaultBranchSchema = z.object({
  body: z.object({
    branch_id: z.string().uuid('Invalid branch ID format'),
  }),
});

// All profile endpoints require authentication
router.use(requireAuth);

router.get('/me', controller.getProfile);
router.put('/me', validate(updateProfileSchema), controller.updateProfile);
router.put('/me/default-branch', validate(updateDefaultBranchSchema), controller.updateDefaultBranch);
router.delete('/cache', controller.clearCache);

export default router;
