import { MenuRepository, MenuItem } from './menu.repository';
import { AppError } from '../../utils/app-error';

export class MenuService {
  private menuRepository: MenuRepository;

  constructor() {
    this.menuRepository = new MenuRepository();
  }

  async getAllItems() {
    try {
      return await this.menuRepository.getAllItems();
    } catch (error: any) {
      throw new AppError(error.message || 'Failed to retrieve menu items', 400);
    }
  }

  async getItemById(id: string) {
    try {
      return await this.menuRepository.getItemById(id);
    } catch (error: any) {
      const isNotFound = error.code === 'PGRST116';
      throw new AppError(
        isNotFound ? 'Menu item not found' : error.message,
        isNotFound ? 404 : 400
      );
    }
  }

  async createItem(item: MenuItem) {
    if (item.price <= 0) {
      throw new AppError('Price must be greater than 0', 400);
    }
    try {
      return await this.menuRepository.createItem(item);
    } catch (error: any) {
      throw new AppError(error.message || 'Failed to create menu item', 400);
    }
  }

  async updateItem(id: string, item: Partial<MenuItem>) {
    if (item.price !== undefined && item.price <= 0) {
      throw new AppError('Price must be greater than 0', 400);
    }
    try {
      return await this.menuRepository.updateItem(id, item);
    } catch (error: any) {
      throw new AppError(error.message || 'Failed to update menu item', 400);
    }
  }

  async deleteItem(id: string) {
    try {
      // Check if item exists first
      await this.getItemById(id);
      await this.menuRepository.deleteItem(id);
    } catch (error: any) {
      throw new AppError(error.message || 'Failed to delete menu item', 400);
    }
  }
}
