import { injectable, inject } from 'tsyringe';
import { CategoryRepository, Category } from './category.repository';
import { AppError } from '../../utils/app-error';
import { redis } from '../../config/redis';
import { logger } from '../../config/logger';

@injectable()
export class CategoryService {
  private readonly CACHE_TTL = 3600; // 1 hour

  constructor(
    @inject(CategoryRepository) private categoryRepository: CategoryRepository
  ) {}

  private async invalidateCategoryCache(id?: string) {
    try {
      const keys = ['category:all'];
      if (id) {
        keys.push(`category:item:${id}`);
      }
      await redis.del(...keys);
    } catch (err) {
      logger.error('Redis cache invalidate error for category:', err);
    }
  }

  async getAllCategories() {
    const cacheKey = 'category:all';
    try {
      const cached = await redis.get(cacheKey);
      if (cached) {
        return JSON.parse(cached);
      }
    } catch (err) {
      logger.error('Redis cache get error on getAllCategories:', err);
    }

    try {
      const categories = await this.categoryRepository.getAllCategories();
      try {
        await redis.setex(cacheKey, this.CACHE_TTL, JSON.stringify(categories));
      } catch (err) {
        logger.error('Redis cache set error on getAllCategories:', err);
      }
      return categories;
    } catch (error: any) {
      throw new AppError(error.message || 'Failed to retrieve categories.', 400);
    }
  }

  async getCategoryById(id: string) {
    const cacheKey = `category:item:${id}`;
    try {
      const cached = await redis.get(cacheKey);
      if (cached) {
        return JSON.parse(cached);
      }
    } catch (err) {
      logger.error(`Redis cache get error on getCategoryById for id ${id}:`, err);
    }

    try {
      const category = await this.categoryRepository.getCategoryById(id);
      try {
        await redis.setex(cacheKey, this.CACHE_TTL, JSON.stringify(category));
      } catch (err) {
        logger.error(`Redis cache set error on getCategoryById for id ${id}:`, err);
      }
      return category;
    } catch (error: any) {
      const isNotFound = error.code === 'PGRST116';
      throw new AppError(
        isNotFound ? 'Category not found.' : error.message,
        isNotFound ? 404 : 400
      );
    }
  }

  async createCategory(category: Category) {
    try {
      const created = await this.categoryRepository.createCategory(category);
      await this.invalidateCategoryCache();
      return created;
    } catch (error: any) {
      throw new AppError(error.message || 'Failed to create category.', 400);
    }
  }

  async updateCategory(id: string, category: Partial<Category>) {
    try {
      const updated = await this.categoryRepository.updateCategory(id, category);
      await this.invalidateCategoryCache(id);
      return updated;
    } catch (error: any) {
      throw new AppError(error.message || 'Failed to update category.', 400);
    }
  }

  async deleteCategory(id: string) {
    try {
      // Validate that category exists first
      await this.getCategoryById(id);
      await this.categoryRepository.deleteCategory(id);
      await this.invalidateCategoryCache(id);
    } catch (error: any) {
      throw new AppError(error.message || 'Failed to delete category.', 400);
    }
  }
}
