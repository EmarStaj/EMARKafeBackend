import { Router } from 'express';
import { z } from 'zod';
import { CategoryController } from './category.controller';
import { requireAuth } from '../../middlewares/auth.middleware';
import { requireRole } from '../../middlewares/role.middleware';
import { validate } from '../../middlewares/validate.middleware';

const router = Router();
const controller = new CategoryController();

// Zod Validation Schemas
const createCategorySchema = z.object({
  body: z.object({
    name: z.string({ required_error: 'Category name is required' }).min(2, 'Name must be at least 2 characters'),
    sort_order: z.number().int().optional(),
  }),
});

const updateCategorySchema = z.object({
  body: z.object({
    name: z.string().min(2).optional(),
    sort_order: z.number().int().optional(),
  }),
  params: z.object({
    id: z.string({ required_error: 'ID parameter is required' }).uuid('Invalid Category UUID format'),
  }),
});

const categoryIdSchema = z.object({
  params: z.object({
    id: z.string({ required_error: 'ID parameter is required' }).uuid('Invalid Category UUID format'),
  }),
});

// Public Endpoints
router.get('/', controller.getAllCategories);
router.get('/:id', validate(categoryIdSchema), controller.getCategoryById);

// Admin-only Endpoints
router.post('/', requireAuth, requireRole(['admin']), validate(createCategorySchema), controller.createCategory);
router.put('/:id', requireAuth, requireRole(['admin']), validate(updateCategorySchema), controller.updateCategory);
router.delete('/:id', requireAuth, requireRole(['admin']), validate(categoryIdSchema), controller.deleteCategory);

export default router;
