import { container } from 'tsyringe';
import { Router } from 'express';
import { z } from 'zod';
import { BranchController } from './branch.controller';
import { requireAuth } from '../../middlewares/auth.middleware';
import { requireRole } from '../../middlewares/role.middleware';
import { validate } from '../../middlewares/validate.middleware';

const router = Router();
const controller = container.resolve(BranchController);
// Zod Validation Schemas
const createBranchSchema = z.object({
  body: z.object({
    name: z.string({ required_error: 'Branch name is required' }).min(2, 'Name must be at least 2 characters'),
    address: z.string().optional(),
    lat: z.number().optional(),
    lng: z.number().optional(),
    opening_hours: z.any().optional(),
    is_active: z.boolean().optional(),
  }),
});

const updateBranchSchema = z.object({
  body: z.object({
    name: z.string().min(2).optional(),
    address: z.string().optional(),
    lat: z.number().optional(),
    lng: z.number().optional(),
    opening_hours: z.any().optional(),
    is_active: z.boolean().optional(),
  }),
  params: z.object({
    id: z.string({ required_error: 'ID parameter is required' }).uuid('Invalid Branch UUID format'),
  }),
});

const branchIdSchema = z.object({
  params: z.object({
    id: z.string({ required_error: 'ID parameter is required' }).uuid('Invalid Branch UUID format'),
  }),
});

const getBranchProductsSchema = z.object({
  params: z.object({
    branchId: z.string({ required_error: 'Branch ID parameter is required' }).uuid('Invalid Branch UUID format'),
  }),
});

const updateProductAvailabilitySchema = z.object({
  params: z.object({
    branchId: z.string({ required_error: 'Branch ID parameter is required' }).uuid('Invalid Branch UUID format'),
    productId: z.string({ required_error: 'Product ID parameter is required' }).uuid('Invalid Product UUID format'),
  }),
  body: z.object({
    is_available: z.boolean({ required_error: 'is_available boolean status is required' }),
  }),
});

// Public Endpoints
router.get('/', controller.getAllBranches);
router.get('/:id', validate(branchIdSchema), controller.getBranchById);
router.get('/:branchId/products', validate(getBranchProductsSchema), controller.getBranchProducts);

// Authenticated stock management (Baristas, Managers, Admins)
router.put(
  '/:branchId/products/:productId',
  requireAuth,
  requireRole(['barista', 'branch_manager', 'admin']),
  validate(updateProductAvailabilitySchema),
  controller.updateBranchProductAvailability
);

// Admin-only CRUD operations
router.post('/', requireAuth, requireRole(['admin']), validate(createBranchSchema), controller.createBranch);
router.put('/:id', requireAuth, requireRole(['admin', 'branch_manager']), validate(updateBranchSchema), controller.updateBranch);
router.delete('/:id', requireAuth, requireRole(['admin']), validate(branchIdSchema), controller.deleteBranch);

export default router;
