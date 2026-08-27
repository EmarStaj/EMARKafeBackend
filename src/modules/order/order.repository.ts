import { supabaseAdmin, getSupabaseForUser } from '../../config/supabase';

export interface OrderInput {
  user_id: string;
  branch_id: string;
  total_price: number;
  status: 'created' | 'preparing' | 'ready' | 'completed' | 'cancelled';
  pickup_code?: string;
  order_number?: string;
}

export interface OrderItemInput {
  order_id?: string;
  product_id: string;
  quantity: number;
  selected_options?: any[];
  unit_price: number;
  product_name: string;
  category_name: string;
}

export class OrderRepository {
  /**
   * Create a new order header in public.orders.
   */
  async createOrder(order: OrderInput, token?: string, isAdmin: boolean = false) {
    const client = isAdmin ? supabaseAdmin : (token ? getSupabaseForUser(token) : supabaseAdmin);
    const { data, error } = await client
      .from('orders')
      .insert(order)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Insert multiple items into public.order_items.
   */
  async createOrderItems(items: OrderItemInput[], token?: string, isAdmin: boolean = false) {
    const client = isAdmin ? supabaseAdmin : (token ? getSupabaseForUser(token) : supabaseAdmin);
    const { data, error } = await client
      .from('order_items')
      .insert(items)
      .select();

    if (error) throw error;
    return data;
  }

  /**
   * Fetch all orders for a specific user using user-scoped client if token provided.
   */
  async getOrders(userId: string, token?: string) {
    const client = token ? getSupabaseForUser(token) : supabaseAdmin;
    const { data, error } = await client
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
   * Fetch detailed view of a single order using user-scoped client if token provided.
   */
  async getOrderById(orderId: string, token?: string, isAdmin: boolean = false) {
    const client = isAdmin ? supabaseAdmin : (token ? getSupabaseForUser(token) : supabaseAdmin);
    const { data, error } = await client
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
          category_name,
          products (
            id,
            category_id,
            is_loyalty_eligible
          )
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
  async updateOrderStatus(
    orderId: string, 
    status: string, 
    extra?: string | { ready_at?: string; completed_at?: string; completed_by?: string }
  ) {
    const updateData: any = { status, updated_at: new Date().toISOString() };
    if (typeof extra === 'string') {
      updateData.completed_at = extra;
    } else if (extra && typeof extra === 'object') {
      if (extra.ready_at) updateData.ready_at = extra.ready_at;
      if (extra.completed_at) updateData.completed_at = extra.completed_at;
      if (extra.completed_by) updateData.completed_by = extra.completed_by;
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
