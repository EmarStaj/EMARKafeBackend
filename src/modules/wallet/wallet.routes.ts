import { container } from 'tsyringe';
import { Router } from 'express';
import { z } from 'zod';
import { WalletController } from './wallet.controller';
import { requireAuth } from '../../middlewares/auth.middleware';
import { validate } from '../../middlewares/validate.middleware';
import { financialRateLimiter } from '../../middlewares/rate-limit.middleware';

const router = Router();
const controller = container.resolve(WalletController);
const topupSchema = z.object({
  body: z.object({
    amount: z.number({ required_error: 'Amount is required' })
      .positive('Amount must be positive')
      .min(1, 'Amount must be at least 1')
      .max(10000, 'Maximum topup amount is 10000')
      .multipleOf(0.01, 'Amount can have at most 2 decimal places')
  })
});

// All wallet endpoints require authentication
router.use(requireAuth);

router.get('/balance', controller.getBalanceAndTransactions);
router.post('/topup', financialRateLimiter, validate(topupSchema), controller.topup);
router.get('/qr', financialRateLimiter, controller.generateQr);

export default router;
