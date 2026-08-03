import { RatingRepository } from './rating.repository';
import { OrderRepository } from '../order/order.repository';
import { AppError } from '../../utils/app-error';

export class RatingService {
  private ratingRepository: RatingRepository;
  private orderRepository: OrderRepository;

  constructor() {
    this.ratingRepository = new RatingRepository();
    this.orderRepository = new OrderRepository();
  }

  /**
   * Add or update product rating. Recalculates product average stats.
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

      // 2. Verify the user purchased the product
      const hasPurchased = await this.ratingRepository.hasPurchasedProduct(userId, productId);
      if (!hasPurchased) {
        throw new AppError('You can only rate products you have purchased in a completed order.', 400);
      }

      // 3. Add or update rating
      const ratingRecord = await this.ratingRepository.addOrUpdateRating({
        user_id: userId,
        product_id: productId,
        order_id: orderId,
        rating
      });

      // 4. Sync product average ratings cache
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
