import { injectable } from 'tsyringe';
import { Request, Response, NextFunction } from 'express';
import { LoyaltyService } from './loyalty.service';
import { sendSuccess } from '../../utils/response';
import { AppError } from '../../utils/app-error';

@injectable()
export class LoyaltyController {
  constructor(private loyaltyService: LoyaltyService) {}

  getLoyaltyProgress = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user?.id;
      if (!userId) throw new AppError('Unauthorized', 401);

      const progress = await this.loyaltyService.getLoyaltyProgress(userId);
      sendSuccess(res, progress, 'Loyalty stamp progress retrieved successfully.');
    } catch (error) {
      next(error);
    }
  };

  getLoyaltyRewards = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user?.id;
      if (!userId) throw new AppError('Unauthorized', 401);

      const rewards = await this.loyaltyService.getLoyaltyRewards(userId);
      sendSuccess(res, rewards, 'Loyalty rewards list retrieved successfully.');
    } catch (error) {
      next(error);
    }
  };

  getLoyaltySummary = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user?.id;
      if (!userId) throw new AppError('Unauthorized', 401);

      const summary = await this.loyaltyService.getLoyaltySummary(userId);
      sendSuccess(res, summary, 'Loyalty summary retrieved successfully.');
    } catch (error) {
      next(error);
    }
  };

  redeemReward = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user?.id;
      if (!userId) throw new AppError('Unauthorized', 401);

      const rewardId = req.params.id || req.body.reward_id;
      if (!rewardId) throw new AppError('Reward ID is required.', 400);

      const redeemed = await this.loyaltyService.redeemReward(userId, rewardId, req.body.order_id);
      sendSuccess(res, redeemed, 'Loyalty reward redeemed successfully.');
    } catch (error) {
      next(error);
    }
  };
}
