import { MenuService } from '../menu.service';
import { MenuRepository } from '../menu.repository';
import { AppError } from '../../../utils/app-error';
import { redis } from '../../../config/redis';
import { logger } from '../../../config/logger';

jest.mock('../../../config/redis', () => ({
  redis: {
    get: jest.fn(),
    setex: jest.fn(),
    del: jest.fn(),
  }
}));

jest.mock('../../../config/logger', () => ({
  logger: { info: jest.fn(), error: jest.fn() }
}));

describe('MenuService', () => {
  let service: MenuService;
  let repo: jest.Mocked<MenuRepository>;

  beforeEach(() => {
    repo = {
      getAllItems: jest.fn(),
      getItemById: jest.fn(),
      createItem: jest.fn(),
      updateItem: jest.fn(),
      deleteItem: jest.fn(),
    } as any;
    service = new MenuService(repo);
    jest.clearAllMocks();
  });

  describe('getAllItems', () => {
    it('should return from cache if available and no filters', async () => {
      (redis.get as jest.Mock).mockResolvedValue(JSON.stringify([{ id: '1' }]));
      const res = await service.getAllItems(true);
      expect(res).toEqual([{ id: '1' }]);
      expect(repo.getAllItems).not.toHaveBeenCalled();
    });

    it('should query repo and cache if not in cache and no filters', async () => {
      (redis.get as jest.Mock).mockResolvedValue(null);
      repo.getAllItems.mockResolvedValue([{ id: '1' }] as any);
      
      const res = await service.getAllItems(true);
      
      expect(res).toEqual([{ id: '1' }]);
      expect(repo.getAllItems).toHaveBeenCalledWith(true, undefined, undefined);
      expect(redis.setex).toHaveBeenCalledWith('menu:all:true', 3600, JSON.stringify([{ id: '1' }]));
    });

    it('should not use cache if filters provided', async () => {
      repo.getAllItems.mockResolvedValue([{ id: '1' }] as any);
      const res = await service.getAllItems(true, 'search');
      expect(res).toEqual([{ id: '1' }]);
      expect(redis.get).not.toHaveBeenCalled();
      expect(redis.setex).not.toHaveBeenCalled();
    });

    it('should handle redis errors gracefully', async () => {
      (redis.get as jest.Mock).mockRejectedValue(new Error('redis get err'));
      (redis.setex as jest.Mock).mockRejectedValue(new Error('redis set err'));
      repo.getAllItems.mockResolvedValue([{ id: '1' }] as any);

      const res = await service.getAllItems(true);
      expect(res).toEqual([{ id: '1' }]);
      expect(logger.error).toHaveBeenCalledTimes(2);
    });

    it('should throw AppError on repo failure', async () => {
      (redis.get as jest.Mock).mockResolvedValue(null);
      repo.getAllItems.mockRejectedValue(new Error('repo err'));
      await expect(service.getAllItems(true)).rejects.toThrow(AppError);
    });
  });

  describe('getItemById', () => {
    it('should return from cache if available', async () => {
      (redis.get as jest.Mock).mockResolvedValue(JSON.stringify({ id: '1' }));
      const res = await service.getItemById('1');
      expect(res).toEqual({ id: '1' });
      expect(repo.getItemById).not.toHaveBeenCalled();
    });

    it('should query repo and cache if not in cache', async () => {
      (redis.get as jest.Mock).mockResolvedValue(null);
      repo.getItemById.mockResolvedValue({ id: '1' } as any);
      const res = await service.getItemById('1');
      expect(res).toEqual({ id: '1' });
      expect(redis.setex).toHaveBeenCalled();
    });

    it('should handle redis errors gracefully', async () => {
      (redis.get as jest.Mock).mockRejectedValue(new Error('redis get err'));
      (redis.setex as jest.Mock).mockRejectedValue(new Error('redis set err'));
      repo.getItemById.mockResolvedValue({ id: '1' } as any);

      const res = await service.getItemById('1');
      expect(res).toEqual({ id: '1' });
      expect(logger.error).toHaveBeenCalledTimes(2);
    });

    it('should throw 404 AppError if product not found', async () => {
      (redis.get as jest.Mock).mockResolvedValue(null);
      const err = new Error('not found') as any;
      err.code = 'PGRST116';
      repo.getItemById.mockRejectedValue(err);
      await expect(service.getItemById('1')).rejects.toThrow(AppError);
      try {
        await service.getItemById('1');
      } catch (e: any) {
        expect(e.statusCode).toBe(404);
      }
    });
    
    it('should throw 400 AppError on other repo errors', async () => {
      (redis.get as jest.Mock).mockResolvedValue(null);
      repo.getItemById.mockRejectedValue(new Error('repo err'));
      await expect(service.getItemById('1')).rejects.toThrow(AppError);
    });
  });

  describe('createItem', () => {
    it('should throw if base_price <= 0', async () => {
      await expect(service.createItem({ base_price: 0 } as any)).rejects.toThrow(AppError);
    });

    it('should create item and invalidate cache', async () => {
      repo.createItem.mockResolvedValue({ id: '1' } as any);
      const res = await service.createItem({ base_price: 10 } as any);
      expect(res).toEqual({ id: '1' });
      expect(redis.del).toHaveBeenCalled();
    });

    it('should throw AppError on repo failure', async () => {
      repo.createItem.mockRejectedValue(new Error('repo err'));
      await expect(service.createItem({ base_price: 10 } as any)).rejects.toThrow(AppError);
    });

    it('should handle redis del error gracefully', async () => {
      repo.createItem.mockResolvedValue({ id: '1' } as any);
      (redis.del as jest.Mock).mockRejectedValue(new Error('redis del err'));
      const res = await service.createItem({ base_price: 10 } as any);
      expect(res).toEqual({ id: '1' });
      expect(logger.error).toHaveBeenCalled();
    });
  });

  describe('updateItem', () => {
    it('should throw if base_price <= 0', async () => {
      await expect(service.updateItem('1', { base_price: 0 })).rejects.toThrow(AppError);
    });

    it('should update item and invalidate cache', async () => {
      repo.updateItem.mockResolvedValue({ id: '1' } as any);
      const res = await service.updateItem('1', { base_price: 10 });
      expect(res).toEqual({ id: '1' });
      expect(redis.del).toHaveBeenCalled();
    });

    it('should throw AppError on repo failure', async () => {
      repo.updateItem.mockRejectedValue(new Error('repo err'));
      await expect(service.updateItem('1', { base_price: 10 })).rejects.toThrow(AppError);
    });
  });

  describe('deleteItem', () => {
    it('should throw if item not found', async () => {
      const err = new Error('not found') as any;
      err.code = 'PGRST116';
      repo.getItemById.mockRejectedValue(err);
      await expect(service.deleteItem('1')).rejects.toThrow(AppError);
    });

    it('should delete item and invalidate cache', async () => {
      repo.getItemById.mockResolvedValue({ id: '1' } as any);
      repo.deleteItem.mockResolvedValue(undefined);
      await service.deleteItem('1');
      expect(redis.del).toHaveBeenCalled();
      expect(repo.deleteItem).toHaveBeenCalledWith('1');
    });

    it('should throw AppError on repo failure', async () => {
      repo.getItemById.mockResolvedValue({ id: '1' } as any);
      repo.deleteItem.mockRejectedValue(new Error('repo err'));
      await expect(service.deleteItem('1')).rejects.toThrow(AppError);
    });
  });
});
