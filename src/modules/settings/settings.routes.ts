import { container } from 'tsyringe';
import { Router } from 'express';
import { z } from 'zod';
import { SettingsController } from './settings.controller';
import { requireAuth } from '../../middlewares/auth.middleware';
import { requireRole } from '../../middlewares/role.middleware';
import { validate } from '../../middlewares/validate.middleware';

const router = Router();
const controller = container.resolve(SettingsController);
// Zod Validation Schema
const updateSettingSchema = z.object({
  params: z.object({
    key: z.string({ required_error: 'Setting key is required' }).min(1, 'Key cannot be empty'),
  }),
  body: z.object({
    value: z.any({ required_error: 'Setting value is required' }),
  }),
});

// Public Endpoint
router.get('/', controller.getSettings);

// Admin-only Endpoint
router.put('/:key', requireAuth, requireRole(['admin']), validate(updateSettingSchema), controller.updateSetting);

export default router;
