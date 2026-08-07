import { injectable } from 'tsyringe';
import { LoyaltyRepository } from './loyalty.repository';
import { AppError } from '../../utils/app-error';
import { logger } from '../../config/logger';

@injectable()
export class LoyaltyService {
  private loyaltyRepository: LoyaltyRepository;

  constructor() {
    this.loyaltyRepository = new LoyaltyRepository();
  }

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

  /**
   * Process stamp accumulation for completed purchases.
   * Generates rewards if the threshold (usually 4 stamps) is reached.
   */
  async addStampsForProduct(userId: string, categoryId: string, quantity: number) {
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
}
