import { CategoryRepository, Category } from './category.repository';
import { AppError } from '../../utils/app-error';

export class CategoryService {
  private categoryRepository: CategoryRepository;

  constructor() {
    this.categoryRepository = new CategoryRepository();
  }

  async getAllCategories() {
    try {
      return await this.categoryRepository.getAllCategories();
    } catch (error: any) {
      throw new AppError(error.message || 'Failed to retrieve categories.', 400);
    }
  }

  async getCategoryById(id: string) {
    try {
      return await this.categoryRepository.getCategoryById(id);
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
      return await this.categoryRepository.createCategory(category);
    } catch (error: any) {
      throw new AppError(error.message || 'Failed to create category.', 400);
    }
  }

  async updateCategory(id: string, category: Partial<Category>) {
    try {
      return await this.categoryRepository.updateCategory(id, category);
    } catch (error: any) {
      throw new AppError(error.message || 'Failed to update category.', 400);
    }
  }

  async deleteCategory(id: string) {
    try {
      // Validate that category exists first
      await this.getCategoryById(id);
      await this.categoryRepository.deleteCategory(id);
    } catch (error: any) {
      throw new AppError(error.message || 'Failed to delete category.', 400);
    }
  }
}
