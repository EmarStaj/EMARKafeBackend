import { getSupabaseForUser } from '../../config/supabase';

export interface CartItem {
  id?: string;
  user_id: string;
  menu_item_id: string;
  quantity: number;
}

export class CartRepository {
  /**
   * Fetch current user's cart items, joining with menu_items details.
   */
  async getCart(token: string) {
    const supabaseClient = getSupabaseForUser(token);
    const { data, error } = await supabaseClient
      .from('cart_items')
      .select(`
        id,
        quantity,
        menu_item_id,
        menu_items (
          id,
          name,
          price,
          image_url,
          category
        )
      `);

    if (error) throw error;
    return data;
  }

  /**
   * Check if a menu item is already in user's cart.
   */
  async findCartItem(userId: string, menuItemId: string, token: string) {
    const supabaseClient = getSupabaseForUser(token);
    const { data, error } = await supabaseClient
      .from('cart_items')
      .select('*')
      .eq('user_id', userId)
      .eq('menu_item_id', menuItemId)
      .maybeSingle();

    if (error) throw error;
    return data;
  }

  /**
   * Insert new cart item or update quantity.
   */
  async addToCart(userId: string, menuItemId: string, quantity: number, token: string) {
    const supabaseClient = getSupabaseForUser(token);
    const { data, error } = await supabaseClient
      .from('cart_items')
      .insert({ user_id: userId, menu_item_id: menuItemId, quantity })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Update quantity of an existing cart item.
   */
  async updateCartItem(cartItemId: string, quantity: number, token: string) {
    const supabaseClient = getSupabaseForUser(token);
    const { data, error } = await supabaseClient
      .from('cart_items')
      .update({ quantity })
      .eq('id', cartItemId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Remove item from cart.
   */
  async removeFromCart(cartItemId: string, token: string) {
    const supabaseClient = getSupabaseForUser(token);
    const { error } = await supabaseClient
      .from('cart_items')
      .delete()
      .eq('id', cartItemId);

    if (error) throw error;
  }

  /**
   * Clear all items in user's cart.
   */
  async clearCart(userId: string, token: string) {
    const supabaseClient = getSupabaseForUser(token);
    const { error } = await supabaseClient
      .from('cart_items')
      .delete()
      .eq('user_id', userId);

    if (error) throw error;
  }
}
