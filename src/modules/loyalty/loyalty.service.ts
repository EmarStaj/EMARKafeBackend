import { injectable } from 'tsyringe';
import { LoyaltyRepository } from './loyalty.repository';
import { AppError } from '../../utils/app-error';
import { logger } from '../../config/logger';
import { NotificationService } from '../notification/notification.service';

@injectable()
export class LoyaltyService {
  constructor(
    private loyaltyRepository: LoyaltyRepository,
    private notificationService: NotificationService
  ) {}

  async getLoyaltyProgress(userId: string) {
    try {
      return await this.loyaltyRepository.getLoyaltyProgress(userId);
    } catch (error: any) {
      throw new AppError(error.message || 'Failed to retrieve loyalty progress.', 400);
    }
  }

  async getLoyaltyRewards(userId: string) {
    try {
      return await this.loyaltyRepository.getLoyaltyRewards(userId);
    } catch (error: any) {
      throw new AppError(error.message || 'Failed to retrieve loyalty rewards.', 400);
    }
  }

  async getLoyaltySummary(userId: string) {
    const [progress, rewards] = await Promise.all([
      this.getLoyaltyProgress(userId),
      this.getLoyaltyRewards(userId),
    ]);
    return { progress, rewards };
  }

  /**
   * Process stamp accumulation for completed purchases.
   * Generates rewards if the threshold (usually 4 stamps) is reached.
   */
  async addStampsForProduct(userId: string, categoryId: string, quantity: number, sendNotification: boolean = true) {
    if (quantity <= 0) {
      return { stampsAdded: 0, currentStamps: 0, rewardsEarned: 0 };
    }

    try {
      const progress = await this.loyaltyRepository.findProgress(userId, categoryId);
      
      const threshold = progress ? progress.threshold : 4;
      const initialCount = progress ? progress.current_count : 0;
      
      let newCount = initialCount + quantity;
      let rewardsEarned = 0;

      // Calculate how many rewards were earned and the leftover stamps
      while (newCount >= threshold) {
        newCount -= threshold;
        rewardsEarned++;
      }

      // 1. Save new stamp count
      await this.loyaltyRepository.saveProgress(userId, categoryId, newCount, threshold);

      // 2. Grant rewards
      for (let i = 0; i < rewardsEarned; i++) {
        await this.loyaltyRepository.createReward(userId, categoryId);
      }

      logger.info(`Added ${quantity} stamps for user ${userId}`);
      
      // Push notification for loyalty points (if enabled)
      if (sendNotification) {
        this.notificationService.sendToUser(
          userId,
          'Tebrikler! Puan Kazandınız 🎁',
          `Siparişinizden ${quantity} kahve puanı kazandınız. Toplam puanınızı cüzdanınızdan görebilirsiniz.`
        );
      }

      return {
        stampsAdded: quantity,
        currentStamps: newCount,
        rewardsEarned
      };
    } catch (error: unknown) {
      logger.error('Error adding stamps:', error);
      // We log the error but don't crash checkout if loyalty processing fails
      return { stampsAdded: 0, currentStamps: 0, rewardsEarned: 0 };
    }
  }

  /**
   * Redeems an earned loyalty reward for a free item or order discount.
   */
  async redeemReward(userId: string, rewardId: string, orderId?: string) {
    try {
      const reward = await this.loyaltyRepository.findRewardById(rewardId);
      if (!reward) {
        throw new AppError('Reward not found.', 404);
      }
      if (reward.user_id !== userId) {
        throw new AppError('Forbidden: You do not own this reward.', 403);
      }
      if (reward.status !== 'earned') {
        throw new AppError('This reward has already been redeemed or is expired.', 400);
      }

      const redeemed = await this.loyaltyRepository.redeemReward(rewardId, orderId || 'MANUAL_REDEMPTION');
      
      this.notificationService.sendToUser(
        userId,
        'Hediye Kahveniz Kullanıldı ☕',
        'Kazandığınız hediye kahve ödülü başarıyla kullanıldı. Afiyet olsun!'
      );

      return redeemed;
    } catch (error: any) {
      if (error instanceof AppError) throw error;
      throw new AppError(error.message || 'Failed to redeem loyalty reward.', 400);
    }
  }
}
