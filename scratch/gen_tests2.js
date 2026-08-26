const fs = require('fs');
const path = require('path');

const baseDir = '/home/tuncay/Projects/Kafe/EMARKafe-backend/src/modules';

const files = {
  'favorites/__tests__/favorites.controller.test.ts': `import 'reflect-metadata';
import { FavoritesController } from '../favorites.controller';
import { FavoritesService } from '../favorites.service';
import { Request, Response } from 'express';

describe('FavoritesController', () => {
  let controller: FavoritesController;
  let service: jest.Mocked<FavoritesService>;
  let req: Partial<Request>;
  let res: Partial<Response>;
  let next: jest.Mock;

  beforeEach(() => {
    service = { getFavorites: jest.fn(), addFavorite: jest.fn(), removeFavorite: jest.fn() } as any;
    controller = new FavoritesController(service as any);
    req = { user: { id: 'u1' }, token: 't1', body: {}, params: {} } as any;
    res = { status: jest.fn().mockReturnThis(), json: jest.fn() } as any;
    next = jest.fn();
  });

  it('getFavorites should work', async () => {
    service.getFavorites.mockResolvedValue([{ id: 'f1' }] as any);
    await controller.getFavorites(req as Request, res as Response, next);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ data: [{ id: 'f1' }] }));
  });

  it('getFavorites should throw 401 if no user', async () => {
    req.user = undefined;
    await controller.getFavorites(req as Request, res as Response, next);
    expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 401 }));
  });

  it('addFavorite should work for new', async () => {
    req.body.product_id = 'p1';
    service.addFavorite.mockResolvedValue({ data: { id: 'f1' }, isNew: true } as any);
    await controller.addFavorite(req as Request, res as Response, next);
    expect(res.status).toHaveBeenCalledWith(201);
  });

  it('addFavorite should work for existing', async () => {
    req.body.product_id = 'p1';
    service.addFavorite.mockResolvedValue({ data: { id: 'f1' }, isNew: false } as any);
    await controller.addFavorite(req as Request, res as Response, next);
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('addFavorite should throw 401 if no token', async () => {
    req.token = undefined;
    await controller.addFavorite(req as Request, res as Response, next);
    expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 401 }));
  });

  it('removeFavorite should work', async () => {
    req.params.productId = 'p1';
    service.removeFavorite.mockResolvedValue();
    await controller.removeFavorite(req as Request, res as Response, next);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: 'Removed from favorites successfully.' }));
  });

  it('removeFavorite should throw 401 if no user', async () => {
    req.user = undefined;
    await controller.removeFavorite(req as Request, res as Response, next);
    expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 401 }));
  });
});
`,
  'favorites/__tests__/favorites.service.test.ts': `import 'reflect-metadata';
import { FavoritesService } from '../favorites.service';
import { FavoritesRepository } from '../favorites.repository';

describe('FavoritesService', () => {
  let service: FavoritesService;
  let repo: jest.Mocked<FavoritesRepository>;

  beforeEach(() => {
    repo = { getFavorites: jest.fn(), findFavorite: jest.fn(), addFavorite: jest.fn(), removeFavorite: jest.fn() } as any;
    service = new FavoritesService(repo as any);
  });

  it('getFavorites should return list', async () => {
    repo.getFavorites.mockResolvedValue([{ id: '1' }] as any);
    const res = await service.getFavorites('t1', 'u1');
    expect(res).toEqual([{ id: '1' }]);
  });

  it('getFavorites should throw error', async () => {
    repo.getFavorites.mockRejectedValue(new Error('err'));
    await expect(service.getFavorites('t1', 'u1')).rejects.toThrow('err');
  });

  it('addFavorite should return existing', async () => {
    repo.findFavorite.mockResolvedValue({ id: '1' } as any);
    const res = await service.addFavorite('u1', 'p1', 't1');
    expect(res).toEqual({ data: { id: '1' }, isNew: false });
  });

  it('addFavorite should add new', async () => {
    repo.findFavorite.mockResolvedValue(null);
    repo.addFavorite.mockResolvedValue({ id: '2' } as any);
    const res = await service.addFavorite('u1', 'p1', 't1');
    expect(res).toEqual({ data: { id: '2' }, isNew: true });
  });
  
  it('addFavorite should throw error', async () => {
    repo.findFavorite.mockRejectedValue({});
    await expect(service.addFavorite('u1', 'p1', 't1')).rejects.toThrow('Failed to add item to favorites.');
  });

  it('removeFavorite should work', async () => {
    repo.removeFavorite.mockResolvedValue(undefined as any);
    await service.removeFavorite('u1', 'p1', 't1');
    expect(repo.removeFavorite).toHaveBeenCalledWith('u1', 'p1', 't1');
  });

  it('removeFavorite should throw error', async () => {
    repo.removeFavorite.mockRejectedValue(new Error('err2'));
    await expect(service.removeFavorite('u1', 'p1', 't1')).rejects.toThrow('err2');
  });
});
`,
  'favorites/__tests__/favorites.repository.test.ts': `import { FavoritesRepository } from '../favorites.repository';
import { supabaseAdmin, mockQueryBuilder, getSupabaseForUser } from '../../../__mocks__/supabase';

jest.mock('../../../config/supabase', () => ({
  supabaseAdmin: require('../../../__mocks__/supabase').supabaseAdmin,
  getSupabaseForUser: require('../../../__mocks__/supabase').getSupabaseForUser,
}));

describe('FavoritesRepository', () => {
  let repo: FavoritesRepository;

  beforeEach(() => {
    repo = new FavoritesRepository();
    jest.clearAllMocks();
  });

  it('getFavorites should work with userId', async () => {
    const mockQuery = mockQueryBuilder([{ id: '1' }]);
    (getSupabaseForUser as jest.Mock).mockReturnValue({ from: jest.fn().mockReturnValue(mockQuery) });
    const res = await repo.getFavorites('t1', 'u1');
    expect(res).toEqual([{ id: '1' }]);
  });

  it('getFavorites should work without userId', async () => {
    const mockQuery = mockQueryBuilder([{ id: '1' }]);
    (getSupabaseForUser as jest.Mock).mockReturnValue({ from: jest.fn().mockReturnValue(mockQuery) });
    const res = await repo.getFavorites('t1');
    expect(res).toEqual([{ id: '1' }]);
  });

  it('getFavorites should throw error on failure', async () => {
    const mockQuery = mockQueryBuilder();
    mockQuery.eq.mockResolvedValue({ data: null, error: new Error('err') });
    (getSupabaseForUser as jest.Mock).mockReturnValue({ from: jest.fn().mockReturnValue(mockQuery) });
    await expect(repo.getFavorites('t1', 'u1')).rejects.toThrow('err');
  });

  it('findFavorite should work', async () => {
    const res = await repo.findFavorite('u1', 'p1', 't1');
    expect(res).toBeDefined();
  });

  it('findFavorite should throw error', async () => {
    const mockQuery = mockQueryBuilder();
    mockQuery.maybeSingle.mockResolvedValue({ data: null, error: new Error('err') });
    (getSupabaseForUser as jest.Mock).mockReturnValue({ from: jest.fn().mockReturnValue(mockQuery) });
    await expect(repo.findFavorite('u1', 'p1', 't1')).rejects.toThrow('err');
  });

  it('addFavorite should work', async () => {
    const res = await repo.addFavorite('u1', 'p1', 't1');
    expect(res).toBeDefined();
  });

  it('addFavorite should throw', async () => {
    const mockQuery = mockQueryBuilder();
    mockQuery.single.mockResolvedValue({ data: null, error: new Error('err') });
    (supabaseAdmin.from as jest.Mock).mockReturnValue(mockQuery);
    await expect(repo.addFavorite('u1', 'p1', 't1')).rejects.toThrow('err');
  });

  it('removeFavorite should work', async () => {
    const mockQuery = mockQueryBuilder();
    mockQuery.eq.mockResolvedValue({ data: null, error: null });
    (supabaseAdmin.from as jest.Mock).mockReturnValue(mockQuery);
    await repo.removeFavorite('u1', 'p1', 't1');
    expect(supabaseAdmin.from).toHaveBeenCalledWith('favorites');
  });

  it('removeFavorite should throw', async () => {
    const mockQuery = mockQueryBuilder();
    mockQuery.eq.mockResolvedValue({ data: null, error: new Error('err') });
    (supabaseAdmin.from as jest.Mock).mockReturnValue(mockQuery);
    await expect(repo.removeFavorite('u1', 'p1', 't1')).rejects.toThrow('err');
  });
});
`,

  'loyalty/__tests__/loyalty.controller.test.ts': `import 'reflect-metadata';
import { LoyaltyController } from '../loyalty.controller';
import { LoyaltyService } from '../loyalty.service';
import { Request, Response } from 'express';

describe('LoyaltyController', () => {
  let controller: LoyaltyController;
  let service: jest.Mocked<LoyaltyService>;
  let req: Partial<Request>;
  let res: Partial<Response>;
  let next: jest.Mock;

  beforeEach(() => {
    service = { getLoyaltyProgress: jest.fn(), getLoyaltyRewards: jest.fn(), getLoyaltySummary: jest.fn() } as any;
    controller = new LoyaltyController(service as any);
    req = { user: { id: 'u1' } } as any;
    res = { status: jest.fn().mockReturnThis(), json: jest.fn() } as any;
    next = jest.fn();
  });

  it('getLoyaltyProgress works', async () => {
    service.getLoyaltyProgress.mockResolvedValue([{ id: '1' }] as any);
    await controller.getLoyaltyProgress(req as Request, res as Response, next);
    expect(res.json).toHaveBeenCalled();
  });

  it('getLoyaltyProgress throws 401', async () => {
    req.user = undefined;
    await controller.getLoyaltyProgress(req as Request, res as Response, next);
    expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 401 }));
  });

  it('getLoyaltyRewards works', async () => {
    service.getLoyaltyRewards.mockResolvedValue([{ id: '1' }] as any);
    await controller.getLoyaltyRewards(req as Request, res as Response, next);
    expect(res.json).toHaveBeenCalled();
  });
  it('getLoyaltyRewards throws 401', async () => {
    req.user = undefined;
    await controller.getLoyaltyRewards(req as Request, res as Response, next);
    expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 401 }));
  });

  it('getLoyaltySummary works', async () => {
    service.getLoyaltySummary.mockResolvedValue({ progress: [], rewards: [] } as any);
    await controller.getLoyaltySummary(req as Request, res as Response, next);
    expect(res.json).toHaveBeenCalled();
  });
  it('getLoyaltySummary throws 401', async () => {
    req.user = undefined;
    await controller.getLoyaltySummary(req as Request, res as Response, next);
    expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 401 }));
  });
});
`,
  'loyalty/__tests__/loyalty.service.test.ts': `import 'reflect-metadata';
import { LoyaltyService } from '../loyalty.service';
import { LoyaltyRepository } from '../loyalty.repository';
import { NotificationService } from '../../notification/notification.service';

describe('LoyaltyService', () => {
  let service: LoyaltyService;
  let repo: jest.Mocked<LoyaltyRepository>;
  let notif: jest.Mocked<NotificationService>;

  beforeEach(() => {
    repo = { getLoyaltyProgress: jest.fn(), getLoyaltyRewards: jest.fn(), findProgress: jest.fn(), saveProgress: jest.fn(), createReward: jest.fn() } as any;
    notif = { sendToUser: jest.fn() } as any;
    service = new LoyaltyService(repo as any, notif as any);
  });

  it('getLoyaltyProgress works', async () => {
    repo.getLoyaltyProgress.mockResolvedValue([] as any);
    const r = await service.getLoyaltyProgress('u1');
    expect(r).toEqual([]);
  });
  it('getLoyaltyProgress throws', async () => {
    repo.getLoyaltyProgress.mockRejectedValue(new Error('err'));
    await expect(service.getLoyaltyProgress('u1')).rejects.toThrow('err');
  });

  it('getLoyaltyRewards works', async () => {
    repo.getLoyaltyRewards.mockResolvedValue([] as any);
    const r = await service.getLoyaltyRewards('u1');
    expect(r).toEqual([]);
  });
  it('getLoyaltyRewards throws', async () => {
    repo.getLoyaltyRewards.mockRejectedValue({});
    await expect(service.getLoyaltyRewards('u1')).rejects.toThrow('Failed to retrieve loyalty rewards.');
  });

  it('getLoyaltySummary works', async () => {
    repo.getLoyaltyProgress.mockResolvedValue([] as any);
    repo.getLoyaltyRewards.mockResolvedValue([] as any);
    const r = await service.getLoyaltySummary('u1');
    expect(r).toEqual({ progress: [], rewards: [] });
  });

  it('addStampsForProduct works quantity 0', async () => {
    const r = await service.addStampsForProduct('u1', 'c1', 0);
    expect(r).toEqual({ stampsAdded: 0, currentStamps: 0, rewardsEarned: 0 });
  });

  it('addStampsForProduct works new threshold reached', async () => {
    repo.findProgress.mockResolvedValue({ current_count: 2, threshold: 4 } as any);
    const r = await service.addStampsForProduct('u1', 'c1', 3);
    expect(r).toEqual({ stampsAdded: 3, currentStamps: 1, rewardsEarned: 1 });
    expect(repo.saveProgress).toHaveBeenCalledWith('u1', 'c1', 1, 4);
    expect(repo.createReward).toHaveBeenCalledTimes(1);
    expect(notif.sendToUser).toHaveBeenCalled();
  });

  it('addStampsForProduct handles no existing progress', async () => {
    repo.findProgress.mockResolvedValue(null as any);
    const r = await service.addStampsForProduct('u1', 'c1', 1);
    expect(r).toEqual({ stampsAdded: 1, currentStamps: 1, rewardsEarned: 0 });
    expect(repo.saveProgress).toHaveBeenCalledWith('u1', 'c1', 1, 4);
  });

  it('addStampsForProduct handles repo throw', async () => {
    repo.findProgress.mockRejectedValue(new Error('err'));
    const r = await service.addStampsForProduct('u1', 'c1', 1);
    expect(r).toEqual({ stampsAdded: 0, currentStamps: 0, rewardsEarned: 0 });
  });
});
`,
  'loyalty/__tests__/loyalty.repository.test.ts': `import { LoyaltyRepository } from '../loyalty.repository';
import { supabaseAdmin, mockQueryBuilder } from '../../../__mocks__/supabase';

jest.mock('../../../config/supabase', () => ({
  supabaseAdmin: require('../../../__mocks__/supabase').supabaseAdmin,
}));

describe('LoyaltyRepository', () => {
  let repo: LoyaltyRepository;

  beforeEach(() => {
    repo = new LoyaltyRepository();
    jest.clearAllMocks();
  });

  it('getLoyaltyProgress works', async () => {
    const res = await repo.getLoyaltyProgress('u1');
    expect(res).toBeDefined();
  });
  it('getLoyaltyProgress throws', async () => {
    const mockQuery = mockQueryBuilder();
    mockQuery.eq.mockResolvedValue({ data: null, error: new Error('e') });
    (supabaseAdmin.from as jest.Mock).mockReturnValue(mockQuery);
    await expect(repo.getLoyaltyProgress('u1')).rejects.toThrow('e');
  });

  it('getLoyaltyRewards works', async () => {
    const mockQuery = mockQueryBuilder([]);
    mockQuery.order.mockResolvedValue({ data: [], error: null });
    (supabaseAdmin.from as jest.Mock).mockReturnValue(mockQuery);
    const res = await repo.getLoyaltyRewards('u1');
    expect(res).toBeDefined();
  });
  it('getLoyaltyRewards throws', async () => {
    const mockQuery = mockQueryBuilder();
    mockQuery.order.mockResolvedValue({ data: null, error: new Error('e') });
    (supabaseAdmin.from as jest.Mock).mockReturnValue(mockQuery);
    await expect(repo.getLoyaltyRewards('u1')).rejects.toThrow('e');
  });

  it('findProgress works', async () => {
    const res = await repo.findProgress('u1', 'c1');
    expect(res).toBeDefined();
  });
  it('findProgress throws', async () => {
    const mockQuery = mockQueryBuilder();
    mockQuery.maybeSingle.mockResolvedValue({ data: null, error: new Error('e') });
    (supabaseAdmin.from as jest.Mock).mockReturnValue(mockQuery);
    await expect(repo.findProgress('u1', 'c1')).rejects.toThrow('e');
  });

  it('saveProgress works', async () => {
    const res = await repo.saveProgress('u1', 'c1', 1);
    expect(res).toBeDefined();
  });
  it('saveProgress throws', async () => {
    const mockQuery = mockQueryBuilder();
    mockQuery.single.mockResolvedValue({ data: null, error: new Error('e') });
    (supabaseAdmin.from as jest.Mock).mockReturnValue(mockQuery);
    await expect(repo.saveProgress('u1', 'c1', 1)).rejects.toThrow('e');
  });

  it('createReward works', async () => {
    const res = await repo.createReward('u1', 'c1');
    expect(res).toBeDefined();
  });
  it('createReward throws', async () => {
    const mockQuery = mockQueryBuilder();
    mockQuery.single.mockResolvedValue({ data: null, error: new Error('e') });
    (supabaseAdmin.from as jest.Mock).mockReturnValue(mockQuery);
    await expect(repo.createReward('u1', 'c1')).rejects.toThrow('e');
  });

  it('redeemReward works', async () => {
    const res = await repo.redeemReward('r1', 'o1');
    expect(res).toBeDefined();
  });
  it('redeemReward throws', async () => {
    const mockQuery = mockQueryBuilder();
    mockQuery.single.mockResolvedValue({ data: null, error: new Error('e') });
    (supabaseAdmin.from as jest.Mock).mockReturnValue(mockQuery);
    await expect(repo.redeemReward('r1', 'o1')).rejects.toThrow('e');
  });
});
`,

  'menu/__tests__/menu.controller.test.ts': `import 'reflect-metadata';
import { MenuController } from '../menu.controller';
import { MenuService } from '../menu.service';
import { AuditService } from '../../audit/audit.service';
import { Request, Response } from 'express';

describe('MenuController', () => {
  let controller: MenuController;
  let service: jest.Mocked<MenuService>;
  let audit: jest.Mocked<AuditService>;
  let req: Partial<Request>;
  let res: Partial<Response>;
  let next: jest.Mock;

  beforeEach(() => {
    service = { getAllItems: jest.fn(), getItemById: jest.fn(), createItem: jest.fn(), updateItem: jest.fn(), deleteItem: jest.fn() } as any;
    audit = { logEvent: jest.fn() } as any;
    controller = new MenuController(service as any, audit as any);
    req = { user: { id: 'u1', role: 'admin' }, profile: { role: 'admin' }, query: {}, params: {}, body: {} } as any;
    res = { status: jest.fn().mockReturnThis(), json: jest.fn() } as any;
    next = jest.fn();
  });

  it('getAllItems default', async () => {
    service.getAllItems.mockResolvedValue([]);
    await controller.getAllItems(req as Request, res as Response, next);
    expect(service.getAllItems).toHaveBeenCalledWith(true, undefined, undefined);
  });
  
  it('getAllItems admin can set onlyActive false', async () => {
    req.query = { onlyActive: 'false' };
    service.getAllItems.mockResolvedValue([]);
    await controller.getAllItems(req as Request, res as Response, next);
    expect(service.getAllItems).toHaveBeenCalledWith(false, undefined, undefined);
  });

  it('getAllItems fails', async () => {
    service.getAllItems.mockRejectedValue(new Error('err'));
    await controller.getAllItems(req as Request, res as Response, next);
    expect(next).toHaveBeenCalled();
  });

  it('getItemById works', async () => {
    req.params = { id: '1' };
    service.getItemById.mockResolvedValue({} as any);
    await controller.getItemById(req as Request, res as Response, next);
    expect(res.json).toHaveBeenCalled();
  });
  it('getItemById fails', async () => {
    req.params = { id: '1' };
    service.getItemById.mockRejectedValue(new Error('err'));
    await controller.getItemById(req as Request, res as Response, next);
    expect(next).toHaveBeenCalled();
  });

  it('createItem works', async () => {
    req.body = { name: 'P' };
    service.createItem.mockResolvedValue({ id: '1', name: 'P' } as any);
    await controller.createItem(req as Request, res as Response, next);
    expect(res.status).toHaveBeenCalledWith(201);
    expect(audit.logEvent).toHaveBeenCalled();
  });
  it('createItem fails', async () => {
    service.createItem.mockRejectedValue(new Error('err'));
    await controller.createItem(req as Request, res as Response, next);
    expect(audit.logEvent).toHaveBeenCalled();
    expect(next).toHaveBeenCalled();
  });

  it('updateItem works', async () => {
    req.params = { id: '1' };
    req.body = { name: 'P2' };
    service.updateItem.mockResolvedValue({ id: '1', name: 'P2' } as any);
    await controller.updateItem(req as Request, res as Response, next);
    expect(res.json).toHaveBeenCalled();
    expect(audit.logEvent).toHaveBeenCalled();
  });
  it('updateItem fails', async () => {
    req.params = { id: '1' };
    service.updateItem.mockRejectedValue(new Error('err'));
    await controller.updateItem(req as Request, res as Response, next);
    expect(next).toHaveBeenCalled();
    expect(audit.logEvent).toHaveBeenCalled();
  });

  it('deleteItem works', async () => {
    req.params = { id: '1' };
    service.deleteItem.mockResolvedValue(undefined as any);
    await controller.deleteItem(req as Request, res as Response, next);
    expect(res.json).toHaveBeenCalled();
    expect(audit.logEvent).toHaveBeenCalled();
  });
  it('deleteItem fails', async () => {
    req.params = { id: '1' };
    service.deleteItem.mockRejectedValue(new Error('err'));
    await controller.deleteItem(req as Request, res as Response, next);
    expect(next).toHaveBeenCalled();
    expect(audit.logEvent).toHaveBeenCalled();
  });
});
`,
  'menu/__tests__/menu.service.test.ts': `import 'reflect-metadata';
import { MenuService } from '../menu.service';
import { MenuRepository } from '../menu.repository';
import { redis } from '../../../config/redis';

jest.mock('../../../config/redis', () => ({
  redis: {
    get: jest.fn(),
    setex: jest.fn(),
    del: jest.fn()
  }
}));

describe('MenuService', () => {
  let service: MenuService;
  let repo: jest.Mocked<MenuRepository>;

  beforeEach(() => {
    repo = { getAllItems: jest.fn(), getItemById: jest.fn(), createItem: jest.fn(), updateItem: jest.fn(), deleteItem: jest.fn() } as any;
    service = new MenuService(repo as any);
    jest.clearAllMocks();
  });

  it('getAllItems from cache', async () => {
    (redis.get as jest.Mock).mockResolvedValue(JSON.stringify([{ id: '1' }]));
    const res = await service.getAllItems();
    expect(res).toEqual([{ id: '1' }]);
  });
  
  it('getAllItems cache err but success from db', async () => {
    (redis.get as jest.Mock).mockRejectedValue(new Error('r'));
    repo.getAllItems.mockResolvedValue([{ id: '2' }] as any);
    const res = await service.getAllItems();
    expect(res).toEqual([{ id: '2' }]);
  });
  it('getAllItems db error', async () => {
    (redis.get as jest.Mock).mockResolvedValue(null);
    repo.getAllItems.mockRejectedValue({});
    await expect(service.getAllItems()).rejects.toThrow('Failed to retrieve products.');
  });
  it('getAllItems save cache error', async () => {
    (redis.get as jest.Mock).mockResolvedValue(null);
    (redis.setex as jest.Mock).mockRejectedValue(new Error('e'));
    repo.getAllItems.mockResolvedValue([{ id: '2' }] as any);
    const res = await service.getAllItems();
    expect(res).toEqual([{ id: '2' }]);
  });

  it('getItemById from cache', async () => {
    (redis.get as jest.Mock).mockResolvedValue(JSON.stringify({ id: '1' }));
    const res = await service.getItemById('1');
    expect(res).toEqual({ id: '1' });
  });
  it('getItemById cache err db fallback', async () => {
    (redis.get as jest.Mock).mockRejectedValue(new Error('e'));
    repo.getItemById.mockResolvedValue({ id: '2' } as any);
    const res = await service.getItemById('2');
    expect(res).toEqual({ id: '2' });
  });
  it('getItemById not found PGRST116', async () => {
    (redis.get as jest.Mock).mockResolvedValue(null);
    repo.getItemById.mockRejectedValue({ code: 'PGRST116' });
    await expect(service.getItemById('1')).rejects.toThrow('Product not found.');
  });
  it('getItemById other error', async () => {
    (redis.get as jest.Mock).mockResolvedValue(null);
    repo.getItemById.mockRejectedValue(new Error('err'));
    await expect(service.getItemById('1')).rejects.toThrow('err');
  });
  it('getItemById save cache error', async () => {
    (redis.get as jest.Mock).mockResolvedValue(null);
    (redis.setex as jest.Mock).mockRejectedValue(new Error('e'));
    repo.getItemById.mockResolvedValue({ id: '2' } as any);
    const res = await service.getItemById('2');
    expect(res).toEqual({ id: '2' });
  });

  it('createItem invalid price', async () => {
    await expect(service.createItem({ base_price: 0 } as any)).rejects.toThrow('Base price must be greater than 0.');
  });
  it('createItem works', async () => {
    repo.createItem.mockResolvedValue({ id: '1' } as any);
    const res = await service.createItem({ base_price: 10 } as any);
    expect(res).toEqual({ id: '1' });
    expect(redis.del).toHaveBeenCalled();
  });
  it('createItem fails', async () => {
    repo.createItem.mockRejectedValue({});
    await expect(service.createItem({ base_price: 10 } as any)).rejects.toThrow('Failed to create product.');
  });

  it('updateItem invalid price', async () => {
    await expect(service.updateItem('1', { base_price: -1 } as any)).rejects.toThrow('Base price must be greater than 0.');
  });
  it('updateItem works', async () => {
    repo.updateItem.mockResolvedValue({ id: '1' } as any);
    const res = await service.updateItem('1', { base_price: 10 } as any);
    expect(res).toEqual({ id: '1' });
    expect(redis.del).toHaveBeenCalled();
  });
  it('updateItem fails', async () => {
    repo.updateItem.mockRejectedValue({});
    await expect(service.updateItem('1', { base_price: 10 } as any)).rejects.toThrow('Failed to update product.');
  });
  
  it('invalidateMenuCache catch err', async () => {
    repo.createItem.mockResolvedValue({ id: '1' } as any);
    (redis.del as jest.Mock).mockRejectedValue(new Error('e'));
    const res = await service.createItem({ base_price: 10 } as any);
    expect(res).toEqual({ id: '1' });
  });

  it('deleteItem works', async () => {
    repo.getItemById.mockResolvedValue({} as any);
    repo.deleteItem.mockResolvedValue(undefined as any);
    await service.deleteItem('1');
    expect(redis.del).toHaveBeenCalled();
  });
  it('deleteItem fails on repo', async () => {
    repo.getItemById.mockResolvedValue({} as any);
    repo.deleteItem.mockRejectedValue({});
    await expect(service.deleteItem('1')).rejects.toThrow('Failed to delete product.');
  });
});
`,
  'menu/__tests__/menu.repository.test.ts': `import { MenuRepository } from '../menu.repository';
import { supabaseAdmin, mockQueryBuilder } from '../../../__mocks__/supabase';

jest.mock('../../../config/supabase', () => ({
  supabaseAdmin: require('../../../__mocks__/supabase').supabaseAdmin,
}));

describe('MenuRepository', () => {
  let repo: MenuRepository;

  beforeEach(() => {
    repo = new MenuRepository();
    jest.clearAllMocks();
  });

  it('getAllItems filters', async () => {
    const mockQuery = mockQueryBuilder([]);
    (supabaseAdmin.from as jest.Mock).mockReturnValue(mockQuery);
    const res = await repo.getAllItems(true, 'query', 'cat1');
    expect(res).toEqual([]);
    expect(mockQuery.eq).toHaveBeenCalledWith('is_active', true);
    expect(mockQuery.eq).toHaveBeenCalledWith('category_id', 'cat1');
    expect(mockQuery.ilike).toHaveBeenCalledWith('name', '%query%');
  });

  it('getAllItems fails', async () => {
    const mockQuery = mockQueryBuilder();
    mockQuery.eq.mockReturnValue(mockQuery);
    mockQuery.ilike.mockResolvedValue({ data: null, error: new Error('e') });
    (supabaseAdmin.from as jest.Mock).mockReturnValue(mockQuery);
    await expect(repo.getAllItems(true, 'a', 'b')).rejects.toThrow('e');
  });

  it('getItemById works', async () => {
    const res = await repo.getItemById('1');
    expect(res).toBeDefined();
  });
  it('getItemById fails', async () => {
    const mockQuery = mockQueryBuilder();
    mockQuery.single.mockResolvedValue({ data: null, error: new Error('e') });
    (supabaseAdmin.from as jest.Mock).mockReturnValue(mockQuery);
    await expect(repo.getItemById('1')).rejects.toThrow('e');
  });

  it('createItem works', async () => {
    const res = await repo.createItem({ base_price: 10 } as any);
    expect(res).toBeDefined();
  });
  it('createItem fails', async () => {
    const mockQuery = mockQueryBuilder();
    mockQuery.single.mockResolvedValue({ data: null, error: new Error('e') });
    (supabaseAdmin.from as jest.Mock).mockReturnValue(mockQuery);
    await expect(repo.createItem({} as any)).rejects.toThrow('e');
  });

  it('updateItem works', async () => {
    const res = await repo.updateItem('1', { base_price: 10 } as any);
    expect(res).toBeDefined();
  });
  it('updateItem fails', async () => {
    const mockQuery = mockQueryBuilder();
    mockQuery.single.mockResolvedValue({ data: null, error: new Error('e') });
    (supabaseAdmin.from as jest.Mock).mockReturnValue(mockQuery);
    await expect(repo.updateItem('1', {} as any)).rejects.toThrow('e');
  });

  it('deleteItem works', async () => {
    const mockQuery = mockQueryBuilder();
    mockQuery.eq.mockResolvedValue({ error: null });
    (supabaseAdmin.from as jest.Mock).mockReturnValue(mockQuery);
    await repo.deleteItem('1');
    expect(supabaseAdmin.from).toHaveBeenCalledWith('products');
  });
  it('deleteItem fails', async () => {
    const mockQuery = mockQueryBuilder();
    mockQuery.eq.mockResolvedValue({ error: new Error('e') });
    (supabaseAdmin.from as jest.Mock).mockReturnValue(mockQuery);
    await expect(repo.deleteItem('1')).rejects.toThrow('e');
  });
});
`
};

for (const [file, content] of Object.entries(files)) {
  const fullPath = path.join(baseDir, file);
  fs.mkdirSync(path.dirname(fullPath), { recursive: true });
  fs.writeFileSync(fullPath, content);
}
