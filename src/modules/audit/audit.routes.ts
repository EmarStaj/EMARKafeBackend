import { Router } from 'express';
import { auditController } from './audit.controller';
import { requireAuth } from '../../middlewares/auth.middleware';
import { requireRole } from '../../middlewares/role.middleware';

const router = Router();

// Only Admins can view audit logs
router.use(requireAuth, requireRole(['admin']));

router.get('/', auditController.getAuditLogs);

export default router;
