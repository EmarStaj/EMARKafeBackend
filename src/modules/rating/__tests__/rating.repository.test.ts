import { RatingRepository } from '../rating.repository';
import { supabaseAdmin } from '../../../config/supabase';

jest.mock('../../../config/supabase', () => { return { supabaseAdmin: { from: jest.fn(), auth: { admin: { deleteUser: jest.fn() } } } }; });

describe('RatingRepository', () => {
  let repository: RatingRepository;

  beforeEach(() => {
    repository = new RatingRepository();
    jest.clearAllMocks();
  });

  describe('hasPurchasedProduct', () => {
    it('should return true if data exists', async () => {
      (supabaseAdmin.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              eq: jest.fn().mockResolvedValue({ data: [{ id: '1' }], error: null }),
            }),
          }),
        }),
      });

      const res = await repository.hasPurchasedProduct('u1', 'p1');
      expect(res).toBe(true);
    });

    it('should return false if data is empty', async () => {
      (supabaseAdmin.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              eq: jest.fn().mockResolvedValue({ data: [], error: null }),
            }),
          }),
        }),
      });

      const res = await repository.hasPurchasedProduct('u1', 'p1');
      expect(res).toBe(false);
    });

    it('should return false if data is null', async () => {
      (supabaseAdmin.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              eq: jest.fn().mockResolvedValue({ data: null, error: null }),
            }),
          }),
        }),
      });

      const res = await repository.hasPurchasedProduct('u1', 'p1');
      expect(res).toBe(false);
    });

    it('should throw on error', async () => {
      (supabaseAdmin.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              eq: jest.fn().mockResolvedValue({ data: null, error: new Error('db') }),
            }),
          }),
        }),
      });

      await expect(repository.hasPurchasedProduct('u1', 'p1')).rejects.toThrow('db');
    });
  });

  describe('findRatingByOrder', () => {
    it('should return rating', async () => {
      (supabaseAdmin.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                maybeSingle: jest.fn().mockResolvedValue({ data: { id: 'r1' }, error: null }),
              }),
            }),
          }),
        }),
      });
      const res = await repository.findRatingByOrder('u1', 'p1', 'o1');
      expect(res).toEqual({ id: 'r1' });
    });

    it('should throw on error', async () => {
      (supabaseAdmin.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                maybeSingle: jest.fn().mockResolvedValue({ data: null, error: new Error('db') }),
              }),
            }),
          }),
        }),
      });
      await expect(repository.findRatingByOrder('u1', 'p1', 'o1')).rejects.toThrow('db');
    });
  });

  describe('addOrUpdateRating', () => {
    it('should update if exists', async () => {
      repository.findRatingByOrder = jest.fn().mockResolvedValue({ id: 'r1' });
      (supabaseAdmin.from as jest.Mock).mockReturnValue({
        update: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            select: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({ data: { id: 'r1', rating: 5 }, error: null }),
            }),
          }),
        }),
      });

      const res = await repository.addOrUpdateRating({ user_id: 'u1', product_id: 'p1', order_id: 'o1', rating: 5 });
      expect(res).toEqual({ id: 'r1', rating: 5 });
    });

    it('should insert if not exists', async () => {
      repository.findRatingByOrder = jest.fn().mockResolvedValue(null);
      (supabaseAdmin.from as jest.Mock).mockReturnValue({
        insert: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({ data: { id: 'r2', rating: 5 }, error: null }),
          }),
        }),
      });

      const res = await repository.addOrUpdateRating({ user_id: 'u1', product_id: 'p1', order_id: 'o1', rating: 5 });
      expect(res).toEqual({ id: 'r2', rating: 5 });
    });

    it('should throw on error', async () => {
      repository.findRatingByOrder = jest.fn().mockResolvedValue(null);
      (supabaseAdmin.from as jest.Mock).mockReturnValue({
        insert: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({ data: null, error: new Error('db') }),
          }),
        }),
      });
      await expect(repository.addOrUpdateRating({ user_id: 'u', product_id: 'p', order_id: 'o', rating: 5 })).rejects.toThrow('db');
    });
  });

  describe('updateProductRatingStats', () => {
    it('should update stats correctly', async () => {
      (supabaseAdmin.from as jest.Mock).mockImplementation((table) => {
        if (table === 'product_ratings') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockResolvedValue({ data: [{ rating: 4 }, { rating: 5 }], error: null }),
            }),
          };
        }
        if (table === 'products') {
          return {
            update: jest.fn().mockReturnValue({
              eq: jest.fn().mockResolvedValue({ error: null }),
            }),
          };
        }
        return {} as any;
      });

      const res = await repository.updateProductRatingStats('p1');
      expect(res).toEqual({ avg_rating: 4.5, rating_count: 2 });
    });

    it('should default avg to 0 if count is 0', async () => {
      (supabaseAdmin.from as jest.Mock).mockImplementation((table) => {
        if (table === 'product_ratings') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockResolvedValue({ data: [], error: null }),
            }),
          };
        }
        if (table === 'products') {
          return {
            update: jest.fn().mockReturnValue({
              eq: jest.fn().mockResolvedValue({ error: null }),
            }),
          };
        }
        return {} as any;
      });
      const res = await repository.updateProductRatingStats('p1');
      expect(res).toEqual({ avg_rating: 0, rating_count: 0 });
    });

    it('should throw if fetch ratings fail', async () => {
      (supabaseAdmin.from as jest.Mock).mockImplementation((table) => {
        if (table === 'product_ratings') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockResolvedValue({ data: null, error: new Error('db') }),
            }),
          };
        }
        return {} as any;
      });
      await expect(repository.updateProductRatingStats('p1')).rejects.toThrow('db');
    });

    it('should throw if update product fails', async () => {
      (supabaseAdmin.from as jest.Mock).mockImplementation((table) => {
        if (table === 'product_ratings') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockResolvedValue({ data: [{ rating: 4 }], error: null }),
            }),
          };
        }
        if (table === 'products') {
          return {
            update: jest.fn().mockReturnValue({
              eq: jest.fn().mockResolvedValue({ error: new Error('db') }),
            }),
          };
        }
        return {} as any;
      });
      await expect(repository.updateProductRatingStats('p1')).rejects.toThrow('db');
    });
  });
});
