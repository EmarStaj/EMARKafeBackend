import { container } from 'tsyringe';
import { Router } from 'express';
import { z } from 'zod';
import { DeviceTokenController } from './device-token.controller';
import { requireAuth } from '../../middlewares/auth.middleware';
import { validate } from '../../middlewares/validate.middleware';

const router = Router();
const controller = container.resolve(DeviceTokenController);
// Zod Validation Schema
const saveTokenSchema = z.object({
  body: z.object({
    fcm_token: z.string({ required_error: 'FCM Token is required' }).min(1, 'Token cannot be empty'),
    platform: z.enum(['ios', 'android'], { required_error: 'Platform must be ios or android' }),
  }),
});

router.post('/', requireAuth, validate(saveTokenSchema), controller.registerToken);

export default router;
