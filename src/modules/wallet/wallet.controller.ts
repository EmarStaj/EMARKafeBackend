import { injectable } from 'tsyringe';
import { Request, Response, NextFunction } from 'express';
import { WalletService } from './wallet.service';

@injectable()
export class WalletController {
  constructor(private walletService: WalletService) {}

  getBalanceAndTransactions = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!.id;
      const token = req.token!;
      const data = await this.walletService.getBalanceAndTransactions(userId, token);

      res.status(200).json({
        status: 'success',
        data
      });
    } catch (error) {
      next(error);
    }
  };

  topup = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!.id;
      const token = req.token!;
      const { amount } = req.body;

      await this.walletService.topup(userId, amount, token);

      res.status(200).json({
        status: 'success',
        message: 'Balance topped up successfully.'
      });
    } catch (error) {
      next(error);
    }
  };

  generateQr = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!.id;
      const token = req.token!;
      const rewardId = req.query?.reward_id as string | undefined;
      const useReward = req.query?.use_reward === 'true' || req.query?.use_reward === '1';

      const data = (rewardId || useReward)
        ? await this.walletService.generateQrToken(userId, token, rewardId, useReward)
        : await this.walletService.generateQrToken(userId, token);

      res.status(200).json({
        status: 'success',
        data
      });
    } catch (error) {
      next(error);
    }
  };
}
