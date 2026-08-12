import { Router } from 'express';
import { container } from 'tsyringe';
import { z } from 'zod';
import { validate } from '../../middlewares/validate.middleware';
import { requireAuth } from '../../middlewares/auth.middleware';
import { requireRole } from '../../middlewares/role.middleware';
import { NotificationController } from './notification.controller';

const router = Router();
const controller = container.resolve(NotificationController);

const broadcastSchema = z.object({
  body: z.object({
    title: z.string().min(2, 'Title must be at least 2 characters'),
    message: z.string().min(5, 'Message must be at least 5 characters'),
    data: z.record(z.any()).optional(),
  }),
});

router.post(
  '/broadcast',
  requireAuth,
  requireRole(['admin']),
  validate(broadcastSchema),
  controller.broadcast
);

export default router;
