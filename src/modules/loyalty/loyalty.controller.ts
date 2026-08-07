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
}
