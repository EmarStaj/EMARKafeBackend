import { CartRepository } from '../cart.repository';
import { supabaseAdmin, getSupabaseForUser } from '../../../config/supabase';

jest.mock('../../../config/supabase', () => ({
  supabaseAdmin: {
    from: jest.fn()
  },
  getSupabaseForUser: jest.fn()
}));

describe('CartRepository', () => {
  let repository: CartRepository;

  beforeEach(() => {
    repository = new CartRepository();
    jest.clearAllMocks();
  });

  const mockBuilder = (methods: any = {}) => {
    const builder: any = {
      select: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      delete: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({ data: {}, error: null }),
      maybeSingle: jest.fn().mockResolvedValue({ data: {}, error: null }),
      ...methods
    };
    // Allow builder to be awaited directly if needed (e.g. for .eq resolving)
    builder.then = function(resolve: any) {
      resolve({ data: this.resolvedData, error: this.resolvedError });
    };
    return builder;
  };

  describe('getOrCreateActiveCart', () => {
    it('should return existing active cart', async () => {
      const activeCart = { id: 'cart-1', user_id: 'user-1', status: 'active' };
      const builder = mockBuilder({
        maybeSingle: jest.fn().mockResolvedValue({ data: activeCart, error: null })
      });
      (supabaseAdmin.from as jest.Mock).mockReturnValue(builder);

      const result = await repository.getOrCreateActiveCart('user-1');
      expect(result).toEqual(activeCart);
      expect(supabaseAdmin.from).toHaveBeenCalledWith('carts');
      expect(builder.select).toHaveBeenCalledWith('*');
      expect(builder.eq).toHaveBeenCalledWith('user_id', 'user-1');
      expect(builder.eq).toHaveBeenCalledWith('status', 'active');
    });

    it('should throw if finding active cart errors', async () => {
      const error = new Error('db error');
      const builder = mockBuilder({
        maybeSingle: jest.fn().mockResolvedValue({ data: null, error })
      });
      (supabaseAdmin.from as jest.Mock).mockReturnValue(builder);

      await expect(repository.getOrCreateActiveCart('user-1')).rejects.toThrow('db error');
    });

    it('should create and return new cart if none exists', async () => {
      const newCart = { id: 'cart-2', user_id: 'user-1', status: 'active' };
      const builder1 = mockBuilder({
        maybeSingle: jest.fn().mockResolvedValue({ data: null, error: null })
      });
      const builder2 = mockBuilder({
        single: jest.fn().mockResolvedValue({ data: newCart, error: null })
      });

      (supabaseAdmin.from as jest.Mock)
        .mockReturnValueOnce(builder1) // For the find
        .mockReturnValueOnce(builder2); // For the insert

      const result = await repository.getOrCreateActiveCart('user-1');
      expect(result).toEqual(newCart);
      expect(supabaseAdmin.from).toHaveBeenCalledWith('carts');
      expect(builder2.insert).toHaveBeenCalledWith({ user_id: 'user-1', status: 'active' });
    });

    it('should throw if creating cart errors', async () => {
      const error = new Error('insert error');
      const builder1 = mockBuilder({
        maybeSingle: jest.fn().mockResolvedValue({ data: null, error: null })
      });
      const builder2 = mockBuilder({
        single: jest.fn().mockResolvedValue({ data: null, error })
      });

      (supabaseAdmin.from as jest.Mock)
        .mockReturnValueOnce(builder1)
        .mockReturnValueOnce(builder2);

      await expect(repository.getOrCreateActiveCart('user-1')).rejects.toThrow('insert error');
    });
  });

  describe('getCart', () => {
    it('should fetch user active cart and items (isAdmin = false, token provided)', async () => {
      const mockCart = { id: 'cart-1', user_id: 'user-1', status: 'active' };
      const mockItems = [{ id: 'item-1', product_id: 'prod-1' }];
      
      const repoGetCartMock = jest.spyOn(repository, 'getOrCreateActiveCart').mockResolvedValue(mockCart as any);
      
      const mockSupabase = {
        from: jest.fn().mockReturnValue(mockBuilder({
          resolvedData: mockItems,
          resolvedError: null,
          eq: jest.fn().mockReturnThis()
        }))
      };
      (getSupabaseForUser as jest.Mock).mockReturnValue(mockSupabase);

      const result = await repository.getCart('user-1', 'mock-token', false);
      expect(result.cart).toEqual(mockCart);
      expect(result.items).toEqual(mockItems);
      expect(getSupabaseForUser).toHaveBeenCalledWith('mock-token');
      
      repoGetCartMock.mockRestore();
    });

    it('should fetch user active cart and items (isAdmin = true)', async () => {
      const mockCart = { id: 'cart-1', user_id: 'user-1', status: 'active' };
      
      const repoGetCartMock = jest.spyOn(repository, 'getOrCreateActiveCart').mockResolvedValue(mockCart as any);
      
      const adminBuilder = mockBuilder({
        resolvedData: [],
        resolvedError: null
      });
      (supabaseAdmin.from as jest.Mock).mockReturnValue(adminBuilder);

      const result = await repository.getCart('user-1', undefined, true);
      expect(result.cart).toEqual(mockCart);
      expect(result.items).toEqual([]);
      expect(supabaseAdmin.from).toHaveBeenCalledWith('cart_items');
      
      repoGetCartMock.mockRestore();
    });

    it('should handle null items from database in getCart', async () => {
      const mockCart = { id: 'cart-1', user_id: 'user-1', status: 'active' };
      
      const repoGetCartMock = jest.spyOn(repository, 'getOrCreateActiveCart').mockResolvedValue(mockCart as any);
      
      const adminBuilder = mockBuilder({
        resolvedData: null,
        resolvedError: null
      });
      (supabaseAdmin.from as jest.Mock).mockReturnValue(adminBuilder);

      const result = await repository.getCart('user-1', undefined, true);
      expect(result.cart).toEqual(mockCart);
      expect(result.items).toEqual([]);
      
      repoGetCartMock.mockRestore();
    });

    it('should throw if getting items errors', async () => {
      const repoGetCartMock = jest.spyOn(repository, 'getOrCreateActiveCart').mockResolvedValue({ id: 'cart-1' } as any);
      const error = new Error('items error');
      const builder = mockBuilder({
        resolvedData: null,
        resolvedError: error
      });
      (supabaseAdmin.from as jest.Mock).mockReturnValue(builder);

      await expect(repository.getCart('user-1')).rejects.toThrow('items error');
      
      repoGetCartMock.mockRestore();
    });
  });

  describe('getCartItemsByProduct', () => {
    it('should return cart items', async () => {
      const items = [{ id: 'item-1' }];
      const builder = mockBuilder({
        resolvedData: items,
        resolvedError: null
      });
      (supabaseAdmin.from as jest.Mock).mockReturnValue(builder);

      const result = await repository.getCartItemsByProduct('cart-1', 'prod-1');
      expect(result).toEqual(items);
      expect(builder.eq).toHaveBeenCalledWith('cart_id', 'cart-1');
      expect(builder.eq).toHaveBeenCalledWith('product_id', 'prod-1');
    });

    it('should handle null data from database in getCartItemsByProduct', async () => {
      const builder = mockBuilder({
        resolvedData: null,
        resolvedError: null
      });
      (supabaseAdmin.from as jest.Mock).mockReturnValue(builder);

      const result = await repository.getCartItemsByProduct('cart-1', 'prod-1');
      expect(result).toEqual([]);
    });

    it('should throw error if query fails', async () => {
      const builder = mockBuilder({
        resolvedData: null,
        resolvedError: new Error('db error')
      });
      (supabaseAdmin.from as jest.Mock).mockReturnValue(builder);

      await expect(repository.getCartItemsByProduct('cart-1', 'prod-1')).rejects.toThrow('db error');
    });
  });

  describe('addToCart', () => {
    it('should add item and return it', async () => {
      const mockData = { id: 'item-1' };
      const builder = mockBuilder({
        single: jest.fn().mockResolvedValue({ data: mockData, error: null })
      });
      (supabaseAdmin.from as jest.Mock).mockReturnValue(builder);

      const result = await repository.addToCart({ cart_id: 'cart-1', product_id: 'prod-1', quantity: 2, unit_price: 10 });
      expect(result).toEqual(mockData);
      expect(builder.insert).toHaveBeenCalledWith(expect.objectContaining({ cart_id: 'cart-1', product_id: 'prod-1' }));
    });

    it('should use empty array if selected_options is not provided', async () => {
      const mockData = { id: 'item-1' };
      const builder = mockBuilder({
        single: jest.fn().mockResolvedValue({ data: mockData, error: null })
      });
      (supabaseAdmin.from as jest.Mock).mockReturnValue(builder);

      await repository.addToCart({ cart_id: 'cart-1', product_id: 'prod-1', quantity: 2, unit_price: 10 });
      expect(builder.insert).toHaveBeenCalledWith(expect.objectContaining({ selected_options: [] }));
    });

    it('should throw error if insert fails', async () => {
      const builder = mockBuilder({
        single: jest.fn().mockResolvedValue({ data: null, error: new Error('insert fail') })
      });
      (supabaseAdmin.from as jest.Mock).mockReturnValue(builder);

      await expect(repository.addToCart({ cart_id: 'cart-1', product_id: 'prod-1', quantity: 2, unit_price: 10 })).rejects.toThrow('insert fail');
    });
  });

  describe('updateCartItem', () => {
    it('should update item and return it', async () => {
      const mockData = { id: 'item-1', quantity: 3 };
      const builder = mockBuilder({
        single: jest.fn().mockResolvedValue({ data: mockData, error: null })
      });
      (supabaseAdmin.from as jest.Mock).mockReturnValue(builder);

      const result = await repository.updateCartItem('item-1', 3);
      expect(result).toEqual(mockData);
      expect(builder.update).toHaveBeenCalledWith({ quantity: 3 });
      expect(builder.eq).toHaveBeenCalledWith('id', 'item-1');
    });

    it('should throw error if update fails', async () => {
      const builder = mockBuilder({
        single: jest.fn().mockResolvedValue({ data: null, error: new Error('update fail') })
      });
      (supabaseAdmin.from as jest.Mock).mockReturnValue(builder);

      await expect(repository.updateCartItem('item-1', 3)).rejects.toThrow('update fail');
    });
  });

  describe('removeFromCart', () => {
    it('should remove item', async () => {
      const builder = mockBuilder({
        resolvedData: null,
        resolvedError: null
      });
      (supabaseAdmin.from as jest.Mock).mockReturnValue(builder);

      await repository.removeFromCart('item-1');
      expect(builder.delete).toHaveBeenCalled();
      expect(builder.eq).toHaveBeenCalledWith('id', 'item-1');
    });

    it('should throw error if remove fails', async () => {
      const builder = mockBuilder({
        resolvedData: null,
        resolvedError: new Error('delete fail')
      });
      (supabaseAdmin.from as jest.Mock).mockReturnValue(builder);

      await expect(repository.removeFromCart('item-1')).rejects.toThrow('delete fail');
    });
  });

  describe('clearCart', () => {
    it('should clear cart items', async () => {
      const builder = mockBuilder({
        resolvedData: null,
        resolvedError: null
      });
      (supabaseAdmin.from as jest.Mock).mockReturnValue(builder);

      await repository.clearCart('cart-1');
      expect(builder.delete).toHaveBeenCalled();
      expect(builder.eq).toHaveBeenCalledWith('cart_id', 'cart-1');
    });

    it('should throw error if clear fails', async () => {
      const builder = mockBuilder({
        resolvedData: null,
        resolvedError: new Error('clear fail')
      });
      (supabaseAdmin.from as jest.Mock).mockReturnValue(builder);

      await expect(repository.clearCart('cart-1')).rejects.toThrow('clear fail');
    });
  });

  describe('updateCartStatus', () => {
    it('should update status and return cart', async () => {
      const mockData = { id: 'cart-1', status: 'converted' };
      const builder = mockBuilder({
        single: jest.fn().mockResolvedValue({ data: mockData, error: null })
      });
      (supabaseAdmin.from as jest.Mock).mockReturnValue(builder);

      const result = await repository.updateCartStatus('cart-1', 'converted');
      expect(result).toEqual(mockData);
      expect(builder.update).toHaveBeenCalledWith({ status: 'converted' });
      expect(builder.eq).toHaveBeenCalledWith('id', 'cart-1');
    });

    it('should throw error if update status fails', async () => {
      const builder = mockBuilder({
        single: jest.fn().mockResolvedValue({ data: null, error: new Error('status fail') })
      });
      (supabaseAdmin.from as jest.Mock).mockReturnValue(builder);

      await expect(repository.updateCartStatus('cart-1', 'converted')).rejects.toThrow('status fail');
    });
  });
});
