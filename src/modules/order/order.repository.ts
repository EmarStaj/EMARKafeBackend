import { getSupabaseForUser } from '../../config/supabase';

export interface OrderInput {
  user_id: string;
  total_amount: number;
  status?: string;
  notes?: string;
  table_number?: string;
}

export interface OrderItemInput {
  order_id: string;
  menu_item_id: string;
  quantity: number;
  price_at_order: number;
}

export class OrderRepository {
  /**
   * Create an order header record.
   */
  async createOrder(order: OrderInput, token: string) {
    const supabaseClient = getSupabaseForUser(token);
    const { data, error } = await supabaseClient
      .from('orders')
      .insert(order)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Insert items belonging to an order.
   */
  async createOrderItems(orderItems: OrderItemInput[], token: string) {
    const supabaseClient = getSupabaseForUser(token);
    const { data, error } = await supabaseClient
      .from('order_items')
      .insert(orderItems)
      .select();

    if (error) throw error;
    return data;
  }

  /**
   * Fetch all orders for a specific user, along with their order items.
   */
  async getOrders(userId: string, token: string) {
    const supabaseClient = getSupabaseForUser(token);
    const { data, error } = await supabaseClient
      .from('orders')
      .select(`
        id,
        total_amount,
        status,
        notes,
        table_number,
        created_at,
        order_items (
          id,
          quantity,
          price_at_order,
          menu_items (
            id,
            name,
            image_url
          )
        )
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  }

  /**
   * Fetch details of a single order.
   */
  async getOrderById(orderId: string, token: string) {
    const supabaseClient = getSupabaseForUser(token);
    const { data, error } = await supabaseClient
      .from('orders')
      .select(`
        id,
        total_amount,
        status,
        notes,
        table_number,
        created_at,
        order_items (
          id,
          quantity,
          price_at_order,
          menu_items (
            id,
            name,
            price,
            image_url
          )
        )
      `)
      .eq('id', orderId)
      .single();

    if (error) throw error;
    return data;
  }
}
