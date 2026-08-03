import { supabaseAdmin } from '../../config/supabase';

export class LoyaltyRepository {
  /**
   * Get user loyalty progress across categories.
   */
  async getLoyaltyProgress(userId: string) {
    const { data, error } = await supabaseAdmin
      .from('loyalty_progress')
      .select(`
        id,
        category_id,
        current_count,
        threshold,
        categories (
          id,
          name
        )
      `)
      .eq('user_id', userId);

    if (error) throw error;
    return data;
  }

  /**
   * Get user rewards.
   */
  async getLoyaltyRewards(userId: string) {
    const { data, error } = await supabaseAdmin
      .from('loyalty_rewards')
      .select(`
        id,
        category_id,
        status,
        earned_at,
        redeemed_at,
        order_id,
        categories (
          id,
          name
        )
      `)
      .eq('user_id', userId)
      .order('earned_at', { ascending: false });

    if (error) throw error;
    return data;
  }

  /**
   * Fetch specific loyalty progress for a user and category.
   */
  async findProgress(userId: string, categoryId: string) {
    const { data, error } = await supabaseAdmin
      .from('loyalty_progress')
      .select('*')
      .eq('user_id', userId)
      .eq('category_id', categoryId)
      .maybeSingle();

    if (error) throw error;
    return data;
  }

  /**
   * Create or update loyalty progress count.
   */
  async saveProgress(userId: string, categoryId: string, currentCount: number, threshold = 4) {
    const { data, error } = await supabaseAdmin
      .from('loyalty_progress')
      .upsert({
        user_id: userId,
        category_id: categoryId,
        current_count: currentCount,
        threshold
      }, { onConflict: 'user_id,category_id' })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Award a free product reward to user.
   */
  async createReward(userId: string, categoryId: string) {
    const { data, error } = await supabaseAdmin
      .from('loyalty_rewards')
      .insert({
        user_id: userId,
        category_id: categoryId,
        status: 'earned'
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Marks a reward as redeemed for a specific order.
   */
  async redeemReward(rewardId: string, orderId: string) {
    const { data, error } = await supabaseAdmin
      .from('loyalty_rewards')
      .update({
        status: 'redeemed',
        redeemed_at: new Date().toISOString(),
        order_id: orderId
      })
      .eq('id', rewardId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }
}
