import { supabaseAdmin } from '../../config/supabase';
import { injectable } from 'tsyringe';

export interface Category {
  id?: string;
  name: string;
  sort_order?: number;
}

@injectable()
export class CategoryRepository {
  /**
   * Fetch all categories sorted by sort_order.
   */
  async getAllCategories() {
    const { data, error } = await supabaseAdmin
      .from('categories')
      .select('*, products(count)')
      .order('sort_order', { ascending: true });

    if (error) throw error;
    
    // Transform Supabase aggregate count to a flat product_count field
    return data.map((cat: any) => {
      let count = 0;
      if (cat.products && Array.isArray(cat.products) && cat.products.length > 0) {
        count = cat.products[0].count || 0;
      }
      const { products, ...rest } = cat;
      return { ...rest, product_count: count };
    });
  }

  /**
   * Fetch a single category by ID.
   */
  async getCategoryById(id: string) {
    const { data, error } = await supabaseAdmin
      .from('categories')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Create a new category. Bypasses RLS (Admin).
   */
  async createCategory(category: Category) {
    const { data, error } = await supabaseAdmin
      .from('categories')
      .insert(category)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Update an existing category.
   */
  async updateCategory(id: string, category: Partial<Category>) {
    const { data, error } = await supabaseAdmin
      .from('categories')
      .update(category)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Delete a category.
   */
  async deleteCategory(id: string) {
    // Check if category has any products
    const { count, error: countError } = await supabaseAdmin
      .from('products')
      .select('id', { count: 'exact', head: true })
      .eq('category_id', id);

    if (countError) throw countError;
    if (count && count > 0) {
      throw new Error('Cannot delete category because it contains active or inactive products.');
    }

    const { error } = await supabaseAdmin
      .from('categories')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }
}
