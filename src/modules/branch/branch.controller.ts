import { injectable } from 'tsyringe';
import { Request, Response, NextFunction } from 'express';
import { BranchService } from './branch.service';
import { sendSuccess } from '../../utils/response';
import { AppError } from '../../utils/app-error';
import { AuditService } from '../audit/audit.service';
import { container } from 'tsyringe';
import { AuditActorType, AuditAction, AuditStatus, AuditEntityType } from '../audit/audit.constants';

@injectable()
export class BranchController {
  private auditService = container.resolve(AuditService);
  constructor(private branchService: BranchService) {}

  getAllBranches = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const onlyActive = req.query.onlyActive !== 'false';
      const branches = await this.branchService.getAllBranches(onlyActive);
      sendSuccess(res, branches, 'Branches retrieved successfully.');
    } catch (error) {
      next(error);
    }
  };

  getBranchById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const branch = await this.branchService.getBranchById(id);
      sendSuccess(res, branch, 'Branch retrieved successfully.');
    } catch (error) {
      next(error);
    }
  };

  createBranch = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { name, address, lat, lng, opening_hours, is_active } = req.body;
      const newBranch = await this.branchService.createBranch({
        name,
        address,
        lat,
        lng,
        opening_hours,
        is_active
      });
      sendSuccess(res, newBranch, 'Branch created successfully.', 201);
    } catch (error) {
      next(error);
    }
  };

  updateBranch = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const updatedFields = req.body;
      const updatedBranch = await this.branchService.updateBranch(id, updatedFields);
      sendSuccess(res, updatedBranch, 'Branch updated successfully.');
    } catch (error) {
      next(error);
    }
  };

  deleteBranch = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      await this.branchService.deleteBranch(id);
      sendSuccess(res, null, 'Branch deleted successfully.');
    } catch (error) {
      next(error);
    }
  };

  getBranchProducts = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { branchId } = req.params;
      const products = await this.branchService.getBranchProducts(branchId);
      sendSuccess(res, products, 'Branch product availability retrieved successfully.');
    } catch (error) {
      next(error);
    }
  };

  updateBranchProductAvailability = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { branchId, productId } = req.params;
      const { is_available } = req.body;
      const userId = req.user?.id;

      if (!userId) {
        throw new AppError('Unauthorized', 401);
      }

      // Baristas can only update stock for their own branch!
      const userProfile = req.profile;
      if (userProfile && userProfile.role === 'barista' && userProfile.branch_id !== branchId) {
        throw new AppError('Forbidden: Baristas can only manage stock of their own branch.', 403);
      }

      const updatedMapping = await this.branchService.updateBranchProductAvailability(
        branchId,
        productId,
        is_available,
        userId
      );

      this.auditService.logEvent({
        userId: req.user?.id,
        actorType: (req.user as any)?.role || AuditActorType.BARISTA,
        actorName: req.user?.email,
        branchId: branchId,
        action: AuditAction.STOCK_UPDATE,
        status: AuditStatus.SUCCESS,
        entityType: AuditEntityType.PRODUCT,
        entityId: productId,
        details: { is_available },
        req
      });

      sendSuccess(res, updatedMapping, 'Product availability updated successfully.');
    } catch (error: any) {
      this.auditService.logEvent({
        userId: req.user?.id,
        actorType: (req.user as any)?.role || AuditActorType.BARISTA,
        actorName: req.user?.email,
        branchId: req.params.branchId,
        action: AuditAction.STOCK_UPDATE,
        status: AuditStatus.FAILURE,
        entityType: AuditEntityType.PRODUCT,
        entityId: req.params.productId,
        details: { is_available: req.body.is_available, error: error.message },
        req
      });
      next(error);
    }
  };
}
