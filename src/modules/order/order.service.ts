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

    // 2. Calculate total price and map order items
    let totalPrice = 0;
    const itemsToInsert: Omit<OrderItemInput, 'order_id'>[] = [];

    for (const item of cartItems) {
      const product = item.products as any;
      if (!product) {
        throw new AppError('Cart contains invalid product.', 400);
      }

      const itemTotalPrice = Number(item.unit_price) * item.quantity;
      totalPrice += itemTotalPrice;

      // Copying snapshots of names at checkout
      const productName = product.name || 'Unknown Product';
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
      await this.cartRepository.updateCartStatus(cart.id, 'converted', token);

      // 6. Return the fully populated order receipt
      return await this.orderRepository.getOrderById(order.id, token);
    } catch (error: any) {
      throw new AppError(error.message || 'Failed to place order.', 400);
    }
  }

  async getOrders(userId: string, token: string) {
    try {
      return await this.orderRepository.getOrders(userId, token);
    } catch (error: any) {
      throw new AppError(error.message || 'Failed to retrieve order history.', 400);
    }
  }

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
