import { supabase, supabaseAdmin } from '../../config/supabase';

export interface MenuItem {
  id?: string;
  name: string;
  description?: string;
  price: number;
  category: string;
  image_url?: string;
  is_available?: boolean;
}

export class MenuRepository {
  /**
   * Fetch all menu items. Accessible to all users.
   */
  async getAllItems() {
    const { data, error } = await supabase
      .from('menu_items')
      .select('*')
      .order('category', { ascending: true });

    if (error) throw error;
    return data;
  }

  /**
   * Fetch a single menu item by ID.
   */
  async getItemById(id: string) {
    const { data, error } = await supabase
      .from('menu_items')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Create a new menu item. Bypasses RLS using Admin client.
   */
  async createItem(item: MenuItem) {
    const { data, error } = await supabaseAdmin
      .from('menu_items')
      .insert(item)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Update an existing menu item.
   */
  async updateItem(id: string, item: Partial<MenuItem>) {
    const { data, error } = await supabaseAdmin
      .from('menu_items')
      .update(item)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Delete a menu item.
   */
  async deleteItem(id: string) {
    const { error } = await supabaseAdmin
      .from('menu_items')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }
}
