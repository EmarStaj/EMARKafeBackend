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
    name: z.string({ required_error: 'Item name is required' }).min(2, 'Name must be at least 2 characters'),
    description: z.string().optional(),
    price: z.number({ required_error: 'Price is required' }).positive('Price must be positive'),
    category: z.string({ required_error: 'Category is required' }),
    image_url: z.string().url('Must be a valid image URL').optional().or(z.literal('')),
    is_available: z.boolean().optional(),
  }),
});

const updateItemSchema = z.object({
  body: z.object({
    name: z.string().min(2).optional(),
    description: z.string().optional(),
    price: z.number().positive().optional(),
    category: z.string().optional(),
    image_url: z.string().url().optional().or(z.literal('')),
    is_available: z.boolean().optional(),
  }),
  params: z.object({
    id: z.string({ required_error: 'ID parameter is required' }),
  }),
});

const getItemSchema = z.object({
  params: z.object({
    id: z.string({ required_error: 'ID parameter is required' }),
  }),
});

// Public Endpoints
router.get('/', controller.getAllItems);
router.get('/:id', validate(getItemSchema), controller.getItemById);

// Admin-only / Authenticated Endpoints (For testing simplicity, requiring auth is sufficient)
router.post('/', requireAuth, validate(createItemSchema), controller.createItem);
router.put('/:id', requireAuth, validate(updateItemSchema), controller.updateItem);
router.delete('/:id', requireAuth, validate(getItemSchema), controller.deleteItem);

export default router;
