import { MenuRepository, Product } from './menu.repository';
import { AppError } from '../../utils/app-error';

export class MenuService {
  private menuRepository: MenuRepository;

  constructor() {
    this.menuRepository = new MenuRepository();
  }

  async getAllItems(onlyActive = true) {
    try {
      return await this.menuRepository.getAllItems(onlyActive);
    } catch (error: any) {
      throw new AppError(error.message || 'Failed to retrieve products.', 400);
    }
  }

  async getItemById(id: string) {
    try {
      return await this.menuRepository.getItemById(id);
    } catch (error: any) {
      const isNotFound = error.code === 'PGRST116';
      throw new AppError(
        isNotFound ? 'Product not found.' : error.message,
        isNotFound ? 404 : 400
      );
    }
  }

  async createItem(product: Product) {
    if (product.base_price <= 0) {
      throw new AppError('Base price must be greater than 0.', 400);
    }
    try {
      return await this.menuRepository.createItem(product);
    } catch (error: any) {
      throw new AppError(error.message || 'Failed to create product.', 400);
    }
  }

  async updateItem(id: string, product: Partial<Product>) {
    if (product.base_price !== undefined && product.base_price <= 0) {
      throw new AppError('Base price must be greater than 0.', 400);
    }
    try {
      return await this.menuRepository.updateItem(id, product);
    } catch (error: any) {
      throw new AppError(error.message || 'Failed to update product.', 400);
    }
  }

  async deleteItem(id: string) {
    try {
      // Validate that product exists
      await this.getItemById(id);
      await this.menuRepository.deleteItem(id);
    } catch (error: any) {
      throw new AppError(error.message || 'Failed to delete product.', 400);
    }
  }
}
