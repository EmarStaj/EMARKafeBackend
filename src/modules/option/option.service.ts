import { OptionRepository, ProductOption, ProductOptionValue } from './option.repository';
import { MenuRepository } from '../menu/menu.repository';
import { AppError } from '../../utils/app-error';

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
      const product = await this.menuRepository.getItemById(productId);
      if (!product) {
        throw new AppError('Product not found.', 404);
      }
      return await this.optionRepository.getProductOptions(productId);
    } catch (error: any) {
      throw new AppError(error.message || 'Failed to retrieve product options.', 400);
    }
  }

  async createOption(option: ProductOption) {
    try {
      // Validate that product exists
      const product = await this.menuRepository.getItemById(option.product_id);
      if (!product) {
        throw new AppError('Product not found.', 404);
      }
      return await this.optionRepository.createOption(option);
    } catch (error: any) {
      throw new AppError(error.message || 'Failed to create product option.', 400);
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
