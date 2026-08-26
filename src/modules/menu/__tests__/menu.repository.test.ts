import { MenuRepository } from '../menu.repository';
import { supabaseAdmin, mockQueryBuilder } from '../../../__mocks__/supabase';

jest.mock('../../../config/supabase', () => {
  return jest.requireActual('../../../__mocks__/supabase');
});

describe('MenuRepository', () => {
  let repo: MenuRepository;

  beforeEach(() => {
    repo = new MenuRepository();
    jest.clearAllMocks();
  });

  describe('getAllItems', () => {
    it('should get all items successfully', async () => {
      const mockQuery = mockQueryBuilder();
      const mockResult = { data: [{ id: '1' }], error: null };
      
      mockQuery.eq.mockReturnValue(mockQuery);
      mockQuery.ilike = jest.fn().mockReturnValue({
        then: (resolve: any) => resolve(mockResult)
      });
      (mockQuery as any).then = (resolve: any) => resolve(mockResult);

      (supabaseAdmin.from as jest.Mock).mockReturnValue(mockQuery);

      const res = await repo.getAllItems(true, 'search', 'cat1');
      expect(res).toEqual([{ id: '1' }]);
      expect(mockQuery.eq).toHaveBeenCalledWith('is_active', true);
      expect(mockQuery.eq).toHaveBeenCalledWith('category_id', 'cat1');
      expect(mockQuery.ilike).toHaveBeenCalledWith('name', '%search%');
    });

    it('should handle false onlyActive and no filters', async () => {
      const mockQuery = mockQueryBuilder();
      const mockResult = { data: [{ id: '1' }], error: null };
      (mockQuery as any).then = (resolve: any) => resolve(mockResult);

      (supabaseAdmin.from as jest.Mock).mockReturnValue(mockQuery);

      const res = await repo.getAllItems(false);
      expect(res).toEqual([{ id: '1' }]);
    });

    it('should throw on error', async () => {
      const mockQuery = mockQueryBuilder();
      const mockResult = { data: null, error: new Error('err') };
      (mockQuery as any).then = (resolve: any) => resolve(mockResult);
      (supabaseAdmin.from as jest.Mock).mockReturnValue(mockQuery);

      await expect(repo.getAllItems(false)).rejects.toThrow('err');
    });
  });

  describe('getItemById', () => {
    it('should get item by id successfully', async () => {
      const mockQuery = mockQueryBuilder();
      mockQuery.eq.mockReturnValue({
        single: jest.fn().mockResolvedValue({ data: { id: '1' }, error: null })
      });
      (supabaseAdmin.from as jest.Mock).mockReturnValue(mockQuery);

      const res = await repo.getItemById('1');
      expect(res).toEqual({ id: '1' });
    });

    it('should throw on error', async () => {
      const mockQuery = mockQueryBuilder();
      mockQuery.eq.mockReturnValue({
        single: jest.fn().mockResolvedValue({ data: null, error: new Error('err') })
      });
      (supabaseAdmin.from as jest.Mock).mockReturnValue(mockQuery);

      await expect(repo.getItemById('1')).rejects.toThrow('err');
    });
  });

  describe('createItem', () => {
    it('should create item successfully', async () => {
      const mockQuery = mockQueryBuilder();
      mockQuery.insert.mockReturnValue({
        select: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({ data: { id: '1' }, error: null })
        })
      });
      (supabaseAdmin.from as jest.Mock).mockReturnValue(mockQuery);

      const res = await repo.createItem({ base_price: 10 } as any);
      expect(res).toEqual({ id: '1' });
    });

    it('should throw on error', async () => {
      const mockQuery = mockQueryBuilder();
      mockQuery.insert.mockReturnValue({
        select: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({ data: null, error: new Error('err') })
        })
      });
      (supabaseAdmin.from as jest.Mock).mockReturnValue(mockQuery);

      await expect(repo.createItem({ base_price: 10 } as any)).rejects.toThrow('err');
    });
  });

  describe('updateItem', () => {
    it('should update item successfully', async () => {
      const mockQuery = mockQueryBuilder();
      mockQuery.update.mockReturnValue({
        eq: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({ data: { id: '1' }, error: null })
          })
        })
      });
      (supabaseAdmin.from as jest.Mock).mockReturnValue(mockQuery);

      const res = await repo.updateItem('1', { base_price: 10 });
      expect(res).toEqual({ id: '1' });
    });

    it('should throw on error', async () => {
      const mockQuery = mockQueryBuilder();
      mockQuery.update.mockReturnValue({
        eq: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({ data: null, error: new Error('err') })
          })
        })
      });
      (supabaseAdmin.from as jest.Mock).mockReturnValue(mockQuery);

      await expect(repo.updateItem('1', { base_price: 10 })).rejects.toThrow('err');
    });
  });

  describe('deleteItem', () => {
    it('should delete item successfully', async () => {
      const mockQuery = mockQueryBuilder();
      mockQuery.update.mockReturnValue({
        eq: jest.fn().mockResolvedValue({ data: null, error: null })
      });
      (supabaseAdmin.from as jest.Mock).mockReturnValue(mockQuery);

      await repo.deleteItem('1');
    });

    it('should throw on error', async () => {
      const mockQuery = mockQueryBuilder();
      mockQuery.update.mockReturnValue({
        eq: jest.fn().mockResolvedValue({ data: null, error: new Error('err') })
      });
      (supabaseAdmin.from as jest.Mock).mockReturnValue(mockQuery);

      await expect(repo.deleteItem('1')).rejects.toThrow('err');
    });
  });
});
