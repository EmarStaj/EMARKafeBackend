import { OrderRepository, OrderItemInput } from './order.repository';
import { CartRepository } from '../cart/cart.repository';
import { AppError } from '../../utils/app-error';

export class OrderService {
  private orderRepository: OrderRepository;
  private cartRepository: CartRepository;

  constructor() {
    this.orderRepository = new OrderRepository();
    this.cartRepository = new CartRepository();
  }

  /**
   * Place an order from the user's current cart items.
   */
  async placeOrder(userId: string, orderData: { table_number?: string; notes?: string }, token: string) {
    // 1. Retrieve current cart items
    const cartItems = await this.cartRepository.getCart(token);
    if (!cartItems || cartItems.length === 0) {
      throw new AppError('Cannot place an order. Your cart is empty.', 400);
    }

    // 2. Calculate total amount & prepare order items list
    let totalAmount = 0;
    const itemsToInsert: Omit<OrderItemInput, 'order_id'>[] = [];

    for (const item of cartItems) {
      const menuItem = item.menu_items as any;
      if (!menuItem) {
        throw new AppError('Cart contains an invalid or deleted menu item.', 400);
      }
      
      const itemPrice = menuItem.price;
      totalAmount += itemPrice * item.quantity;

      itemsToInsert.push({
        menu_item_id: item.menu_item_id,
        quantity: item.quantity,
        price_at_order: itemPrice,
      });
    }

    try {
      // 3. Create the order header
      const order = await this.orderRepository.createOrder({
        user_id: userId,
        total_amount: totalAmount,
        notes: orderData.notes,
        table_number: orderData.table_number,
      }, token);

      // 4. Attach order_id to prepared order items and insert
      const orderItems: OrderItemInput[] = itemsToInsert.map(item => ({
        ...item,
        order_id: order.id,
      }));
      await this.orderRepository.createOrderItems(orderItems, token);

      // 5. Empty the user's cart
      await this.cartRepository.clearCart(userId, token);

      // 6. Return the fully populated order details
      return await this.orderRepository.getOrderById(order.id, token);
    } catch (error: any) {
      throw new AppError(error.message || 'Failed to complete order checkout.', 400);
    }
  }

  /**
   * Get order history.
   */
  async getOrders(userId: string, token: string) {
    try {
      return await this.orderRepository.getOrders(userId, token);
    } catch (error: any) {
      throw new AppError(error.message || 'Failed to retrieve order history.', 400);
    }
  }

  /**
   * Get detailed view of a single order.
   */
  async getOrderById(orderId: string, token: string) {
    try {
      return await this.orderRepository.getOrderById(orderId, token);
    } catch (error: any) {
      const isNotFound = error.code === 'PGRST116';
      throw new AppError(
        isNotFound ? 'Order not found.' : error.message,
        isNotFound ? 404 : 400
      );
    }
  }
}
