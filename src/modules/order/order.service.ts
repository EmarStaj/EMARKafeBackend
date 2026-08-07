import { injectable } from 'tsyringe';
import { OrderRepository, OrderItemInput } from './order.repository';
import { CartRepository } from '../cart/cart.repository';
import { LoyaltyService } from '../loyalty/loyalty.service';
import { AppError, rethrowAsAppError } from '../../utils/app-error';
import { supabaseAdmin, getSupabaseForUser } from '../../config/supabase';
import { UserProfile } from '../../types';
import { logger } from '../../config/logger';
import { WalletService } from '../wallet/wallet.service';

@injectable()
export class OrderService {
  private orderRepository: OrderRepository;
  private cartRepository: CartRepository;
  private loyaltyService: LoyaltyService;
  private walletService: WalletService;

  constructor() {
    this.orderRepository = new OrderRepository();
    this.cartRepository = new CartRepository();
    this.loyaltyService = new LoyaltyService();
    this.walletService = new WalletService();
  }

  /**
   * Place an order from the user's active cart.
   */
  async placeOrder(userId: string, branchId: string, token: string) {
    // 1. Fetch active cart and items
    const cartData = await this.cartRepository.getCart(userId, token);
    const cart = cartData.cart;
    const cartItems = cartData.items;

    if (!cartItems || cartItems.length === 0) {
      throw new AppError('Cannot place an order. Your cart is empty.', 400);
    }

    // 2. Fetch stock availability for all cart items at the target branch in one query
    const productIds = cartItems.map(item => item.product_id);
    const { data: availabilityList, error: availabilityError } = await supabaseAdmin
      .from('branch_products')
      .select('product_id, is_available')
      .eq('branch_id', branchId)
      .in('product_id', productIds);

    if (availabilityError) {
      throw new AppError('Failed to verify product availability at this branch.', 400);
    }

    const availabilityMap = new Map<string, boolean>();
    availabilityList?.forEach(ap => {
      availabilityMap.set(ap.product_id, ap.is_available);
    });

    // 3. Calculate total price, validate stock, and map order items
    let totalPrice = 0;
    const itemsToInsert: Omit<OrderItemInput, 'order_id'>[] = [];

    for (const item of cartItems) {
      const product = item.products as any;
      if (!product) {
        throw new AppError('Cart contains invalid product.', 400);
      }

      // If a record exists in branch_products and is_available is explicitly false, it is out of stock!
      const isAvailable = availabilityMap.get(item.product_id);
      const productName = product.name || 'Unknown Product';
      
      if (isAvailable === false) {
        throw new AppError(`Product "${productName}" is currently out of stock at this branch.`, 400);
      }

      const itemTotalPrice = Number(item.unit_price) * item.quantity;
      totalPrice += itemTotalPrice;

      // Copying snapshots of names at checkout
      const categoryName = product.categories?.name || 'General';

      itemsToInsert.push({
        product_id: item.product_id,
        quantity: item.quantity,
        selected_options: item.selected_options || [],
        unit_price: Number(item.unit_price),
        product_name: productName,
        category_name: categoryName
      });
    }

    try {
      // 3. Create the order header
      const order = await this.orderRepository.createOrder({
        user_id: userId,
        branch_id: branchId,
        total_price: totalPrice,
        status: 'created'
      }, token);

      // 4. Attach order_id and insert order items
      const orderItems: OrderItemInput[] = itemsToInsert.map(item => ({
        ...item,
        order_id: order.id
      }));
      await this.orderRepository.createOrderItems(orderItems, token);

      // 5. Update the cart status to 'converted' (it's checked out, no longer active)
      await this.cartRepository.updateCartStatus(cart.id, 'converted');

      // 6. Return the fully populated order receipt
      return await this.orderRepository.getOrderById(order.id, token);
    } catch (error: unknown) {
      rethrowAsAppError(error, 'Failed to place order.');
    }
  }

