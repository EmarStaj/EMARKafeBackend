import { OptionService } from '../option.service';

describe('OptionService', () => {
  let service: OptionService;
  let mockOptionRepo: any;
  let mockMenuRepo: any;

  beforeEach(() => {
    mockOptionRepo = {
      getProductOptions: jest.fn(),
      createOption: jest.fn(),
      createOptionValue: jest.fn(),
      deleteOption: jest.fn(),
      deleteOptionValue: jest.fn(),
    };
    mockMenuRepo = {
      getItemById: jest.fn()
    };
    service = new OptionService(mockOptionRepo, mockMenuRepo);
  });

  describe('getProductOptions', () => {
    it('success', async () => {
      mockMenuRepo.getItemById.mockResolvedValue({});
      mockOptionRepo.getProductOptions.mockResolvedValue([]);
      expect(await service.getProductOptions('p1')).toEqual([]);
    });

    it('error not found', async () => {
      mockMenuRepo.getItemById.mockRejectedValue({ code: 'PGRST116' });
      await expect(service.getProductOptions('p1')).rejects.toThrow('Product not found');
    });

    it('error generic', async () => {
      mockMenuRepo.getItemById.mockRejectedValue(new Error('err'));
      await expect(service.getProductOptions('p1')).rejects.toThrow('err');
    });
  });

  describe('createOption', () => {
    it('success', async () => {
      mockMenuRepo.getItemById.mockResolvedValue({});
      mockOptionRepo.createOption.mockResolvedValue({ id: 'o1' });
      expect(await service.createOption({ product_id: 'p1', name: 'n1' })).toEqual({ id: 'o1' });
    });

    it('error not found', async () => {
      mockMenuRepo.getItemById.mockRejectedValue({ statusCode: 404 });
      await expect(service.createOption({ product_id: 'p1', name: 'n1' })).rejects.toThrow('Product not found');
    });
    
    it('error generic', async () => {
      mockMenuRepo.getItemById.mockRejectedValue(new Error('err'));
      await expect(service.createOption({ product_id: 'p1', name: 'n1' })).rejects.toThrow('err');
    });
  });

  describe('createOptionValue', () => {
    it('success', async () => {
      mockOptionRepo.createOptionValue.mockResolvedValue({ id: 'v1' });
      expect(await service.createOptionValue({ option_id: 'o1', label: 'l1' })).toEqual({ id: 'v1' });
    });
    it('error', async () => {
      mockOptionRepo.createOptionValue.mockRejectedValue(new Error('err'));
      await expect(service.createOptionValue({ option_id: 'o1', label: 'l1' })).rejects.toThrow('err');
    });
  });

  describe('deleteOption', () => {
    it('success', async () => {
      mockOptionRepo.deleteOption.mockResolvedValue(null);
      await expect(service.deleteOption('o1')).resolves.toBeUndefined();
    });
    it('error', async () => {
      mockOptionRepo.deleteOption.mockRejectedValue(new Error('err'));
      await expect(service.deleteOption('o1')).rejects.toThrow('err');
    });
  });

  describe('deleteOptionValue', () => {
    it('success', async () => {
      mockOptionRepo.deleteOptionValue.mockResolvedValue(null);
      await expect(service.deleteOptionValue('v1')).resolves.toBeUndefined();
    });
    it('error', async () => {
      mockOptionRepo.deleteOptionValue.mockRejectedValue(new Error('err'));
      await expect(service.deleteOptionValue('v1')).rejects.toThrow('err');
    });
  });
});
