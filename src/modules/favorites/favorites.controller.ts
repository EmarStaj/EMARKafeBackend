import { Request, Response, NextFunction } from 'express';
import { FavoritesService } from './favorites.service';
import { sendSuccess } from '../../utils/response';
import { AppError } from '../../utils/app-error';

export class FavoritesController {
  private favoritesService: FavoritesService;

  constructor() {
    this.favoritesService = new FavoritesService();
  }

  getFavorites = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const token = req.token;
      if (!token) throw new AppError('Unauthorized', 401);

      const favorites = await this.favoritesService.getFavorites(token);
      sendSuccess(res, favorites, 'Favorites retrieved successfully.');
    } catch (error) {
      next(error);
    }
  };

  addFavorite = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user?.id;
      const token = req.token;
      if (!userId || !token) throw new AppError('Unauthorized', 401);

      const { product_id } = req.body;
      const data = await this.favoritesService.addFavorite(userId, product_id, token);
      sendSuccess(res, data, 'Added to favorites successfully.', 201);
    } catch (error) {
      next(error);
    }
  };

  removeFavorite = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user?.id;
      const token = req.token;
      if (!userId || !token) throw new AppError('Unauthorized', 401);

      const { productId } = req.params;
      await this.favoritesService.removeFavorite(userId, productId, token);
      sendSuccess(res, null, 'Removed from favorites successfully.');
    } catch (error) {
      next(error);
    }
  };
}
