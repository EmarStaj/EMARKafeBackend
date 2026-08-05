import { supabaseAdmin, getSupabaseForUser } from '../../config/supabase';

export interface Cart {
  id: string;
  user_id: string;
  status: 'active' | 'converted' | 'abandoned';
}

export interface CartItemInput {
  cart_id: string;
  product_id: string;
  quantity: number;
  selected_options?: any[];
  unit_price: number;
}

export class CartRepository {
  /**
   * Finds the current active cart for a user. If none exists, creates one. Bypasses RLS.
   */
  async getOrCreateActiveCart(userId: string): Promise<Cart> {
    // 1. Try to find an active cart
    const { data: activeCart, error: findError } = await supabaseAdmin
      .from('carts')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'active')
      .maybeSingle();

    if (findError) throw findError;
    if (activeCart) return activeCart as Cart;

    // 2. Create one if it does not exist
    const { data: newCart, error: createError } = await supabaseAdmin
      .from('carts')
      .insert({ user_id: userId, status: 'active' })
      .select()
      .single();

    if (createError) throw createError;
    return newCart as Cart;
  }

  /**
   * Fetch user's active cart and its items, joined with products.
   */
  async getCart(userId: string, token: string) {
    const activeCart = await this.getOrCreateActiveCart(userId);

    const client = token ? getSupabaseForUser(token) : supabaseAdmin;
    const { data: items, error } = await client
      .from('cart_items')
      .select(`
        id,
        cart_id,
        product_id,
        quantity,
        selected_options,
        unit_price,
        products (
          id,
          name,
          base_price,
          image_url,
          category_id,
          categories (
            name
          )
        )
      `)
      .eq('cart_id', activeCart.id);

    if (error) throw error;
    
    return {
      cart: activeCart,
      items: items || []
    };
  }

  /**
   * Find cart items inside a specific cart for a product.
   */
  async getCartItemsByProduct(cartId: string, productId: string) {
    const { data, error } = await supabaseAdmin
      .from('cart_items')
      .select('*')
      .eq('cart_id', cartId)
      .eq('product_id', productId);

    if (error) throw error;
    return data || [];
  }

  /**
   * Add a new item to cart.
   */
  async addToCart(item: CartItemInput) {
    const { data, error } = await supabaseAdmin
      .from('cart_items')
      .insert({
        cart_id: item.cart_id,
        product_id: item.product_id,
        quantity: item.quantity,
        selected_options: item.selected_options || [],
        unit_price: item.unit_price
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Update quantity of a cart item.
   */
  async updateCartItem(cartItemId: string, quantity: number) {
    const { data, error } = await supabaseAdmin
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
  async removeFromCart(cartItemId: string) {
    const { error } = await supabaseAdmin
      .from('cart_items')
      .delete()
      .eq('id', cartItemId);

    if (error) throw error;
  }

  /**
   * Clear all items in a specific active cart.
   */
  async clearCart(cartId: string) {
    const { error } = await supabaseAdmin
      .from('cart_items')
      .delete()
      .eq('cart_id', cartId);

    if (error) throw error;
  }

  /**
   * Update cart status (e.g., converted upon order checkout).
   */
  async updateCartStatus(cartId: string, status: 'active' | 'converted' | 'abandoned') {
    const { data, error } = await supabaseAdmin
      .from('carts')
      .update({ status })
      .eq('id', cartId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }
}
