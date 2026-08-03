import { Router } from 'express';
import { z } from 'zod';
import { MenuController } from './menu.controller';
import { requireAuth } from '../../middlewares/auth.middleware';
import { validate } from '../../middlewares/validate.middleware';

const router = Router();
const controller = new MenuController();

// Zod Validation Schemas
const createItemSchema = z.object({
  body: z.object({
    category_id: z.string({ required_error: 'Category ID is required' }).uuid('Invalid Category UUID format'),
    name: z.string({ required_error: 'Product name is required' }).min(2, 'Name must be at least 2 characters'),
    description: z.string().optional(),
    base_price: z.number({ required_error: 'Base price is required' }).positive('Base price must be positive'),
    image_url: z.string().url('Must be a valid image URL').optional().or(z.literal('')),
    is_active: z.boolean().optional(),
    is_loyalty_eligible: z.boolean().optional(),
  }),
});

const updateItemSchema = z.object({
  body: z.object({
    category_id: z.string().uuid('Invalid Category UUID format').optional(),
    name: z.string().min(2).optional(),
    description: z.string().optional(),
    base_price: z.number().positive().optional(),
    image_url: z.string().url().optional().or(z.literal('')),
    is_active: z.boolean().optional(),
    is_loyalty_eligible: z.boolean().optional(),
  }),
  params: z.object({
    id: z.string({ required_error: 'ID parameter is required' }).uuid('Invalid Product UUID format'),
  }),
});

const getItemSchema = z.object({
  params: z.object({
    id: z.string({ required_error: 'ID parameter is required' }).uuid('Invalid Product UUID format'),
  }),
});

// Public Endpoints
router.get('/', controller.getAllItems);
router.get('/:id', validate(getItemSchema), controller.getItemById);

// Admin-only / Authenticated Endpoints
router.post('/', requireAuth, validate(createItemSchema), controller.createItem);
router.put('/:id', requireAuth, validate(updateItemSchema), controller.updateItem);
router.delete('/:id', requireAuth, validate(getItemSchema), controller.deleteItem);

export default router;
