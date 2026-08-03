import { FavoritesRepository } from './favorites.repository';
import { AppError } from '../../utils/app-error';

export class FavoritesService {
  private favoritesRepository: FavoritesRepository;

  constructor() {
    this.favoritesRepository = new FavoritesRepository();
  }

  async getFavorites(token: string) {
    try {
      return await this.favoritesRepository.getFavorites(token);
    } catch (error: any) {
      throw new AppError(error.message || 'Failed to retrieve favorites.', 400);
    }
  }

  async addFavorite(userId: string, menuItemId: string, token: string) {
    try {
      // Prevent duplication
      const existing = await this.favoritesRepository.findFavorite(userId, menuItemId, token);
      if (existing) {
        return existing; // Already in favorites, return gracefully
      }
      return await this.favoritesRepository.addFavorite(userId, menuItemId, token);
    } catch (error: any) {
      throw new AppError(error.message || 'Failed to add item to favorites.', 400);
    }
  }

  async removeFavorite(userId: string, menuItemId: string, token: string) {
    try {
      await this.favoritesRepository.removeFavorite(userId, menuItemId, token);
    } catch (error: any) {
      throw new AppError(error.message || 'Failed to remove item from favorites.', 400);
    }
  }
}
