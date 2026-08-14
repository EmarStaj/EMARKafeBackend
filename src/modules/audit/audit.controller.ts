import { injectable } from 'tsyringe';
import { Request, Response, NextFunction } from 'express';
import { AuditService } from './audit.service';
import { AuditActorType, AuditAction, AuditStatus } from './audit.constants';

@injectable()
export class AuditController {
  constructor(private auditService: AuditService) {}
  getAuditLogs = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 50;
      
      const actorType = req.query.actorType as AuditActorType | undefined;
      const branchId = req.query.branchId as string | undefined;
      const action = req.query.action as AuditAction | undefined;
      const status = req.query.status as AuditStatus | undefined;
      const startDate = req.query.startDate as string | undefined;
      const endDate = req.query.endDate as string | undefined;

      const result = await this.auditService.getAuditLogs({
        page,
        limit,
        actorType,
        branchId,
        action,
        status,
        startDate,
        endDate
      });

      res.status(200).json({
        status: 'success',
        ...result
      });
    } catch (error) {
      next(error);
    }
  };
}

