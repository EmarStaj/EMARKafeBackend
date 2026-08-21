import 'reflect-metadata';
import { MenuService } from '../../../modules/menu/menu.service';
import { MenuRepository } from '../../../modules/menu/menu.repository';
import { redis } from '../../../config/redis';

jest.mock('../../../config/redis', () => ({
  redis: {
    get: jest.fn(),
    setex: jest.fn(),
    del: jest.fn(),
  },
}));

describe('MenuService Unit Tests', () => {
  let menuService: MenuService;
  let mockMenuRepository: jest.Mocked<MenuRepository>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockMenuRepository = {
      getAllItems: jest.fn(),
      getItemById: jest.fn(),
      createItem: jest.fn(),
      updateItem: jest.fn(),
      deleteItem: jest.fn(),
    } as any;

    menuService = new MenuService(mockMenuRepository);
  });

  describe('getAllItems', () => {
    it('should return cached items if available in Redis', async () => {
      const mockItems = [{ id: '1', name: 'Latte', base_price: 50 }];
      (redis.get as jest.Mock).mockResolvedValue(JSON.stringify(mockItems));

      const result = await menuService.getAllItems(true);

      expect(redis.get).toHaveBeenCalledWith('menu:all:true');
      expect(mockMenuRepository.getAllItems).not.toHaveBeenCalled();
      expect(result).toEqual(mockItems);
    });

    it('should fetch from repository and cache in Redis when cache misses', async () => {
      const mockItems = [{ id: '1', name: 'Latte', base_price: 50 }];
      (redis.get as jest.Mock).mockResolvedValue(null);
      mockMenuRepository.getAllItems.mockResolvedValue(mockItems as any);

      const result = await menuService.getAllItems(true);

      expect(mockMenuRepository.getAllItems).toHaveBeenCalledWith(true, undefined, undefined);
      expect(redis.setex).toHaveBeenCalledWith('menu:all:true', 3600, JSON.stringify(mockItems));
      expect(result).toEqual(mockItems);
    });

    it('should bypass cache when search filter is present', async () => {
      const mockItems = [{ id: '1', name: 'Latte', base_price: 50 }];
      mockMenuRepository.getAllItems.mockResolvedValue(mockItems as any);

      const result = await menuService.getAllItems(true, 'latte');

      expect(redis.get).not.toHaveBeenCalled();
      expect(mockMenuRepository.getAllItems).toHaveBeenCalledWith(true, 'latte', undefined);
      expect(result).toEqual(mockItems);
    });
  });

  describe('getItemById', () => {
    it('should return cached item if available', async () => {
      const mockItem = { id: 'p-1', name: 'Espresso', base_price: 40 };
      (redis.get as jest.Mock).mockResolvedValue(JSON.stringify(mockItem));

      const result = await menuService.getItemById('p-1');

      expect(result).toEqual(mockItem);
      expect(mockMenuRepository.getItemById).not.toHaveBeenCalled();
    });

    it('should throw 404 AppError when item is not found (PGRST116)', async () => {
      (redis.get as jest.Mock).mockResolvedValue(null);
      mockMenuRepository.getItemById.mockRejectedValue({ code: 'PGRST116', message: 'Not found' });

      await expect(menuService.getItemById('invalid-id')).rejects.toThrow('Product not found.');
    });
  });

  describe('createItem', () => {
    it('should throw error if base_price is <= 0', async () => {
      await expect(
        menuService.createItem({ name: 'Free Coffee', base_price: 0, category_id: 'cat-1' } as any)
      ).rejects.toThrow('Base price must be greater than 0.');
    });

    it('should create product and invalidate cache', async () => {
      const newProduct = { id: 'new-1', name: 'Mocha', base_price: 60, category_id: 'cat-1' };
      mockMenuRepository.createItem.mockResolvedValue(newProduct as any);

      const result = await menuService.createItem(newProduct as any);

      expect(mockMenuRepository.createItem).toHaveBeenCalledWith(newProduct);
      expect(redis.del).toHaveBeenCalled();
      expect(result).toEqual(newProduct);
    });
  });

  describe('updateItem', () => {
    it('should throw error if updated base_price is <= 0', async () => {
      await expect(
        menuService.updateItem('p-1', { base_price: -10 })
      ).rejects.toThrow('Base price must be greater than 0.');
    });

    it('should update product and invalidate cache', async () => {
      const updatedProduct = { id: 'p-1', name: 'Mocha Max', base_price: 75 };
      mockMenuRepository.updateItem.mockResolvedValue(updatedProduct as any);

      const result = await menuService.updateItem('p-1', { name: 'Mocha Max', base_price: 75 });

      expect(mockMenuRepository.updateItem).toHaveBeenCalledWith('p-1', { name: 'Mocha Max', base_price: 75 });
      expect(redis.del).toHaveBeenCalled();
      expect(result).toEqual(updatedProduct);
    });
  });

  describe('deleteItem', () => {
    it('should verify existence, delete product and invalidate cache', async () => {
      (redis.get as jest.Mock).mockResolvedValue(JSON.stringify({ id: 'p-1' }));
      mockMenuRepository.deleteItem.mockResolvedValue(undefined as any);

      await menuService.deleteItem('p-1');

      expect(mockMenuRepository.deleteItem).toHaveBeenCalledWith('p-1');
      expect(redis.del).toHaveBeenCalled();
    });
  });
});
