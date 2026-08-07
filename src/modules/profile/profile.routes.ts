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
    full_name: z.string().optional(),
    phone: z.string().optional(),
    avatar_url: z.string().url('Avatar must be a valid URL').optional().or(z.literal('')),
  }),
});

// All profile endpoints require authentication
router.use(requireAuth);

router.get('/me', controller.getProfile);
router.put('/me', validate(updateProfileSchema), controller.updateProfile);
router.delete('/cache', controller.clearCache);

export default router;
