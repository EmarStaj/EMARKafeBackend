import { getSupabaseForUser } from '../../config/supabase';

export class FavoritesRepository {
  /**
   * Fetch user's bookmarked menu items, joining with menu_items details.
   */
  async getFavorites(token: string) {
    const supabaseClient = getSupabaseForUser(token);
    const { data, error } = await supabaseClient
      .from('favorites')
      .select(`
        id,
        created_at,
        menu_item_id,
        menu_items (
          id,
          name,
          price,
          description,
          image_url,
          category
        )
      `);

    if (error) throw error;
    return data;
  }

  /**
   * Check if user already favorited an item.
   */
  async findFavorite(userId: string, menuItemId: string, token: string) {
    const supabaseClient = getSupabaseForUser(token);
    const { data, error } = await supabaseClient
      .from('favorites')
      .select('*')
      .eq('user_id', userId)
      .eq('menu_item_id', menuItemId)
      .maybeSingle();

    if (error) throw error;
    return data;
  }

  /**
   * Add an item to favorites.
   */
  async addFavorite(userId: string, menuItemId: string, token: string) {
    const supabaseClient = getSupabaseForUser(token);
    const { data, error } = await supabaseClient
      .from('favorites')
      .insert({ user_id: userId, menu_item_id: menuItemId })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Remove item from favorites.
   */
  async removeFavorite(userId: string, menuItemId: string, token: string) {
    const supabaseClient = getSupabaseForUser(token);
    const { error } = await supabaseClient
      .from('favorites')
      .delete()
      .eq('user_id', userId)
      .eq('menu_item_id', menuItemId);

    if (error) throw error;
  }
}
