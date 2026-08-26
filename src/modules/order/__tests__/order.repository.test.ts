import { OrderRepository } from '../order.repository';
import { supabaseAdmin, getSupabaseForUser } from '../../../config/supabase';

jest.mock('../../../config/supabase', () => ({
  supabaseAdmin: {
    from: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    single: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    order: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
  },
  getSupabaseForUser: jest.fn().mockReturnValue({
    from: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    single: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    order: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
  })
}));

describe('OrderRepository', () => {
  let repository: OrderRepository;

  beforeEach(() => {
    repository = new OrderRepository();
    jest.clearAllMocks();
  });

  describe('createOrder', () => {
    it('creates an order with token', async () => {
      const mockOrder = { user_id: '1', branch_id: '2', total_price: 10, status: 'created' as any };
      (getSupabaseForUser as jest.Mock)().single.mockResolvedValue({ data: { id: 'order1' }, error: null });
      
      const result = await repository.createOrder(mockOrder, 'token');
      expect(result).toEqual({ id: 'order1' });
    });

    it('creates an order without token (admin)', async () => {
      const mockOrder = { user_id: '1', branch_id: '2', total_price: 10, status: 'created' as any };
      (supabaseAdmin.from as jest.Mock)().single.mockResolvedValue({ data: { id: 'order1' }, error: null });
      
      const result = await repository.createOrder(mockOrder, undefined, true);
      expect(result).toEqual({ id: 'order1' });
    });

    it('throws error if insert fails', async () => {
      (supabaseAdmin.from as jest.Mock)().single.mockResolvedValue({ data: null, error: new Error('err') });
      await expect(repository.createOrder({} as any, undefined, true)).rejects.toThrow('err');
    });
  });

  describe('createOrderItems', () => {
    it('creates order items with token', async () => {
      (getSupabaseForUser as jest.Mock)().select.mockResolvedValue({ data: [{ id: 'item1' }], error: null });
      const result = await repository.createOrderItems([{} as any], 'token');
      expect(result).toEqual([{ id: 'item1' }]);
    });

    it('creates order items admin', async () => {
      (supabaseAdmin.from as jest.Mock)().select.mockResolvedValue({ data: [{ id: 'item1' }], error: null });
      const result = await repository.createOrderItems([{} as any], undefined, true);
      expect(result).toEqual([{ id: 'item1' }]);
    });

    it('throws error if fails', async () => {
      (getSupabaseForUser as jest.Mock)().select.mockResolvedValue({ data: null, error: new Error('err') });
      await expect(repository.createOrderItems([], 'token')).rejects.toThrow('err');
    });
  });

  describe('getOrders', () => {
    it('gets orders with token', async () => {
      (getSupabaseForUser as jest.Mock)().select.mockReturnValue({
        eq: jest.fn().mockReturnValue({
          order: jest.fn().mockResolvedValue({ data: [], error: null })
        })
      });
      const result = await repository.getOrders('user1', 'token');
      expect(result).toEqual([]);
    });

    it('gets orders without token', async () => {
      (supabaseAdmin.from as jest.Mock)().select.mockReturnValue({
        eq: jest.fn().mockReturnValue({
          order: jest.fn().mockResolvedValue({ data: [], error: null })
        })
      });
      const result = await repository.getOrders('user1');
      expect(result).toEqual([]);
    });

    it('throws error on failure', async () => {
      (supabaseAdmin.from as jest.Mock)().select.mockReturnValue({
        eq: jest.fn().mockReturnValue({
          order: jest.fn().mockResolvedValue({ data: null, error: new Error('err') })
        })
      });
      await expect(repository.getOrders('user1')).rejects.toThrow('err');
    });
  });

  describe('getOrderById', () => {
    it('gets order with token', async () => {
      (getSupabaseForUser as jest.Mock)().select.mockReturnValue({
        eq: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({ data: { id: 'order1' }, error: null })
        })
      });
      const result = await repository.getOrderById('order1', 'token');
      expect(result).toEqual({ id: 'order1' });
    });

    it('gets order admin', async () => {
      (supabaseAdmin.from as jest.Mock)().select.mockReturnValue({
        eq: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({ data: { id: 'order1' }, error: null })
        })
      });
      const result = await repository.getOrderById('order1', undefined, true);
      expect(result).toEqual({ id: 'order1' });
    });

    it('throws error', async () => {
      (supabaseAdmin.from as jest.Mock)().select.mockReturnValue({
        eq: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({ data: null, error: new Error('err') })
        })
      });
      await expect(repository.getOrderById('order1', undefined, true)).rejects.toThrow('err');
    });
  });

  describe('getOrderByIdAdmin', () => {
    it('gets order admin', async () => {
      (supabaseAdmin.from as jest.Mock)().select.mockReturnValue({
        eq: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({ data: { id: 'order1' }, error: null })
        })
      });
      const result = await repository.getOrderByIdAdmin('order1');
      expect(result).toEqual({ id: 'order1' });
    });

    it('throws error', async () => {
      (supabaseAdmin.from as jest.Mock)().select.mockReturnValue({
        eq: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({ data: null, error: new Error('err') })
        })
      });
      await expect(repository.getOrderByIdAdmin('order1')).rejects.toThrow('err');
    });
  });

  describe('getBranchOrders', () => {
    it('gets branch orders', async () => {
      (supabaseAdmin.from as jest.Mock)().select.mockReturnValue({
        eq: jest.fn().mockReturnValue({
          order: jest.fn().mockResolvedValue({ data: [], error: null })
        })
      });
      const result = await repository.getBranchOrders('branch1');
      expect(result).toEqual([]);
    });

    it('throws error', async () => {
      (supabaseAdmin.from as jest.Mock)().select.mockReturnValue({
        eq: jest.fn().mockReturnValue({
          order: jest.fn().mockResolvedValue({ data: null, error: new Error('err') })
        })
      });
      await expect(repository.getBranchOrders('branch1')).rejects.toThrow('err');
    });
  });

  describe('updateOrderStatus', () => {
    it('updates status', async () => {
      (supabaseAdmin.from as jest.Mock)().update.mockReturnValue({
        eq: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({ data: { id: 'order1' }, error: null })
          })
        })
      });
      const result = await repository.updateOrderStatus('order1', 'ready');
      expect(result).toEqual({ id: 'order1' });
    });

    it('updates status with completedAt', async () => {
      (supabaseAdmin.from as jest.Mock)().update.mockReturnValue({
        eq: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({ data: { id: 'order1' }, error: null })
          })
        })
      });
      const result = await repository.updateOrderStatus('order1', 'ready', 'now');
      expect(result).toEqual({ id: 'order1' });
    });

    it('throws error', async () => {
      (supabaseAdmin.from as jest.Mock)().update.mockReturnValue({
        eq: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({ data: null, error: new Error('err') })
          })
        })
      });
      await expect(repository.updateOrderStatus('order1', 'ready')).rejects.toThrow('err');
    });
  });
});
