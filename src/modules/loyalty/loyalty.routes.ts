import { Router } from 'express';
import { LoyaltyController } from './loyalty.controller';
import { requireAuth } from '../../middlewares/auth.middleware';
import { requireRole } from '../../middlewares/role.middleware';

const router = Router();
const controller = new LoyaltyController();

// All loyalty routes require authentication and customer role
router.use(requireAuth);
router.use(requireRole(['customer']));

router.get('/progress', controller.getLoyaltyProgress);
router.get('/rewards', controller.getLoyaltyRewards);

export default router;
