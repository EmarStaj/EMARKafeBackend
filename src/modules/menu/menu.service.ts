import { injectable } from 'tsyringe';
import { MenuRepository, Product } from './menu.repository';
import { AppError } from '../../utils/app-error';
import { redis } from '../../config/redis';
import { logger } from '../../config/logger';

@injectable()
export class MenuService {
  private menuRepository: MenuRepository;
  private readonly CACHE_TTL = 3600; // 1 hour

  constructor() {
    this.menuRepository = new MenuRepository();
  }

  async getAllItems(onlyActive = true) {
    const cacheKey = `menu:all:${onlyActive}`;
    try {
      const cached = await redis.get(cacheKey);
      if (cached) {
        return JSON.parse(cached);
      }
    } catch (err) {
      logger.error('Redis cache error on getAllItems:', err);
    }

    try {
      const items = await this.menuRepository.getAllItems(onlyActive);
      
      try {
        await redis.setex(cacheKey, this.CACHE_TTL, JSON.stringify(items));
      } catch (err) {
        logger.error('Redis cache set error on getAllItems:', err);
      }

      return items;
    } catch (error: any) {
      throw new AppError(error.message || 'Failed to retrieve products.', 400);
    }
  }

  async getItemById(id: string) {
    const cacheKey = `menu:item:${id}`;
    try {
      const cached = await redis.get(cacheKey);
      if (cached) {
        return JSON.parse(cached);
      }
    } catch (err) {
      logger.error(`Redis cache error on getItemById for id ${id}:`, err);
    }

    try {
      const item = await this.menuRepository.getItemById(id);
      
      try {
        await redis.setex(cacheKey, this.CACHE_TTL, JSON.stringify(item));
      } catch (err) {
        logger.error(`Redis cache set error on getItemById for id ${id}:`, err);
      }

      return item;
    } catch (error: any) {
      const isNotFound = error.code === 'PGRST116';
      throw new AppError(
        isNotFound ? 'Product not found.' : error.message,
        isNotFound ? 404 : 400
      );
    }
  }

  private async invalidateMenuCache(id?: string) {
    try {
      const keys = ['menu:all:true', 'menu:all:false'];
      if (id) {
        keys.push(`menu:item:${id}`);
      }
      await redis.del(...keys);
    } catch (err) {
      logger.error('Redis cache invalidate error for menu:', err);
    }
  }

  async createItem(product: Product) {
    if (product.base_price <= 0) {
      throw new AppError('Base price must be greater than 0.', 400);
    }
    try {
      const created = await this.menuRepository.createItem(product);
      await this.invalidateMenuCache();
      return created;
    } catch (error: any) {
      throw new AppError(error.message || 'Failed to create product.', 400);
    }
  }

  async updateItem(id: string, product: Partial<Product>) {
    if (product.base_price !== undefined && product.base_price <= 0) {
      throw new AppError('Base price must be greater than 0.', 400);
    }
    try {
      const updated = await this.menuRepository.updateItem(id, product);
      await this.invalidateMenuCache(id);
      return updated;
    } catch (error: any) {
      throw new AppError(error.message || 'Failed to update product.', 400);
    }
  }

  async deleteItem(id: string) {
    try {
      // Validate that product exists
      await this.getItemById(id);
      await this.menuRepository.deleteItem(id);
      await this.invalidateMenuCache(id);
    } catch (error: any) {
      throw new AppError(error.message || 'Failed to delete product.', 400);
    }
  }
}
