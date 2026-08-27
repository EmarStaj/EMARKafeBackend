import { supabaseAdmin } from '../../config/supabase';
import { injectable } from 'tsyringe';

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

@injectable()
export class MenuRepository {
  /**
   * Fetch all active products (menu items), joined with category information.
   */
  async getAllItems(onlyActive = true, search?: string, categoryId?: string, branchId?: string) {

    let allowedProductIds: string[] | null = null;
    if (branchId) {
      const { data: bp } = await supabaseAdmin
        .from('branch_products')
        .select('product_id')
        .eq('branch_id', branchId)
        .eq('is_available', true);
      allowedProductIds = (bp || []).map((b: any) => b.product_id);
      if (allowedProductIds.length === 0) return [];
    }
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

    if (allowedProductIds) { query = query.in('id', allowedProductIds); }
    if (categoryId) {
      query = query.eq('category_id', categoryId);
    }

    if (search) {
      query = query.ilike('name', `%${search}%`);
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
        ),
        product_options (
          id,
          name,
          is_required,
          is_multi_select,
          product_option_values (
            id,
            label,
            price_delta
          )
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
   * Delete a product (Soft Delete).
   */
  async deleteItem(id: string) {
    const { error } = await supabaseAdmin
      .from('products')
      .update({ is_active: false })
      .eq('id', id);

    if (error) throw error;
  }
}
