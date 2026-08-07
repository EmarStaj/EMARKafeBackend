import { injectable } from 'tsyringe';
import { OptionRepository, ProductOption, ProductOptionValue } from './option.repository';
import { MenuRepository } from '../menu/menu.repository';
import { AppError } from '../../utils/app-error';

@injectable()
export class OptionService {
  private optionRepository: OptionRepository;
  private menuRepository: MenuRepository;

  constructor() {
    this.optionRepository = new OptionRepository();
    this.menuRepository = new MenuRepository();
  }

  async getProductOptions(productId: string) {
    try {
      // Validate that product exists
      await this.menuRepository.getItemById(productId);
      return await this.optionRepository.getProductOptions(productId);
    } catch (error: any) {
      const isNotFound = error.code === 'PGRST116' || error.statusCode === 404;
      throw new AppError(
        isNotFound ? 'Product not found. Please verify the product UUID.' : error.message,
        isNotFound ? 404 : 400
      );
    }
  }

  async createOption(option: ProductOption) {
    try {
      // Validate that product exists
      await this.menuRepository.getItemById(option.product_id);
      return await this.optionRepository.createOption(option);
    } catch (error: any) {
      const isNotFound = error.code === 'PGRST116' || error.statusCode === 404;
      throw new AppError(
        isNotFound ? 'Product not found. Please verify the product UUID.' : error.message,
        isNotFound ? 404 : 400
      );
    }
  }

  async createOptionValue(value: ProductOptionValue) {
    try {
      return await this.optionRepository.createOptionValue(value);
    } catch (error: any) {
      throw new AppError(error.message || 'Failed to add option value.', 400);
    }
  }

  async deleteOption(optionId: string) {
    try {
      await this.optionRepository.deleteOption(optionId);
    } catch (error: any) {
      throw new AppError(error.message || 'Failed to delete product option.', 400);
    }
  }

  async deleteOptionValue(valueId: string) {
    try {
      await this.optionRepository.deleteOptionValue(valueId);
    } catch (error: any) {
      throw new AppError(error.message || 'Failed to delete option value.', 400);
    }
  }
}
