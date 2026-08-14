import { CategoryService } from '../../../modules/category/category.service';
import { CategoryRepository } from '../../../modules/category/category.repository';
import { redis } from '../../../config/redis';

jest.mock('../../../modules/category/category.repository');
jest.mock('../../../config/redis', () => ({
  redis: {
    get: jest.fn(),
    setex: jest.fn(),
    del: jest.fn(),
  },
}));

const MockedCategoryRepository = CategoryRepository as jest.MockedClass<typeof CategoryRepository>;

describe('CategoryService', () => {
  let service: CategoryService;
  let mockCategoryRepo: jest.Mocked<CategoryRepository>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockCategoryRepo = new MockedCategoryRepository() as any;
    service = new CategoryService(mockCategoryRepo);
  });

  describe('getAllCategories', () => {
    it('should return categories from Redis cache if available', async () => {
      const cachedData = [{ id: 'cat-1', name: 'Coffee', is_active: true }];
      (redis.get as jest.Mock).mockResolvedValue(JSON.stringify(cachedData));

      const result = await service.getAllCategories();

      expect(result).toEqual(cachedData);
      expect(redis.get).toHaveBeenCalledWith('category:all');
      expect(mockCategoryRepo.getAllCategories).not.toHaveBeenCalled();
    });

    it('should fetch from repository and cache result if cache is empty', async () => {
      const dbData = [{ id: 'cat-1', name: 'Coffee', is_active: true }];
      (redis.get as jest.Mock).mockResolvedValue(null);
      mockCategoryRepo.getAllCategories = jest.fn().mockResolvedValue(dbData);

      const result = await service.getAllCategories();

      expect(result).toEqual(dbData);
      expect(mockCategoryRepo.getAllCategories).toHaveBeenCalled();
      expect(redis.setex).toHaveBeenCalledWith('category:all', 3600, JSON.stringify(dbData));
    });
  });

  describe('getCategoryById', () => {
    it('should return category from cache if present', async () => {
      const cachedCategory = { id: 'cat-1', name: 'Tea', is_active: true };
      (redis.get as jest.Mock).mockResolvedValue(JSON.stringify(cachedCategory));

      const result = await service.getCategoryById('cat-1');

      expect(result).toEqual(cachedCategory);
      expect(redis.get).toHaveBeenCalledWith('category:item:cat-1');
    });

    it('should throw 404 when category is not found in database', async () => {
      (redis.get as jest.Mock).mockResolvedValue(null);
      mockCategoryRepo.getCategoryById = jest.fn().mockRejectedValue({ code: 'PGRST116' });

      await expect(service.getCategoryById('unknown-id')).rejects.toMatchObject({
        statusCode: 404,
      });
    });
  });

  describe('createCategory & cache invalidation', () => {
    it('should create category and invalidate category:all cache', async () => {
      const newCat = { name: 'Desserts', is_active: true, display_order: 1 };
      mockCategoryRepo.createCategory = jest.fn().mockResolvedValue({ id: 'cat-new', ...newCat });

      const result = await service.createCategory(newCat as any);

      expect(result).toEqual({ id: 'cat-new', ...newCat });
      expect(redis.del).toHaveBeenCalledWith('category:all');
    });
  });

  describe('updateCategory & cache invalidation', () => {
    it('should update category and invalidate item and list cache', async () => {
      mockCategoryRepo.updateCategory = jest.fn().mockResolvedValue({ id: 'cat-1', name: 'Hot Coffee' });

      const result = await service.updateCategory('cat-1', { name: 'Hot Coffee' });

      expect(result).toEqual({ id: 'cat-1', name: 'Hot Coffee' });
      expect(redis.del).toHaveBeenCalledWith('category:all', 'category:item:cat-1');
    });
  });

  describe('deleteCategory & cache invalidation', () => {
    it('should delete category and invalidate cache', async () => {
      (redis.get as jest.Mock).mockResolvedValue(JSON.stringify({ id: 'cat-1' }));
      mockCategoryRepo.deleteCategory = jest.fn().mockResolvedValue(undefined);

      await service.deleteCategory('cat-1');

      expect(mockCategoryRepo.deleteCategory).toHaveBeenCalledWith('cat-1');
      expect(redis.del).toHaveBeenCalledWith('category:all', 'category:item:cat-1');
    });
  });
});
