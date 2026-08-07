import { container } from 'tsyringe';
import { Router } from 'express';
import { AuditController } from './audit.controller';
const controller = container.resolve(AuditController);
import { requireAuth } from '../../middlewares/auth.middleware';
import { requireRole } from '../../middlewares/role.middleware';

const router = Router();

// Only Admins can view audit logs
router.use(requireAuth, requireRole(['admin']));

router.get('/', controller.getAuditLogs);

export default router;
