import { container } from 'tsyringe';
import { Router } from 'express';
import { z } from 'zod';
import { RatingController } from './rating.controller';
import { requireAuth } from '../../middlewares/auth.middleware';
import { requireRole } from '../../middlewares/role.middleware';
import { validate } from '../../middlewares/validate.middleware';

const router = Router();
const controller = container.resolve(RatingController);
// Zod Validation Schemas
const rateProductSchema = z.object({
  params: z.object({
    productId: z.string({ required_error: 'Product ID is required' }).uuid('Invalid Product UUID format'),
  }),
  body: z.object({
    order_id: z.string({ required_error: 'Order ID is required' }).uuid('Invalid Order UUID format'),
    rating: z.number({ required_error: 'Rating is required' }).int().min(1, 'Rating must be at least 1').max(5, 'Rating cannot exceed 5'),
  }),
});

// Authenticated customers can rate products they bought
router.post(
  '/products/:productId/ratings',
  requireAuth,
  requireRole(['customer']),
  validate(rateProductSchema),
  controller.rateProduct
);

export default router;
