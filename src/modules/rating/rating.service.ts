import { RatingRepository } from './rating.repository';
import { OrderRepository } from '../order/order.repository';
import { SettingsRepository } from '../settings/settings.repository';
import { AppError } from '../../utils/app-error';

export class RatingService {
  private ratingRepository: RatingRepository;
  private orderRepository: OrderRepository;
  private settingsRepository: SettingsRepository;

  constructor() {
    this.ratingRepository = new RatingRepository();
    this.orderRepository = new OrderRepository();
    this.settingsRepository = new SettingsRepository();
  }

  /**
   * Add or update product rating for a specific completed order.
   * Supports repeated rating model and respects configurable app_settings time limits.
   */
  async rateProduct(userId: string, productId: string, orderId: string, rating: number, token: string) {
    if (rating < 1 || rating > 5) {
      throw new AppError('Rating must be an integer between 1 and 5.', 400);
    }

    try {
      // 1. Verify the order exists and belongs to the user (via token)
      const order = await this.orderRepository.getOrderById(orderId, token);
      if (!order || order.user_id !== userId) {
        throw new AppError('Order not found or access denied.', 404);
      }

      if (order.status !== 'completed') {
        throw new AppError('You can only rate products from a completed order.', 400);
      }

      // 2. Check centralized rating time limit setting from app_settings table
      try {
        const timeLimitSetting = await this.settingsRepository.getSettingByKey('rating_time_limit_hours');
        if (timeLimitSetting && timeLimitSetting.value) {
          const limitHours = Number(timeLimitSetting.value);
          if (limitHours > 0 && order.completed_at) {
            const hoursSinceCompleted = (Date.now() - new Date(order.completed_at).getTime()) / (1000 * 3600);
            if (hoursSinceCompleted > limitHours) {
              throw new AppError(`Rating time window (${limitHours} hours) has expired for this order.`, 400);
            }
          }
        }
      } catch (e: any) {
        if (e instanceof AppError) throw e;
        // Ignore setting lookup errors if setting is missing/unconfigured
      }

      // 3. Verify the user purchased the product
      const hasPurchased = await this.ratingRepository.hasPurchasedProduct(userId, productId);
      if (!hasPurchased) {
        throw new AppError('You can only rate products you have purchased in a completed order.', 400);
      }

      // 4. Add or update rating for this order (repeated rating model)
      const ratingRecord = await this.ratingRepository.addOrUpdateRating({
        user_id: userId,
        product_id: productId,
        order_id: orderId,
        rating
      });

      // 5. Sync product average ratings cache
      const stats = await this.ratingRepository.updateProductStats(productId);

      return {
        ratingRecord,
        stats
      };
    } catch (error: any) {
      throw new AppError(error.message || 'Failed to submit rating.', 400);
    }
  }
}
