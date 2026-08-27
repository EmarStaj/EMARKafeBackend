import { OrderService } from '../order.service';
import { supabaseAdmin } from '../../../config/supabase';
import { AppError } from '../../../utils/app-error';

jest.mock('../../../config/supabase', () => ({
  supabaseAdmin: {
    from: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    in: jest.fn().mockReturnThis(),
    single: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    rpc: jest.fn(),
  }
}));

describe('OrderService', () => {
  let service: OrderService;
  let mockOrderRepo: any;
  let mockCartRepo: any;
  let mockLoyaltyService: any;
  let mockWalletService: any;
  let mockNotificationService: any;

  beforeEach(() => {
    mockOrderRepo = {
      createOrder: jest.fn(),
      createOrderItems: jest.fn(),
      getOrderById: jest.fn(),
      getOrderByIdAdmin: jest.fn(),
      getOrders: jest.fn(),
      getBranchOrders: jest.fn(),
      updateOrderStatus: jest.fn(),
    };
    mockCartRepo = {
      getCart: jest.fn(),
      updateCartStatus: jest.fn(),
      clearCart: jest.fn(),
    };
    mockLoyaltyService = {
      addStampsForProduct: jest.fn(),
    };
    mockWalletService = {
      verifyQrToken: jest.fn(),
    };
    mockNotificationService = {
      sendToUser: jest.fn(),
    };

    service = new OrderService(
      mockOrderRepo,
      mockCartRepo,
      mockLoyaltyService,
      mockWalletService,
      mockNotificationService
    );
    jest.clearAllMocks();
  });

  describe('placeOrder', () => {
    it('throws if cart is empty', async () => {
      mockCartRepo.getCart.mockResolvedValue({ cart: {}, items: [] });
      await expect(service.placeOrder('u1', 'b1', 't1')).rejects.toThrow('cart is empty');
    });

    it('throws on availability check error', async () => {
      mockCartRepo.getCart.mockResolvedValue({
        cart: {}, items: [{ product_id: 'p1', quantity: 1, unit_price: 10, products: {} }]
      });
      (supabaseAdmin.from as jest.Mock)().in.mockResolvedValue({ data: null, error: new Error('err') });
      await expect(service.placeOrder('u1', 'b1', 't1')).rejects.toThrow('Failed to verify product availability');
    });

    it('throws if item out of stock', async () => {
      mockCartRepo.getCart.mockResolvedValue({
        cart: {}, items: [{ product_id: 'p1', quantity: 1, unit_price: 10, products: { name: 'P1' } }]
      });
      (supabaseAdmin.from as jest.Mock)().in.mockResolvedValue({ data: [{ product_id: 'p1', is_available: false }], error: null });
      await expect(service.placeOrder('u1', 'b1', 't1')).rejects.toThrow(AppError);
    });
    
    it('throws if invalid product', async () => {
      mockCartRepo.getCart.mockResolvedValue({
        cart: {}, items: [{ product_id: 'p1', quantity: 1, unit_price: 10 }]
      });
      (supabaseAdmin.from as jest.Mock)().in.mockResolvedValue({ data: [{ product_id: 'p1', is_available: true }], error: null });
      await expect(service.placeOrder('u1', 'b1', 't1')).rejects.toThrow('Cart contains invalid product');
    });

    it('throws on missing profile', async () => {
      mockCartRepo.getCart.mockResolvedValue({
        cart: {}, items: [{ product_id: 'p1', quantity: 1, unit_price: 10, products: { name: 'P1' } }]
      });
      (supabaseAdmin.from as jest.Mock)().in.mockResolvedValueOnce({ data: [{ product_id: 'p1', is_available: true }], error: null });
      (supabaseAdmin.from as jest.Mock)().single.mockResolvedValueOnce({ data: null, error: new Error('err') });
      await expect(service.placeOrder('u1', 'b1', 't1')).rejects.toThrow('Failed to fetch user wallet balance');
    });

    it('throws on insufficient balance', async () => {
      mockCartRepo.getCart.mockResolvedValue({
        cart: {}, items: [{ product_id: 'p1', quantity: 1, unit_price: 10, products: { name: 'P1' } }]
      });
      (supabaseAdmin.from as jest.Mock)().in.mockResolvedValueOnce({ data: [{ product_id: 'p1', is_available: true }], error: null });
      (supabaseAdmin.from as jest.Mock)().single.mockResolvedValueOnce({ data: { balance: 5 }, error: null });
      await expect(service.placeOrder('u1', 'b1', 't1')).rejects.toThrow('Insufficient wallet balance');
    });

    it('throws on payment error and rollbacks', async () => {
      mockCartRepo.getCart.mockResolvedValue({
        cart: {}, items: [{ product_id: 'p1', quantity: 1, unit_price: 10, products: { name: 'P1' } }]
      });
      (supabaseAdmin.from as jest.Mock)().in.mockResolvedValueOnce({ data: [{ product_id: 'p1', is_available: true }], error: null });
      (supabaseAdmin.from as jest.Mock)().single.mockResolvedValueOnce({ data: { balance: 20 }, error: null });
      mockOrderRepo.createOrder.mockResolvedValue({ id: 'o1' });
      (supabaseAdmin.rpc as jest.Mock).mockResolvedValue({ data: null, error: new Error('err') });
      (supabaseAdmin.from as jest.Mock)().update.mockReturnValue({ eq: jest.fn().mockResolvedValue({}) });
      await expect(service.placeOrder('u1', 'b1', 't1')).rejects.toThrow('Insufficient wallet balance');
    });

    it('success', async () => {
      mockCartRepo.getCart.mockResolvedValue({
        cart: { id: 'c1' }, items: [{ product_id: 'p1', quantity: 1, unit_price: 10, products: { name: 'P1' } }]
      });
      (supabaseAdmin.from as jest.Mock)().in.mockResolvedValueOnce({ data: [{ product_id: 'p1', is_available: true }], error: null });
      (supabaseAdmin.from as jest.Mock)().single.mockResolvedValueOnce({ data: { balance: 20 }, error: null });
      mockOrderRepo.createOrder.mockResolvedValue({ id: 'o1' });
      (supabaseAdmin.rpc as jest.Mock).mockResolvedValue({ data: true, error: null });
      mockOrderRepo.getOrderById.mockResolvedValue({ id: 'o1' });
      
      const result = await service.placeOrder('u1', 'b1', 't1');
      expect(result).toEqual({ id: 'o1' });
      expect(mockOrderRepo.createOrderItems).toHaveBeenCalled();
      expect(mockCartRepo.updateCartStatus).toHaveBeenCalledWith('c1', 'converted');
    });
  });

  describe('scanQRAndCheckout', () => {
    it('throws if cart empty', async () => {
      mockWalletService.verifyQrToken.mockReturnValue('u1');
      mockCartRepo.getCart.mockResolvedValue({ cart: {}, items: [] });
      await expect(service.scanQRAndCheckout('qr', 'b1', 't1')).rejects.toThrow('empty');
    });

    it('throws if availability error', async () => {
      mockWalletService.verifyQrToken.mockReturnValue('u1');
      mockCartRepo.getCart.mockResolvedValue({
        cart: {}, items: [{ product_id: 'p1', quantity: 1, unit_price: 10, products: { name: 'P1' } }]
      });
      (supabaseAdmin.from as jest.Mock)().in.mockResolvedValue({ data: null, error: new Error('err') });
      await expect(service.scanQRAndCheckout('qr', 'b1', 't1')).rejects.toThrow('availability');
    });

    it('throws if invalid product', async () => {
      mockWalletService.verifyQrToken.mockReturnValue('u1');
      mockCartRepo.getCart.mockResolvedValue({
        cart: {}, items: [{ product_id: 'p1', quantity: 1, unit_price: 10 }]
      });
      (supabaseAdmin.from as jest.Mock)().in.mockResolvedValue({ data: [{ product_id: 'p1', is_available: true }], error: null });
      await expect(service.scanQRAndCheckout('qr', 'b1', 't1')).rejects.toThrow('Cart contains invalid product');
    });

    it('throws if product out of stock', async () => {
      mockWalletService.verifyQrToken.mockReturnValue('u1');
      mockCartRepo.getCart.mockResolvedValue({
        cart: {}, items: [{ product_id: 'p1', quantity: 1, unit_price: 10, products: { name: 'P1' } }]
      });
      (supabaseAdmin.from as jest.Mock)().in.mockResolvedValue({ data: [{ product_id: 'p1', is_available: false }], error: null });
      await expect(service.scanQRAndCheckout('qr', 'b1', 't1')).rejects.toThrow('out of stock');
    });

    it('throws if balance error', async () => {
      mockWalletService.verifyQrToken.mockReturnValue('u1');
      mockCartRepo.getCart.mockResolvedValue({
        cart: {}, items: [{ product_id: 'p1', quantity: 1, unit_price: 10, products: { name: 'P1' } }]
      });
      (supabaseAdmin.from as jest.Mock)().in.mockResolvedValueOnce({ data: [{ product_id: 'p1', is_available: true }], error: null });
      (supabaseAdmin.from as jest.Mock)().single.mockResolvedValueOnce({ data: null, error: new Error('err') });
      await expect(service.scanQRAndCheckout('qr', 'b1', 't1')).rejects.toThrow('balance');
    });

    it('throws if insufficient balance', async () => {
      mockWalletService.verifyQrToken.mockReturnValue('u1');
      mockCartRepo.getCart.mockResolvedValue({
        cart: {}, items: [{ product_id: 'p1', quantity: 1, unit_price: 10, products: { name: 'P1' } }]
      });
      (supabaseAdmin.from as jest.Mock)().in.mockResolvedValueOnce({ data: [{ product_id: 'p1', is_available: true }], error: null });
      (supabaseAdmin.from as jest.Mock)().single.mockResolvedValueOnce({ data: { balance: 5 }, error: null });
      await expect(service.scanQRAndCheckout('qr', 'b1', 't1')).rejects.toThrow('balance');
    });

    it('throws on payment error', async () => {
      mockWalletService.verifyQrToken.mockReturnValue('u1');
      mockCartRepo.getCart.mockResolvedValue({
        cart: {}, items: [{ product_id: 'p1', quantity: 1, unit_price: 10, products: { name: 'P1' } }]
      });
      (supabaseAdmin.from as jest.Mock)().in.mockResolvedValueOnce({ data: [{ product_id: 'p1', is_available: true }], error: null });
      (supabaseAdmin.from as jest.Mock)().single.mockResolvedValueOnce({ data: { balance: 20 }, error: null });
      mockOrderRepo.createOrder.mockResolvedValue({ id: 'o1' });
      (supabaseAdmin.rpc as jest.Mock).mockResolvedValue({ data: null, error: new Error('err') });
      await expect(service.scanQRAndCheckout('qr', 'b1', 't1')).rejects.toThrow('wallet balance');
    });

    it('success', async () => {
      mockWalletService.verifyQrToken.mockReturnValue('u1');
      mockCartRepo.getCart.mockResolvedValue({
        cart: { id: 'c1' }, items: [{ product_id: 'p1', quantity: 1, unit_price: 10, products: { name: 'P1' } }]
      });
      (supabaseAdmin.from as jest.Mock)().in.mockResolvedValueOnce({ data: [{ product_id: 'p1', is_available: true }], error: null });
      (supabaseAdmin.from as jest.Mock)().single.mockResolvedValueOnce({ data: { balance: 20 }, error: null });
      mockOrderRepo.createOrder.mockResolvedValue({ id: 'o1' });
      (supabaseAdmin.rpc as jest.Mock).mockResolvedValue({ data: true, error: null });
      mockOrderRepo.getOrderById.mockResolvedValue({ id: 'o1' });

      const result = await service.scanQRAndCheckout('qr', 'b1', 't1');
      expect(result).toEqual({ id: 'o1' });
      expect(mockCartRepo.clearCart).toHaveBeenCalledWith('c1');
    });
  });

  describe('getOrders', () => {
    it('success', async () => {
      mockOrderRepo.getOrders.mockResolvedValue([]);
      expect(await service.getOrders('u1', 't1')).toEqual([]);
    });
    it('failure', async () => {
      mockOrderRepo.getOrders.mockRejectedValue(new Error('err'));
      await expect(service.getOrders('u1', 't1')).rejects.toThrow();
    });
  });

  describe('getOrderById', () => {
    it('success', async () => {
      mockOrderRepo.getOrderById.mockResolvedValue({ id: 'o1' });
      expect(await service.getOrderById('o1', 't1')).toEqual({ id: 'o1' });
    });
    it('failure app error', async () => {
      mockOrderRepo.getOrderById.mockRejectedValue(new AppError('err', 400));
      await expect(service.getOrderById('o1', 't1')).rejects.toThrow(AppError);
    });
    it('failure not found', async () => {
      const e = new Error('err');
      (e as any).code = 'PGRST116';
      mockOrderRepo.getOrderById.mockRejectedValue(e);
      await expect(service.getOrderById('o1', 't1')).rejects.toThrow('Order not found.');
    });
    it('failure other', async () => {
      mockOrderRepo.getOrderById.mockRejectedValue(new Error('err'));
      await expect(service.getOrderById('o1', 't1')).rejects.toThrow('err');
    });
  });

  describe('getBranchOrders', () => {
    it('success', async () => {
      mockOrderRepo.getBranchOrders.mockResolvedValue([]);
      expect(await service.getBranchOrders('b1')).toEqual([]);
    });
    it('failure', async () => {
      mockOrderRepo.getBranchOrders.mockRejectedValue(new Error('err'));
      await expect(service.getBranchOrders('b1')).rejects.toThrow();
    });
  });

  describe('updateOrderStatus', () => {
    it('throws if not found', async () => {
      mockOrderRepo.getOrderByIdAdmin.mockResolvedValue(null);
      await expect(service.updateOrderStatus('o1', 'ready', { role: 'admin' } as any)).rejects.toThrow('not found');
    });
    it('throws if barista wrong branch', async () => {
      mockOrderRepo.getOrderByIdAdmin.mockResolvedValue({ branch_id: 'b1' });
      await expect(service.updateOrderStatus('o1', 'ready', { role: 'barista', branch_id: 'b2' } as any)).rejects.toThrow('Forbidden');
    });
    it('returns if same status', async () => {
      mockOrderRepo.getOrderByIdAdmin.mockResolvedValue({ branch_id: 'b1', status: 'ready' });
      const result = await service.updateOrderStatus('o1', 'ready', { role: 'admin' } as any);
      expect(result).toEqual({ branch_id: 'b1', status: 'ready' });
    });
    it('throws if already completed', async () => {
      mockOrderRepo.getOrderByIdAdmin.mockResolvedValue({ branch_id: 'b1', status: 'completed' });
      await expect(service.updateOrderStatus('o1', 'ready', { role: 'admin' } as any)).rejects.toThrow('already completed');
    });
    it('updates to ready', async () => {
      mockOrderRepo.getOrderByIdAdmin.mockResolvedValue({ branch_id: 'b1', status: 'created', user_id: 'u1' });
      mockOrderRepo.updateOrderStatus.mockResolvedValue({ id: 'o1' });
      await service.updateOrderStatus('o1', 'ready', { role: 'admin' } as any);
      expect(mockOrderRepo.updateOrderStatus).toHaveBeenCalledWith('o1', 'ready', expect.objectContaining({ ready_at: expect.any(String) }));
      expect(mockNotificationService.sendToUser).toHaveBeenCalledWith('u1', expect.stringContaining('Hazır'), expect.any(String));
    });
    it('updates to preparing', async () => {
      mockOrderRepo.getOrderByIdAdmin.mockResolvedValue({ branch_id: 'b1', status: 'created', user_id: 'u1' });
      mockOrderRepo.updateOrderStatus.mockResolvedValue({ id: 'o1' });
      await service.updateOrderStatus('o1', 'preparing', { role: 'admin' } as any);
      expect(mockOrderRepo.updateOrderStatus).toHaveBeenCalledWith('o1', 'preparing', expect.anything());
      expect(mockNotificationService.sendToUser).toHaveBeenCalledWith('u1', expect.stringContaining('Hazırlanıyor'), expect.any(String));
    });
    it('updates to cancelled and processes refund if total_price > 0', async () => {
      mockOrderRepo.getOrderByIdAdmin.mockResolvedValue({
        id: 'o1', branch_id: 'b1', status: 'created', user_id: 'u1', total_price: 150, payment_status: 'paid'
      });
      (supabaseAdmin.rpc as jest.Mock).mockResolvedValue({ error: null });
      mockOrderRepo.updateOrderStatus.mockResolvedValue({ id: 'o1' });

      await service.updateOrderStatus('o1', 'cancelled', { role: 'admin' } as any);
      expect(supabaseAdmin.rpc).toHaveBeenCalledWith('add_balance', { p_user_id: 'u1', p_amount: 150 });
      expect(mockOrderRepo.updateOrderStatus).toHaveBeenCalledWith('o1', 'cancelled', expect.anything());
      expect(mockNotificationService.sendToUser).toHaveBeenCalledWith('u1', expect.stringContaining('İptal'), expect.any(String));
    });

    it('updates to cancelled and handles refund error gracefully', async () => {
      mockOrderRepo.getOrderByIdAdmin.mockResolvedValue({
        id: 'o1', branch_id: 'b1', status: 'created', user_id: 'u1', total_price: 150, payment_status: 'paid'
      });
      (supabaseAdmin.rpc as jest.Mock).mockResolvedValue({ error: new Error('rpc fail') });
      mockOrderRepo.updateOrderStatus.mockResolvedValue({ id: 'o1' });

      await service.updateOrderStatus('o1', 'cancelled', { role: 'admin' } as any);
      expect(mockOrderRepo.updateOrderStatus).toHaveBeenCalledWith('o1', 'cancelled', expect.anything());
    });
    it('updates to completed', async () => {
      mockOrderRepo.getOrderByIdAdmin.mockResolvedValue({
        branch_id: 'b1', status: 'ready', user_id: 'u1',
        order_items: [{ id: 'i1', quantity: 1, products: { is_loyalty_eligible: true, category_id: 'c1' } }]
      });
      mockOrderRepo.updateOrderStatus.mockResolvedValue({ id: 'o1' });
      await service.updateOrderStatus('o1', 'completed', { role: 'admin' } as any);
      expect(mockOrderRepo.updateOrderStatus).toHaveBeenCalledWith('o1', 'completed', expect.objectContaining({ completed_at: expect.any(String) }));
      expect(mockLoyaltyService.addStampsForProduct).toHaveBeenCalledWith('u1', 'c1', 1);
    });
    it('updates to completed handle loyalty error', async () => {
      mockOrderRepo.getOrderByIdAdmin.mockResolvedValue({
        branch_id: 'b1', status: 'ready', user_id: 'u1',
        order_items: [{ id: 'i1', quantity: 1, products: { is_loyalty_eligible: true, category_id: 'c1' } }]
      });
      mockOrderRepo.updateOrderStatus.mockResolvedValue({ id: 'o1' });
      mockLoyaltyService.addStampsForProduct.mockRejectedValue(new Error('err'));
      await service.updateOrderStatus('o1', 'completed', { role: 'admin' } as any);
      expect(mockOrderRepo.updateOrderStatus).toHaveBeenCalledWith('o1', 'completed', expect.objectContaining({ completed_at: expect.any(String) }));
      expect(mockLoyaltyService.addStampsForProduct).toHaveBeenCalledWith('u1', 'c1', 1);
    });
    it('failure', async () => {
      mockOrderRepo.getOrderByIdAdmin.mockRejectedValue(new Error('err'));
      await expect(service.updateOrderStatus('o1', 'ready', { role: 'admin' } as any)).rejects.toThrow();
    });
  });

  describe('cancelOrder', () => {
    it('throws if not found or wrong user', async () => {
      mockOrderRepo.getOrderById.mockResolvedValue(null);
      await expect(service.cancelOrder('o1', 'u1', 't1')).rejects.toThrow('not found');
      
      mockOrderRepo.getOrderById.mockResolvedValue({ user_id: 'u2' });
      await expect(service.cancelOrder('o1', 'u1', 't1')).rejects.toThrow('not found');
    });
    it('throws if not created status', async () => {
      mockOrderRepo.getOrderById.mockResolvedValue({ user_id: 'u1', status: 'ready' });
      await expect(service.cancelOrder('o1', 'u1', 't1')).rejects.toThrow('already started');
    });
    it('throws if refund fails', async () => {
      mockOrderRepo.getOrderById.mockResolvedValue({ user_id: 'u1', status: 'created', total_price: 10 });
      (supabaseAdmin.rpc as jest.Mock).mockResolvedValue({ data: null, error: new Error('err') });
      await expect(service.cancelOrder('o1', 'u1', 't1')).rejects.toThrow('Failed to refund');
    });
    it('success', async () => {
      mockOrderRepo.getOrderById.mockResolvedValue({ id: 'o1', user_id: 'u1', status: 'created', total_price: 10 });
      (supabaseAdmin.rpc as jest.Mock).mockResolvedValue({ data: true, error: null });
      mockOrderRepo.updateOrderStatus.mockResolvedValue({ id: 'o1' });
      
      const result = await service.cancelOrder('o1', 'u1', 't1');
      expect(result).toEqual({ id: 'o1' });
      expect(supabaseAdmin.from).toHaveBeenCalled(); // to insert wallet_transactions
      expect(mockNotificationService.sendToUser).toHaveBeenCalled();
    });
  });
});
