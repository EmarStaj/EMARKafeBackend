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
    menu_item_id: z.string({ required_error: 'Menu item ID is required' }).uuid('Invalid UUID format'),
  }),
});

const removeFavoriteSchema = z.object({
  params: z.object({
    menuItemId: z.string({ required_error: 'Menu item ID parameter is required' }).uuid('Invalid UUID format'),
  }),
});

// All favorites endpoints require authentication
router.use(requireAuth);

router.get('/', controller.getFavorites);
router.post('/', validate(addFavoriteSchema), controller.addFavorite);
router.delete('/:menuItemId', validate(removeFavoriteSchema), controller.removeFavorite);

export default router;
