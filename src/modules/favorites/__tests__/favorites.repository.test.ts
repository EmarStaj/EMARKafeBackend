import { FavoritesRepository } from '../favorites.repository';
import { supabaseAdmin, getSupabaseForUser, mockQueryBuilder } from '../../../__mocks__/supabase';

jest.mock('../../../config/supabase', () => {
  return jest.requireActual('../../../__mocks__/supabase');
});

describe('FavoritesRepository', () => {
  let repo: FavoritesRepository;

  beforeEach(() => {
    repo = new FavoritesRepository();
    jest.clearAllMocks();
  });

  describe('getFavorites', () => {
    it('should retrieve favorites successfully with userId', async () => {
      const mockQuery = mockQueryBuilder([{ id: 'fav1' }]);
      mockQuery.eq.mockResolvedValue({ data: [{ id: 'fav1' }], error: null });
      (getSupabaseForUser as jest.Mock).mockReturnValue({
        from: jest.fn().mockReturnValue(mockQuery),
      });

      const res = await repo.getFavorites('token', 'u1');
      expect(res).toEqual([{ id: 'fav1' }]);
      expect(mockQuery.eq).toHaveBeenCalledWith('user_id', 'u1');
    });

    it('should retrieve favorites successfully without userId', async () => {
      const mockQuery = mockQueryBuilder([{ id: 'fav1' }]);
      (mockQuery as any).then = (resolve: any) => resolve({ data: [{ id: 'fav1' }], error: null });
      (getSupabaseForUser as jest.Mock).mockReturnValue({
        from: jest.fn().mockReturnValue(mockQuery),
      });

      const res = await repo.getFavorites('token');
      expect(res).toEqual([{ id: 'fav1' }]);
    });

    it('should throw error if getFavorites fails', async () => {
      const mockQuery = mockQueryBuilder();
      mockQuery.eq.mockResolvedValue({ data: null, error: new Error('db error') });
      (getSupabaseForUser as jest.Mock).mockReturnValue({
        from: jest.fn().mockReturnValue(mockQuery),
      });

      await expect(repo.getFavorites('token', 'u1')).rejects.toThrow('db error');
    });
  });

  describe('findFavorite', () => {
    it('should return favorite if exists', async () => {
      const mockQuery = mockQueryBuilder();
      mockQuery.maybeSingle.mockResolvedValue({ data: { id: 'fav1' }, error: null });
      (getSupabaseForUser as jest.Mock).mockReturnValue({
        from: jest.fn().mockReturnValue(mockQuery),
      });

      const res = await repo.findFavorite('u1', 'p1', 'token');
      expect(res).toEqual({ id: 'fav1' });
    });

    it('should throw error if findFavorite fails', async () => {
      const mockQuery = mockQueryBuilder();
      mockQuery.maybeSingle.mockResolvedValue({ data: null, error: new Error('db err') });
      (getSupabaseForUser as jest.Mock).mockReturnValue({
        from: jest.fn().mockReturnValue(mockQuery),
      });

      await expect(repo.findFavorite('u1', 'p1', 'token')).rejects.toThrow('db err');
    });
  });

  describe('addFavorite', () => {
    it('should add favorite successfully', async () => {
      const mockQuery = mockQueryBuilder();
      mockQuery.single.mockResolvedValue({ data: { id: 'fav1' }, error: null });
      (supabaseAdmin.from as jest.Mock).mockReturnValue(mockQuery);

      const res = await repo.addFavorite('u1', 'p1', 'token');
      expect(res).toEqual({ id: 'fav1' });
      expect(mockQuery.insert).toHaveBeenCalledWith({ user_id: 'u1', product_id: 'p1' });
    });

    it('should throw error if addFavorite fails', async () => {
      const mockQuery = mockQueryBuilder();
      mockQuery.single.mockResolvedValue({ data: null, error: new Error('db err') });
      (supabaseAdmin.from as jest.Mock).mockReturnValue(mockQuery);

      await expect(repo.addFavorite('u1', 'p1', 'token')).rejects.toThrow('db err');
    });
  });

  describe('removeFavorite', () => {
    it('should remove favorite successfully', async () => {
      const mockQuery = mockQueryBuilder();
      const mockResult = { data: null, error: null };
      mockQuery.eq.mockReturnValue({
        eq: jest.fn().mockResolvedValue(mockResult)
      });
      (supabaseAdmin.from as jest.Mock).mockReturnValue(mockQuery);

      await repo.removeFavorite('u1', 'p1', 'token');
      expect(mockQuery.delete).toHaveBeenCalled();
    });

    it('should throw error if removeFavorite fails', async () => {
      const mockQuery = mockQueryBuilder();
      const mockResult = { data: null, error: new Error('db err') };
      mockQuery.eq.mockReturnValue({
        eq: jest.fn().mockResolvedValue(mockResult)
      });
      (supabaseAdmin.from as jest.Mock).mockReturnValue(mockQuery);

      await expect(repo.removeFavorite('u1', 'p1', 'token')).rejects.toThrow('db err');
    });
  });
});
