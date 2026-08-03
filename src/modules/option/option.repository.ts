import { supabase, supabaseAdmin } from '../../config/supabase';

export interface ProductOption {
  id?: string;
  product_id: string;
  name: string;
  is_required?: boolean;
  is_multi_select?: boolean;
}

export interface ProductOptionValue {
  id?: string;
  option_id: string;
  label: string;
  price_delta?: number;
}

export class OptionRepository {
  /**
   * Fetch all options for a product, joined with their selectable values.
   */
  async getProductOptions(productId: string) {
    const { data, error } = await supabase
      .from('product_options')
      .select(`
        id,
        product_id,
        name,
        is_required,
        is_multi_select,
        product_option_values (
          id,
          option_id,
          label,
          price_delta
        )
      `)
      .eq('product_id', productId);

    if (error) throw error;
    return data;
  }

  /**
   * Create a new product option group.
   */
  async createOption(option: ProductOption) {
    const { data, error } = await supabaseAdmin
      .from('product_options')
      .insert(option)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Add a selectable value to an option group.
   */
  async createOptionValue(value: ProductOptionValue) {
    const { data, error } = await supabaseAdmin
      .from('product_option_values')
      .insert(value)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Delete an entire option group (cascade delete should handle values in DB).
   */
  async deleteOption(optionId: string) {
    const { error } = await supabaseAdmin
      .from('product_options')
      .delete()
      .eq('id', optionId);

    if (error) throw error;
  }

  /**
   * Delete a single option value.
   */
  async deleteOptionValue(valueId: string) {
    const { error } = await supabaseAdmin
      .from('product_option_values')
      .delete()
      .eq('id', valueId);

    if (error) throw error;
  }
}
