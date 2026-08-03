import { Router } from 'express';
import { z } from 'zod';
import { OrderController } from './order.controller';
import { requireAuth } from '../../middlewares/auth.middleware';
import { validate } from '../../middlewares/validate.middleware';

const router = Router();
const controller = new OrderController();

// Zod Validation Schemas
const placeOrderSchema = z.object({
  body: z.object({
    branch_id: z.string({ required_error: 'Branch ID is required' }).uuid('Invalid Branch UUID format'),
  }),
});

const orderIdSchema = z.object({
  params: z.object({
    id: z.string({ required_error: 'Order ID is required' }).uuid('Invalid Order UUID format'),
  }),
});

// All order endpoints require authentication
router.use(requireAuth);

router.post('/', validate(placeOrderSchema), controller.placeOrder);
router.get('/', controller.getOrders);
router.get('/:id', validate(orderIdSchema), controller.getOrderById);

export default router;