  /**
   * Barista scans customer QR token to process payment and place the order
   */
  async scanQRAndCheckout(qrToken: string, branchId: string, baristaToken: string) {
    // 1. Verify QR and extract customerId
    const customerId = this.walletService.verifyQrToken(qrToken);

    // 2. Fetch active cart for the customer (using admin privileges since barista is calling)
    // We need to extend cartRepository or use supabaseAdmin directly
    const cartData = await this.cartRepository.getCart(customerId, baristaToken, true);
    const cart = cartData.cart;
    const cartItems = cartData.items;

    if (!cartItems || cartItems.length === 0) {
      throw new AppError('Customer cart is empty.', 400);
    }

    // 3. Check stock availability
    const productIds = cartItems.map(item => item.product_id);
    const { data: availabilityList, error: availabilityError } = await supabaseAdmin
      .from('branch_products')
      .select('product_id, is_available')
      .eq('branch_id', branchId)
      .in('product_id', productIds);

    if (availabilityError) {
      throw new AppError('Failed to verify product availability.', 400);
    }

    const availabilityMap = new Map<string, boolean>();
    availabilityList?.forEach(ap => {
      availabilityMap.set(ap.product_id, ap.is_available);
    });

    let totalPrice = 0;
    const itemsToInsert: Omit<OrderItemInput, 'order_id'>[] = [];

    for (const item of cartItems) {
      const product = item.products as any;
      if (!product) throw new AppError('Cart contains invalid product.', 400);

      const isAvailable = availabilityMap.get(item.product_id);
      const productName = product.name || 'Unknown Product';
      
      if (isAvailable === false) {
        throw new AppError(`Product "${productName}" is currently out of stock.`, 400);
      }

      totalPrice += Number(item.unit_price) * item.quantity;
      itemsToInsert.push({
        product_id: item.product_id,
        quantity: item.quantity,
        selected_options: item.selected_options || [],
        unit_price: Number(item.unit_price),
        product_name: productName,
        category_name: product.categories?.name || 'General'
      });
    }

    try {
      // 4. Create the order header
      const order = await this.orderRepository.createOrder({
        user_id: customerId,
        branch_id: branchId,
        total_price: totalPrice,
        status: 'created'
      }, baristaToken, true);

      // 5. Attempt to deduct balance via RPC
      const supabase = getSupabaseForUser(baristaToken);
      const { data: deductSuccess, error: deductError } = await supabase.rpc('deduct_balance', {
        p_user_id: customerId,
        p_amount: totalPrice,
        p_order_id: order.id
      });

      if (deductError || !deductSuccess) {
        // Cancel the order if payment fails
        await supabaseAdmin.from('orders').update({ status: 'cancelled' }).eq('id', order.id);
        throw new AppError('Insufficient balance. Order cancelled.', 400);
      }

      // 6. Payment successful: Attach order_id and insert order items
      const orderItems: OrderItemInput[] = itemsToInsert.map(item => ({
        ...item,
        order_id: order.id
      }));
      await this.orderRepository.createOrderItems(orderItems, baristaToken, true);

      // 7. Update the cart status to 'converted'
      await this.cartRepository.updateCartStatus(cart.id, 'converted');

      // 8. Return the fully populated order receipt
      return await this.orderRepository.getOrderById(order.id, baristaToken, true);
    } catch (error: unknown) {
      rethrowAsAppError(error, 'Failed to process QR checkout.');
    }
  }

  async getOrders(userId: string, token: string) {
    try {
      return await this.orderRepository.getOrders(userId, token);
    } catch (error: unknown) {
      rethrowAsAppError(error, 'Failed to retrieve order history.');
    }
  }

  async getOrderById(orderId: string, token: string) {
    try {
      return await this.orderRepository.getOrderById(orderId, token);
    } catch (error: unknown) {
      if (error instanceof AppError) throw error;
      const isNotFound = (error as any).code === 'PGRST116';
      throw new AppError(
        isNotFound ? 'Order not found.' : (error instanceof Error ? error.message : 'Failed to retrieve order.'),
        isNotFound ? 404 : 400
      );
    }
  }

  /**
   * Fetch all orders for a branch (Barista/Manager view).
   */
  async getBranchOrders(branchId: string) {
    try {
      return await this.orderRepository.getBranchOrders(branchId);
    } catch (error: unknown) {
      rethrowAsAppError(error, 'Failed to retrieve branch orders.');
    }
  }

  /**
   * Update order status by a barista or branch manager.
   * If status transitions to 'completed', awards stamps for loyalty eligible products.
   */
  async updateOrderStatus(orderId: string, status: 'created' | 'preparing' | 'ready' | 'completed' | 'cancelled', userProfile: UserProfile) {
    try {
      // 1. Fetch order details (bypassing user RLS using admin)
      const order = await this.orderRepository.getOrderByIdAdmin(orderId);
      if (!order) {
        throw new AppError('Order not found.', 404);
      }

      // 2. Baristas can only process orders from their own branch!
      if (userProfile.role === 'barista' && userProfile.branch_id !== order.branch_id) {
        throw new AppError('Forbidden: Baristas can only update orders belonging to their own branch.', 403);
      }

      // 3. Perform update (and set completed_at timestamp if status is 'completed')
      const completedAt = status === 'completed' ? new Date().toISOString() : undefined;
      const updatedOrder = await this.orderRepository.updateOrderStatus(orderId, status, completedAt);

      // 4. If status is completed, process loyalty points
      // NOTE: product loyalty data is already joined in getOrderByIdAdmin — no N+1 queries.
      if (status === 'completed' && order.order_items) {
        for (const item of order.order_items) {
          try {
            // Use the pre-joined product data instead of fetching each product separately
            const product = (item as any).products;
            if (product && product.is_loyalty_eligible) {
              await this.loyaltyService.addStampsForProduct(order.user_id, product.category_id, item.quantity);
            }
          } catch (e) {
            logger.error(`Failed to process loyalty stamps for order item ${item.id}:`, e);
          }
        }
      }

      // 5. Simulate push notification triggers
      if (status === 'ready') {
        logger.info(`[Push Notification Simulator] Sent: 'Siparişiniz Hazır!' to user ${order.user_id}`);
      }

      return updatedOrder;
    } catch (error: unknown) {
      rethrowAsAppError(error, 'Failed to update order status.');
    }
  }

  /**
   * Cancel an order by the customer. Only allowed before preparation begins ('created' status).
   */
  async cancelOrder(orderId: string, userId: string, token: string) {
    try {
      // Fetch order details
      const order = await this.orderRepository.getOrderById(orderId, token);
      if (!order || order.user_id !== userId) {
        throw new AppError('Order not found.', 404);
      }

      // Customers can only cancel orders in 'created' state
      if (order.status !== 'created') {
        throw new AppError('Cannot cancel order. The preparation has already started.', 400);
      }

      return await this.orderRepository.updateOrderStatus(orderId, 'cancelled');
    } catch (error: unknown) {
      rethrowAsAppError(error, 'Failed to cancel order.');
    }
  }
}
