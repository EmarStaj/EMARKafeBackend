import { LoyaltyRepository } from '../loyalty.repository';
import { supabaseAdmin, mockQueryBuilder } from '../../../__mocks__/supabase';

jest.mock('../../../config/supabase', () => {
  return jest.requireActual('../../../__mocks__/supabase');
});

describe('LoyaltyRepository', () => {
  let repo: LoyaltyRepository;

  beforeEach(() => {
    repo = new LoyaltyRepository();
    jest.clearAllMocks();
  });

  describe('getLoyaltyProgress', () => {
    it('should get loyalty progress successfully', async () => {
      const mockQuery = mockQueryBuilder();
      mockQuery.eq.mockResolvedValue({ data: [{ id: 'p1' }], error: null });
      (supabaseAdmin.from as jest.Mock).mockReturnValue(mockQuery);

      const res = await repo.getLoyaltyProgress('u1');
      expect(res).toEqual([{ id: 'p1' }]);
      expect(mockQuery.eq).toHaveBeenCalledWith('user_id', 'u1');
    });

    it('should throw on error', async () => {
      const mockQuery = mockQueryBuilder();
      mockQuery.eq.mockResolvedValue({ data: null, error: new Error('err') });
      (supabaseAdmin.from as jest.Mock).mockReturnValue(mockQuery);

      await expect(repo.getLoyaltyProgress('u1')).rejects.toThrow('err');
    });
  });

  describe('getLoyaltyRewards', () => {
    it('should get loyalty rewards successfully', async () => {
      const mockQuery = mockQueryBuilder();
      const mockResult = { data: [{ id: 'r1' }], error: null };
      mockQuery.eq.mockReturnValue({
        order: jest.fn().mockResolvedValue(mockResult)
      });
      (supabaseAdmin.from as jest.Mock).mockReturnValue(mockQuery);

      const res = await repo.getLoyaltyRewards('u1');
      expect(res).toEqual([{ id: 'r1' }]);
    });

    it('should throw on error', async () => {
      const mockQuery = mockQueryBuilder();
      mockQuery.eq.mockReturnValue({
        order: jest.fn().mockResolvedValue({ data: null, error: new Error('err') })
      });
      (supabaseAdmin.from as jest.Mock).mockReturnValue(mockQuery);

      await expect(repo.getLoyaltyRewards('u1')).rejects.toThrow('err');
    });
  });

  describe('findProgress', () => {
    it('should find progress successfully', async () => {
      const mockQuery = mockQueryBuilder();
      mockQuery.eq.mockReturnValue({
        eq: jest.fn().mockReturnValue({
          maybeSingle: jest.fn().mockResolvedValue({ data: { id: 'p1' }, error: null })
        })
      });
      (supabaseAdmin.from as jest.Mock).mockReturnValue(mockQuery);

      const res = await repo.findProgress('u1', 'c1');
      expect(res).toEqual({ id: 'p1' });
    });

    it('should throw on error', async () => {
      const mockQuery = mockQueryBuilder();
      mockQuery.eq.mockReturnValue({
        eq: jest.fn().mockReturnValue({
          maybeSingle: jest.fn().mockResolvedValue({ data: null, error: new Error('err') })
        })
      });
      (supabaseAdmin.from as jest.Mock).mockReturnValue(mockQuery);

      await expect(repo.findProgress('u1', 'c1')).rejects.toThrow('err');
    });
  });

  describe('saveProgress', () => {
    it('should save progress successfully', async () => {
      const mockQuery = mockQueryBuilder();
      mockQuery.single.mockResolvedValue({ data: { id: 'p1' }, error: null });
      (supabaseAdmin.from as jest.Mock).mockReturnValue(mockQuery);

      const res = await repo.saveProgress('u1', 'c1', 2);
      expect(res).toEqual({ id: 'p1' });
    });

    it('should throw on error', async () => {
      const mockQuery = mockQueryBuilder();
      mockQuery.single.mockResolvedValue({ data: null, error: new Error('err') });
      (supabaseAdmin.from as jest.Mock).mockReturnValue(mockQuery);

      await expect(repo.saveProgress('u1', 'c1', 2)).rejects.toThrow('err');
    });
  });

  describe('createReward', () => {
    it('should create reward successfully', async () => {
      const mockQuery = mockQueryBuilder();
      mockQuery.single.mockResolvedValue({ data: { id: 'r1' }, error: null });
      (supabaseAdmin.from as jest.Mock).mockReturnValue(mockQuery);

      const res = await repo.createReward('u1', 'c1');
      expect(res).toEqual({ id: 'r1' });
    });

    it('should throw on error', async () => {
      const mockQuery = mockQueryBuilder();
      mockQuery.single.mockResolvedValue({ data: null, error: new Error('err') });
      (supabaseAdmin.from as jest.Mock).mockReturnValue(mockQuery);

      await expect(repo.createReward('u1', 'c1')).rejects.toThrow('err');
    });
  });

  describe('redeemReward', () => {
    it('should redeem reward successfully', async () => {
      const mockQuery = mockQueryBuilder();
      mockQuery.eq.mockReturnValue({
        select: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({ data: { id: 'r1' }, error: null })
        })
      });
      (supabaseAdmin.from as jest.Mock).mockReturnValue(mockQuery);

      const res = await repo.redeemReward('r1', 'o1');
      expect(res).toEqual({ id: 'r1' });
    });

    it('should throw on error', async () => {
      const mockQuery = mockQueryBuilder();
      mockQuery.eq.mockReturnValue({
        select: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({ data: null, error: new Error('err') })
        })
      });
      (supabaseAdmin.from as jest.Mock).mockReturnValue(mockQuery);

      await expect(repo.redeemReward('r1', 'o1')).rejects.toThrow('err');
    });
  });
});
