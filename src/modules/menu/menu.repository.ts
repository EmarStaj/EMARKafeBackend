import { supabaseAdmin } from '../../config/supabase';

export interface Product {
  id?: string;
  category_id: string;
  name: string;
  description?: string;
  base_price: number;
  image_url?: string;
  is_active?: boolean;
  is_loyalty_eligible?: boolean;
}

export class MenuRepository {
  /**
   * Fetch all active products (menu items), joined with category information.
   */
  async getAllItems(onlyActive = true) {
    let query = supabaseAdmin
      .from('products')
      .select(`
        id,
        category_id,
        name,
        description,
        base_price,
        image_url,
        is_active,
        is_loyalty_eligible,
        avg_rating,
        rating_count,
        categories (
          id,
          name,
          sort_order
        )
      `);

    if (onlyActive) {
      query = query.eq('is_active', true);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data;
  }

  /**
   * Fetch a single product by ID.
   */
  async getItemById(id: string) {
    const { data, error } = await supabaseAdmin
      .from('products')
      .select(`
        id,
        category_id,
        name,
        description,
        base_price,
        image_url,
        is_active,
        is_loyalty_eligible,
        avg_rating,
        rating_count,
        categories (
          id,
          name
        )
      `)
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Create a new product. Bypasses RLS via Admin client.
   */
  async createItem(product: Product) {
    const { data, error } = await supabaseAdmin
      .from('products')
      .insert(product)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Update an existing product.
   */
  async updateItem(id: string, product: Partial<Product>) {
    const { data, error } = await supabaseAdmin
      .from('products')
      .update(product)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Delete a product.
   */
  async deleteItem(id: string) {
    const { error } = await supabaseAdmin
      .from('products')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }
}
