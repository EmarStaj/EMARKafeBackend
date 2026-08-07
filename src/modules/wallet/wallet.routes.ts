import { container } from 'tsyringe';
import { Router } from 'express';
import { z } from 'zod';
import { WalletController } from './wallet.controller';
import { requireAuth } from '../../middlewares/auth.middleware';
import { requireRole } from '../../middlewares/role.middleware';
import { validate } from '../../middlewares/validate.middleware';

const router = Router();
const controller = container.resolve(WalletController);
const topupSchema = z.object({
  body: z.object({
    amount: z.number({ required_error: 'Amount is required' }).min(1, 'Amount must be at least 1')
  })
});

// All wallet endpoints require authentication and customer role
router.use(requireAuth);
router.use(requireRole(['customer']));

router.get('/balance', controller.getBalanceAndTransactions);
router.post('/topup', validate(topupSchema), controller.topup);
router.get('/qr', controller.generateQr);

export default router;
