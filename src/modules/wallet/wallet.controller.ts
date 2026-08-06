import { Request, Response, NextFunction } from 'express';
import { WalletService } from './wallet.service';

export class WalletController {
  private walletService: WalletService;

  constructor() {
    this.walletService = new WalletService();
  }

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
      const data = this.walletService.generateQrToken(userId);

      res.status(200).json({
        status: 'success',
        data
      });
    } catch (error) {
      next(error);
    }
  };
}
