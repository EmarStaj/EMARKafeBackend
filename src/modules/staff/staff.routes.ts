import { container } from 'tsyringe';
import { Router } from 'express';
import { z } from 'zod';
import { StaffController } from './staff.controller';
import { requireAuth } from '../../middlewares/auth.middleware';
import { requireRole } from '../../middlewares/role.middleware';
import { validate } from '../../middlewares/validate.middleware';
import { fullNameSchema } from '../../utils/sanitize';

const router = Router();
const controller = container.resolve(StaffController);

// Zod Validation Schemas
const createStaffSchema = z.object({
  body: z.object({
    email: z.string({ required_error: 'Email is required' }).email('Invalid email address'),
    password: z.string({ required_error: 'Password is required' }).min(6, 'Password must be at least 6 characters'),
    full_name: fullNameSchema,
    role: z.enum(['barista', 'branch_manager', 'admin'], {
      required_error: 'Role must be one of: barista, branch_manager, admin',
    }),
    branch_id: z.string().uuid('Invalid branch UUID format').nullable().optional().or(z.literal('')),
    phone: z.string().optional(),
  }),
});

const updateStaffSchema = z.object({
  params: z.object({
    id: z.string({ required_error: 'Staff ID is required' }).uuid('Invalid user UUID format'),
  }),
  body: z.object({
    full_name: fullNameSchema.optional(),
    role: z.enum(['barista', 'branch_manager', 'admin']).optional(),
    branch_id: z.string().uuid().nullable().optional().or(z.literal('')),
    phone: z.string().optional(),
  }),
});

const staffIdSchema = z.object({
  params: z.object({
    id: z.string({ required_error: 'Staff ID is required' }).uuid('Invalid user UUID format'),
  }),
});

// All staff endpoints require authentication
router.use(requireAuth);

// 1. Create Staff (Admin can create all roles; Branch Manager can only create Barista)
router.post(
  '/',
  requireRole(['admin', 'branch_manager']),
  validate(createStaffSchema),
  controller.createStaff
);

// 2. List Staff (Admin sees all; Branch Manager sees own branch)
router.get(
  '/',
  requireRole(['admin', 'branch_manager']),
  controller.getStaffList
);

// 3. Get Staff by ID
router.get(
  '/:id',
  requireRole(['admin', 'branch_manager']),
  validate(staffIdSchema),
  controller.getStaffById
);

// 4. Update Staff (Admin only)
router.patch(
  '/:id',
  requireRole(['admin']),
  validate(updateStaffSchema),
  controller.updateStaff
);

// 5. Delete / Deactivate Staff (Admin only)
router.delete(
  '/:id',
  requireRole(['admin']),
  validate(staffIdSchema),
  controller.deleteStaff
);

export default router;
