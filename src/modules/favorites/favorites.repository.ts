import { supabaseAdmin, getSupabaseForUser } from '../../config/supabase';

export class FavoritesRepository {
  /**
   * Fetch user's bookmarked products, joining with product details.
   */
  async getFavorites(token: string, userId?: string) {
    let query = getSupabaseForUser(token)
      .from('favorites')
      .select(`
        id,
        created_at,
        user_id,
        product_id,
        products (
          id,
          name,
          base_price,
          description,
          image_url,
          category_id
        )
      `);

    if (userId) {
      query = query.eq('user_id', userId);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data;
  }

  /**
   * Check if user already bookmarked a product.
   */
  async findFavorite(userId: string, productId: string, token: string) {
    const { data, error } = await getSupabaseForUser(token)
      .from('favorites')
      .select('*')
      .eq('user_id', userId)
      .eq('product_id', productId)
      .maybeSingle();

    if (error) throw error;
    return data;
  }

  /**
   * Add a product to favorites.
   */
  async addFavorite(userId: string, productId: string, _token: string) {
    const { data, error } = await supabaseAdmin
      .from('favorites')
      .insert({ user_id: userId, product_id: productId })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Remove a product from favorites.
   */
  async removeFavorite(userId: string, productId: string, _token: string) {
    const { error } = await supabaseAdmin
      .from('favorites')
      .delete()
      .eq('user_id', userId)
      .eq('product_id', productId);

    if (error) throw error;
  }
}
