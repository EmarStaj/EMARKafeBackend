import { container } from 'tsyringe';
import { Router } from 'express';
import { z } from 'zod';
import { OrderController } from './order.controller';
import { requireAuth } from '../../middlewares/auth.middleware';
import { requireRole } from '../../middlewares/role.middleware';
import { validate } from '../../middlewares/validate.middleware';

const router = Router();
const controller = container.resolve(OrderController);
// Zod Validation Schemas
const placeOrderSchema = z.object({
  body: z.object({
    branch_id: z.string({ required_error: 'Branch ID is required' }).uuid('Invalid Branch UUID format'),
  }),
});

const scanQrSchema = z.object({
  body: z.object({
    qr_token: z.string({ required_error: 'qr_token is required' })
  })
});

const orderIdSchema = z.object({
  params: z.object({
    id: z.string({ required_error: 'Order ID is required' }).uuid('Invalid Order UUID format'),
  }),
});

const updateStatusSchema = z.object({
  params: z.object({
    id: z.string({ required_error: 'Order ID is required' }).uuid('Invalid Order UUID format'),
  }),
  body: z.object({
    status: z.enum(['created', 'preparing', 'ready', 'completed', 'cancelled'], {
      required_error: 'Status is required and must be a valid status state',
    }),
  }),
});

// All order endpoints require authentication
router.use(requireAuth);

// 1. Branch / Barista endpoints (Place static routes first to prevent routing clashes)
router.get(
  '/branch',
  requireRole(['barista', 'branch_manager']),
  controller.getBranchOrders
);

router.post(
  '/scan-qr',
  requireRole(['barista', 'branch_manager']),
  validate(scanQrSchema),
  controller.scanQRAndCheckout
);

router.put(
  '/:id/status',
  requireRole(['barista', 'branch_manager', 'admin']),
  validate(updateStatusSchema),
  controller.updateOrderStatus
);

// 2. Customer endpoints
router.post(
  '/',
  requireRole(['customer']),
  validate(placeOrderSchema),
  controller.placeOrder
);

router.get(
  '/',
  requireRole(['customer']),
  controller.getOrders
);

router.get(
  '/:id',
  requireRole(['customer', 'barista', 'branch_manager', 'admin']),
  validate(orderIdSchema),
  controller.getOrderById
);

router.put(
  '/:id/cancel',
  requireRole(['customer']),
  validate(orderIdSchema),
  controller.cancelOrder
);

export default router;
