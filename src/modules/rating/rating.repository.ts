import { supabaseAdmin } from '../../config/supabase';

export interface RatingInput {
  user_id: string;
  product_id: string;
  order_id: string;
  rating: number;
}

export class RatingRepository {
  /**
   * Check if a user has purchased a specific product in a completed order.
   */
  async hasPurchasedProduct(userId: string, productId: string): Promise<boolean> {
    const { data, error } = await supabaseAdmin
      .from('order_items')
      .select(`
        id,
        orders!inner (
          user_id,
          status
        )
      `)
      .eq('product_id', productId)
      .eq('orders.user_id', userId)
      .eq('orders.status', 'completed'); // Only allow rating completed orders

    if (error) throw error;
    return data && data.length > 0;
  }

  /**
   * Check if user already rated this product.
   */
  async findRating(userId: string, productId: string) {
    const { data, error } = await supabaseAdmin
      .from('product_ratings')
      .select('*')
      .eq('user_id', userId)
      .eq('product_id', productId)
      .maybeSingle();

    if (error) throw error;
    return data;
  }

  /**
   * Add a new rating or update the existing one.
   */
  async addOrUpdateRating(ratingData: RatingInput) {
    const existing = await this.findRating(ratingData.user_id, ratingData.product_id);

    let query;
    if (existing) {
      // Update existing rating
      query = supabaseAdmin
        .from('product_ratings')
        .update({ rating: ratingData.rating, order_id: ratingData.order_id })
        .eq('id', existing.id);
    } else {
      // Insert new rating
      query = supabaseAdmin
        .from('product_ratings')
        .insert(ratingData);
    }

    const { data, error } = await query.select().single();
    if (error) throw error;
    return data;
  }

  /**
   * Recalculates average rating and review counts on public.products table.
   */
  async updateProductStats(productId: string) {
    const { data: ratings, error: selectError } = await supabaseAdmin
      .from('product_ratings')
      .select('rating')
      .eq('product_id', productId);

    if (selectError) throw selectError;

    const count = ratings ? ratings.length : 0;
    const avg = count > 0 ? ratings!.reduce((sum, r) => sum + r.rating, 0) / count : 0;

    const { error: updateError } = await supabaseAdmin
      .from('products')
      .update({ avg_rating: avg, rating_count: count })
      .eq('id', productId);

    if (updateError) throw updateError;
    return { avg, count };
  }
}
