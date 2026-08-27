import { container } from 'tsyringe';
import { Router } from 'express';
import { z } from 'zod';
import { OptionController } from './option.controller';
import { requireAuth } from '../../middlewares/auth.middleware';
import { requireRole } from '../../middlewares/role.middleware';
import { validate } from '../../middlewares/validate.middleware';

const router = Router();
const controller = container.resolve(OptionController);
// Zod Validation Schemas
const getOptionsSchema = z.object({
  params: z.object({
    productId: z.string({ required_error: 'Product ID is required' }).uuid('Invalid Product UUID format'),
  }),
});

const createOptionSchema = z.object({
  params: z.object({
    productId: z.string({ required_error: 'Product ID is required' }).uuid('Invalid Product UUID format'),
  }),
  body: z.object({
    name: z.string({ required_error: 'Option name is required' }).min(1, 'Name is required'),
    is_required: z.boolean().optional(),
    is_multi_select: z.boolean().optional(),
  }),
});

const createOptionValueSchema = z.object({
  params: z.object({
    optionId: z.string({ required_error: 'Option ID is required' }).uuid('Invalid Option UUID format'),
  }),
  body: z.object({
    label: z.string({ required_error: 'Label is required' }).min(1, 'Label is required'),
    price_delta: z.number().nonnegative('Price delta must be non-negative').optional(),
  }),
});

const idParamSchema = z.object({
  params: z.object({
    id: z.string({ required_error: 'ID parameter is required' }).uuid('Invalid UUID format'),
  }),
});

// Public Endpoints (Supported at /api/options/products/:productId/options and /api/menu/products/:productId/options)
router.get(['/products/:productId/options', '/:productId/options'], validate(getOptionsSchema), controller.getProductOptions);

// Admin-only Endpoints (Option groups and values CRUD)
router.post(['/products/:productId/options', '/:productId/options'], requireAuth, requireRole(['admin']), validate(createOptionSchema), controller.createOption);
router.post(['/:optionId/values', '/options/:optionId/values'], requireAuth, requireRole(['admin']), validate(createOptionValueSchema), controller.createOptionValue);
router.delete(['/:id', '/options/:id'], requireAuth, requireRole(['admin']), validate(idParamSchema), controller.deleteOption);
router.delete(['/values/:id', '/options/values/:id'], requireAuth, requireRole(['admin']), validate(idParamSchema), controller.deleteOptionValue);

export default router;
