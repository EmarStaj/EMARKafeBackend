import { Router } from 'express';
import { z } from 'zod';
import { CartController } from './cart.controller';
import { requireAuth } from '../../middlewares/auth.middleware';
import { validate } from '../../middlewares/validate.middleware';

const router = Router();
const controller = new CartController();

// Zod Validation Schemas
const addToCartSchema = z.object({
  body: z.object({
    menu_item_id: z.string({ required_error: 'Menu item ID is required' }).uuid('Invalid menu item ID format'),
    quantity: z.number({ required_error: 'Quantity is required' }).int().positive('Quantity must be positive'),
  }),
});

const updateCartItemSchema = z.object({
  body: z.object({
    quantity: z.number({ required_error: 'Quantity is required' }).int('Quantity must be an integer'),
  }),
  params: z.object({
    id: z.string({ required_error: 'Cart item ID parameter is required' }),
  }),
});

const cartItemIdSchema = z.object({
  params: z.object({
    id: z.string({ required_error: 'Cart item ID parameter is required' }),
  }),
});

// All cart endpoints require authentication
router.use(requireAuth);

router.get('/', controller.getCart);
router.post('/', validate(addToCartSchema), controller.addToCart);
router.put('/:id', validate(updateCartItemSchema), controller.updateCartItem);
router.delete('/:id', validate(cartItemIdSchema), controller.removeFromCart);
router.delete('/', controller.clearCart);

export default router;
