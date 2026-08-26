import 'reflect-metadata';
import { CategoryService } from '../category.service';
import { CategoryRepository } from '../category.repository';
import { redis } from '../../../config/redis';
import { logger } from '../../../config/logger';

jest.mock('../category.repository');
jest.mock('../../../config/redis', () => ({
  redis: {
    get: jest.fn(),
    setex: jest.fn(),
    del: jest.fn()
  }
}));
jest.mock('../../../config/logger', () => ({
  logger: {
    error: jest.fn()
  }
}));

describe('CategoryService', () => {
  let service: CategoryService;
  let repo: jest.Mocked<CategoryRepository>;

  beforeEach(() => {
    repo = new CategoryRepository() as jest.Mocked<CategoryRepository>;
    service = new CategoryService(repo);
    (redis.get as jest.Mock).mockResolvedValue(null);
    (redis.setex as jest.Mock).mockResolvedValue('OK');
    (redis.del as jest.Mock).mockResolvedValue(1);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getAllCategories', () => {
    it('should return cached categories if available', async () => {
      const mockCats = [{ id: '1', name: 'Cat 1' }];
      (redis.get as jest.Mock).mockResolvedValue(JSON.stringify(mockCats));

      const result = await service.getAllCategories();
      expect(result).toEqual(mockCats);
      expect(repo.getAllCategories).not.toHaveBeenCalled();
    });

    it('should fetch from repo and cache if not in cache', async () => {
      const mockCats = [{ id: '1', name: 'Cat 1' }];
      repo.getAllCategories.mockResolvedValue(mockCats as any);

      const result = await service.getAllCategories();
      expect(result).toEqual(mockCats);
      expect(repo.getAllCategories).toHaveBeenCalled();
      expect(redis.setex).toHaveBeenCalledWith('category:all', 3600, JSON.stringify(mockCats));
    });

    it('should handle redis get error gracefully', async () => {
      (redis.get as jest.Mock).mockRejectedValue(new Error('redis get error'));
      const mockCats = [{ id: '1', name: 'Cat 1' }];
      repo.getAllCategories.mockResolvedValue(mockCats as any);

      const result = await service.getAllCategories();
      expect(result).toEqual(mockCats);
      expect(logger.error).toHaveBeenCalledWith('Redis cache get error on getAllCategories:', expect.any(Error));
    });

    it('should handle redis set error gracefully', async () => {
      const mockCats = [{ id: '1', name: 'Cat 1' }];
      repo.getAllCategories.mockResolvedValue(mockCats as any);
      (redis.setex as jest.Mock).mockRejectedValue(new Error('redis set error'));

      const result = await service.getAllCategories();
      expect(result).toEqual(mockCats);
      expect(logger.error).toHaveBeenCalledWith('Redis cache set error on getAllCategories:', expect.any(Error));
    });

    it('should throw AppError if repo throws', async () => {
      repo.getAllCategories.mockRejectedValue(new Error('repo error'));
      await expect(service.getAllCategories()).rejects.toThrow('repo error');
    });

    it('should throw AppError with default message if error has no message', async () => {
      repo.getAllCategories.mockRejectedValue({});
      await expect(service.getAllCategories()).rejects.toThrow('Failed to retrieve categories.');
    });
  });

  describe('getCategoryById', () => {
    it('should return cached category if available', async () => {
      const mockCat = { id: '1', name: 'Cat 1' };
      (redis.get as jest.Mock).mockResolvedValue(JSON.stringify(mockCat));

      const result = await service.getCategoryById('1');
      expect(result).toEqual(mockCat);
      expect(repo.getCategoryById).not.toHaveBeenCalled();
    });

    it('should fetch from repo and cache if not in cache', async () => {
      const mockCat = { id: '1', name: 'Cat 1' };
      repo.getCategoryById.mockResolvedValue(mockCat);

      const result = await service.getCategoryById('1');
      expect(result).toEqual(mockCat);
      expect(redis.setex).toHaveBeenCalledWith('category:item:1', 3600, JSON.stringify(mockCat));
    });

    it('should handle redis get error gracefully', async () => {
      (redis.get as jest.Mock).mockRejectedValue(new Error('redis error'));
      const mockCat = { id: '1', name: 'Cat 1' };
      repo.getCategoryById.mockResolvedValue(mockCat);

      const result = await service.getCategoryById('1');
      expect(result).toEqual(mockCat);
      expect(logger.error).toHaveBeenCalledWith('Redis cache get error on getCategoryById for id 1:', expect.any(Error));
    });

    it('should handle redis set error gracefully', async () => {
      const mockCat = { id: '1', name: 'Cat 1' };
      repo.getCategoryById.mockResolvedValue(mockCat);
      (redis.setex as jest.Mock).mockRejectedValue(new Error('redis error'));

      const result = await service.getCategoryById('1');
      expect(result).toEqual(mockCat);
      expect(logger.error).toHaveBeenCalledWith('Redis cache set error on getCategoryById for id 1:', expect.any(Error));
    });

    it('should throw AppError if repo throws PGRST116', async () => {
      repo.getCategoryById.mockRejectedValue({ code: 'PGRST116' });
      await expect(service.getCategoryById('1')).rejects.toThrow('Category not found.');
    });

    it('should throw AppError if repo throws generic error', async () => {
      repo.getCategoryById.mockRejectedValue(new Error('repo error'));
      await expect(service.getCategoryById('1')).rejects.toThrow('repo error');
    });
  });

  describe('createCategory', () => {
    it('should create and invalidate cache', async () => {
      const mockCat = { name: 'Cat 1' };
      repo.createCategory.mockResolvedValue({ id: '1', ...mockCat });

      const result = await service.createCategory(mockCat);
      expect(result).toEqual({ id: '1', ...mockCat });
      expect(redis.del).toHaveBeenCalledWith('category:all');
    });

    it('should throw AppError on creation failure', async () => {
      repo.createCategory.mockRejectedValue(new Error('repo error'));
      await expect(service.createCategory({ name: 'Cat 1' })).rejects.toThrow('repo error');
    });

    it('should throw AppError with default message if error has no message', async () => {
      repo.createCategory.mockRejectedValue({});
      await expect(service.createCategory({ name: 'Cat 1' })).rejects.toThrow('Failed to create category.');
    });

    it('should handle invalidate cache error gracefully', async () => {
      repo.createCategory.mockResolvedValue({ id: '1', name: 'Cat 1' });
      (redis.del as jest.Mock).mockRejectedValue(new Error('redis del error'));

      const result = await service.createCategory({ name: 'Cat 1' });
      expect(result).toBeDefined();
      expect(logger.error).toHaveBeenCalledWith('Redis cache invalidate error for category:', expect.any(Error));
    });
  });

  describe('updateCategory', () => {
    it('should update and invalidate cache', async () => {
      repo.updateCategory.mockResolvedValue({ id: '1', name: 'Cat 2' });

      const result = await service.updateCategory('1', { name: 'Cat 2' });
      expect(result).toEqual({ id: '1', name: 'Cat 2' });
      expect(redis.del).toHaveBeenCalledWith('category:all', 'category:item:1');
    });

    it('should throw AppError on update failure', async () => {
      repo.updateCategory.mockRejectedValue(new Error('repo error'));
      await expect(service.updateCategory('1', { name: 'Cat 2' })).rejects.toThrow('repo error');
    });

    it('should throw AppError with default message if error has no message', async () => {
      repo.updateCategory.mockRejectedValue({});
      await expect(service.updateCategory('1', { name: 'Cat 2' })).rejects.toThrow('Failed to update category.');
    });
  });

  describe('deleteCategory', () => {
    it('should delete and invalidate cache', async () => {
      (redis.get as jest.Mock).mockResolvedValue(JSON.stringify({ id: '1' })); // mock getCategoryById
      repo.deleteCategory.mockResolvedValue(undefined);

      await service.deleteCategory('1');
      expect(repo.deleteCategory).toHaveBeenCalledWith('1');
      expect(redis.del).toHaveBeenCalledWith('category:all', 'category:item:1');
    });

    it('should throw AppError on delete failure', async () => {
      (redis.get as jest.Mock).mockResolvedValue(JSON.stringify({ id: '1' }));
      repo.deleteCategory.mockRejectedValue(new Error('repo error'));

      await expect(service.deleteCategory('1')).rejects.toThrow('repo error');
    });

    it('should throw AppError with default message if error has no message', async () => {
      (redis.get as jest.Mock).mockResolvedValue(JSON.stringify({ id: '1' }));
      repo.deleteCategory.mockRejectedValue({});
      await expect(service.deleteCategory('1')).rejects.toThrow('Failed to delete category.');
    });
  });
});
