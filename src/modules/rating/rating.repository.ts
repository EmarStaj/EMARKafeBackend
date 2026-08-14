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
   * Check if user already rated this product for a specific order.
   */
  async findRatingByOrder(userId: string, productId: string, orderId: string) {
    const { data, error } = await supabaseAdmin
      .from('product_ratings')
      .select('*')
      .eq('user_id', userId)
      .eq('product_id', productId)
      .eq('order_id', orderId)
      .maybeSingle();

    if (error) throw error;
    return data;
  }

  /**
   * Add a new rating for a completed order, or update existing rating if already rated in this specific order.
   * Enables repeated ratings for the same product across different orders.
   */
  async addOrUpdateRating(ratingData: RatingInput) {
    const existing = await this.findRatingByOrder(ratingData.user_id, ratingData.product_id, ratingData.order_id);

    let query;
    if (existing) {
      // Update existing rating for this specific order
      query = supabaseAdmin
        .from('product_ratings')
        .update({ rating: ratingData.rating })
        .eq('id', existing.id);
    } else {
      // Insert new rating row for this order (repeated rating model)
      query = supabaseAdmin
        .from('product_ratings')
        .insert(ratingData);
    }

    const { data, error } = await query.select().single();
    if (error) throw error;
    return data;
  }

  /**
   * Recalculate and update avg_rating and rating_count on products table
   */
  async updateProductRatingStats(productId: string) {
    // Calculate new stats
    const { data: ratings, error: fetchError } = await supabaseAdmin
      .from('product_ratings')
      .select('rating')
      .eq('product_id', productId);

    if (fetchError) throw fetchError;

    const count = ratings.length;
    const avg = count > 0 
      ? ratings.reduce((sum, r) => sum + r.rating, 0) / count 
      : 0;

    // Update product
    const { error: updateError } = await supabaseAdmin
      .from('products')
      .update({
        rating_count: count,
        avg_rating: Number(avg.toFixed(2))
      })
      .eq('id', productId);

    if (updateError) throw updateError;
    
    return { avg_rating: Number(avg.toFixed(2)), rating_count: count };
  }
}
