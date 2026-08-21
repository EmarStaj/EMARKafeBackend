import 'reflect-metadata';
import { OptionService } from '../../../modules/option/option.service';
import { OptionRepository } from '../../../modules/option/option.repository';
import { MenuRepository } from '../../../modules/menu/menu.repository';

describe('OptionService Unit Tests', () => {
  let optionService: OptionService;
  let mockOptionRepo: jest.Mocked<OptionRepository>;
  let mockMenuRepo: jest.Mocked<MenuRepository>;

  beforeEach(() => {
    mockOptionRepo = {
      getProductOptions: jest.fn(),
      createOption: jest.fn(),
      createOptionValue: jest.fn(),
      deleteOption: jest.fn(),
      deleteOptionValue: jest.fn(),
    } as any;

    mockMenuRepo = {
      getItemById: jest.fn(),
    } as any;

    optionService = new OptionService(mockOptionRepo, mockMenuRepo);
  });

  describe('getProductOptions', () => {
    it('should return options for valid product', async () => {
      mockMenuRepo.getItemById.mockResolvedValue({ id: 'p-1' } as any);
      const mockOptions = [{ id: 'opt-1', name: 'Süt', product_id: 'p-1' }];
      mockOptionRepo.getProductOptions.mockResolvedValue(mockOptions as any);

      const result = await optionService.getProductOptions('p-1');
      expect(result).toEqual(mockOptions);
      expect(mockMenuRepo.getItemById).toHaveBeenCalledWith('p-1');
    });

    it('should throw 404 if product does not exist', async () => {
      mockMenuRepo.getItemById.mockRejectedValue({ code: 'PGRST116' });

      await expect(optionService.getProductOptions('non-existent')).rejects.toThrow(
        'Product not found. Please verify the product UUID.'
      );
    });
  });

  describe('createOption & createOptionValue', () => {
    it('should create option for existing product', async () => {
      mockMenuRepo.getItemById.mockResolvedValue({ id: 'p-1' } as any);
      const opt = { id: 'opt-1', name: 'Boyut', product_id: 'p-1' };
      mockOptionRepo.createOption.mockResolvedValue(opt as any);

      const result = await optionService.createOption(opt as any);
      expect(result).toEqual(opt);
    });

    it('should create option value', async () => {
      const val = { id: 'val-1', option_id: 'opt-1', name: 'Büyük', price_modifier: 10 };
      mockOptionRepo.createOptionValue.mockResolvedValue(val as any);

      const result = await optionService.createOptionValue(val as any);
      expect(result).toEqual(val);
    });
  });

  describe('deleteOption & deleteOptionValue', () => {
    it('should delete option', async () => {
      mockOptionRepo.deleteOption.mockResolvedValue(undefined as any);
      await expect(optionService.deleteOption('opt-1')).resolves.toBeUndefined();
    });

    it('should delete option value', async () => {
      mockOptionRepo.deleteOptionValue.mockResolvedValue(undefined as any);
      await expect(optionService.deleteOptionValue('val-1')).resolves.toBeUndefined();
    });
  });
});
