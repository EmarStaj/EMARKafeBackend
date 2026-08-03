import { supabaseAdmin } from '../../config/supabase';

export interface Category {
  id?: string;
  name: string;
  sort_order?: number;
}

export class CategoryRepository {
  /**
   * Fetch all categories sorted by sort_order.
   */
  async getAllCategories() {
    const { data, error } = await supabaseAdmin
      .from('categories')
      .select('*')
      .order('sort_order', { ascending: true });

    if (error) throw error;
    return data;
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
    const { error } = await supabaseAdmin
      .from('categories')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }
}
