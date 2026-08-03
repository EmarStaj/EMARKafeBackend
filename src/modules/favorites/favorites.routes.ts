import { Router } from 'express';
import { z } from 'zod';
import { FavoritesController } from './favorites.controller';
import { requireAuth } from '../../middlewares/auth.middleware';
import { validate } from '../../middlewares/validate.middleware';

const router = Router();
const controller = new FavoritesController();

// Zod Validation Schemas
const addFavoriteSchema = z.object({
  body: z.object({
    product_id: z.string({ required_error: 'Product ID is required' }).uuid('Invalid Product UUID format'),
  }),
});

const removeFavoriteSchema = z.object({
  params: z.object({
    productId: z.string({ required_error: 'Product ID parameter is required' }).uuid('Invalid Product UUID format'),
  }),
});

// All favorites endpoints require authentication
router.use(requireAuth);

router.get('/', controller.getFavorites);
router.post('/', validate(addFavoriteSchema), controller.addFavorite);
router.delete('/:productId', validate(removeFavoriteSchema), controller.removeFavorite);

export default router;
