import { getSupabaseForUser, supabaseAdmin } from '../../config/supabase';

export interface OrderInput {
  user_id: string;
  branch_id: string;
  total_price: number;
  status?: 'created' | 'preparing' | 'ready' | 'completed' | 'cancelled';
}

export interface OrderItemInput {
  order_id: string;
  product_id: string;
  quantity: number;
  selected_options?: any[];
  unit_price: number;
  product_name: string;
  category_name?: string;
}

export class OrderRepository {
  /**
   * Create an order record.
   */
  async createOrder(order: OrderInput, token: string) {
    const supabaseClient = getSupabaseForUser(token);
    const { data, error } = await supabaseClient
      .from('orders')
      .insert({
        user_id: order.user_id,
        branch_id: order.branch_id,
        total_price: order.total_price,
        status: order.status || 'created'
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Insert items for an order.
   */
  async createOrderItems(orderItems: OrderItemInput[], token: string) {
    const supabaseClient = getSupabaseForUser(token);
    const { data, error } = await supabaseClient
      .from('order_items')
      .insert(orderItems.map(item => ({
        order_id: item.order_id,
        product_id: item.product_id,
        quantity: item.quantity,
        selected_options: item.selected_options || [],
        unit_price: item.unit_price,
        product_name: item.product_name,
        category_name: item.category_name || ''
      })))
      .select();

    if (error) throw error;
    return data;
  }

  /**
   * Fetch all orders for a specific user.
   */
  async getOrders(userId: string, token: string) {
    const supabaseClient = getSupabaseForUser(token);
    const { data, error } = await supabaseClient
      .from('orders')
      .select(`
        id,
        branch_id,
        status,
        total_price,
        created_at,
        completed_at,
        branches (
          id,
          name,
          address
        ),
        order_items (
          id,
          product_id,
          quantity,
          selected_options,
          unit_price,
          product_name,
          category_name
        )
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  }

  /**
   * Fetch detailed view of a single order.
   */
  async getOrderById(orderId: string, token: string) {
    const supabaseClient = getSupabaseForUser(token);
    const { data, error } = await supabaseClient
      .from('orders')
      .select(`
        id,
        user_id,
        branch_id,
        status,
        total_price,
        created_at,
        completed_at,
        branches (
          id,
          name,
          address
        ),
        order_items (
          id,
          product_id,
          quantity,
          selected_options,
          unit_price,
          product_name,
          category_name
        )
      `)
      .eq('id', orderId)
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Fetch detailed view of a single order bypassing RLS.
   */
  async getOrderByIdAdmin(orderId: string) {
    const { data, error } = await supabaseAdmin
      .from('orders')
      .select(`
        id,
        user_id,
        branch_id,
        status,
        total_price,
        created_at,
        completed_at,
        order_items (
          id,
          product_id,
          quantity,
          selected_options,
          unit_price,
          product_name,
          category_name
        )
      `)
      .eq('id', orderId)
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Fetch all orders for a specific branch bypassing RLS.
   */
  async getBranchOrders(branchId: string) {
    const { data, error } = await supabaseAdmin
      .from('orders')
      .select(`
        id,
        user_id,
        branch_id,
        status,
        total_price,
        created_at,
        completed_at,
        profiles (
          id,
          full_name,
          phone
        ),
        order_items (
          id,
          product_id,
          quantity,
          selected_options,
          unit_price,
          product_name,
          category_name
        )
      `)
      .eq('branch_id', branchId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  }

  /**
   * Update order status. Bypasses RLS.
   */
  async updateOrderStatus(orderId: string, status: string, completedAt?: string) {
    const updateData: any = { status, updated_at: new Date().toISOString() };
    if (completedAt) {
      updateData.completed_at = completedAt;
    }

    const { data, error } = await supabaseAdmin
      .from('orders')
      .update(updateData)
      .eq('id', orderId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }
}
