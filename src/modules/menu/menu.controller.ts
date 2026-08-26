import { injectable } from 'tsyringe';
import { Request, Response, NextFunction } from 'express';
import { MenuService } from './menu.service';
import { sendSuccess } from '../../utils/response';
import { AuditService } from '../audit/audit.service';
import { AuditActorType, AuditAction, AuditStatus, AuditEntityType } from '../audit/audit.constants';

@injectable()
export class MenuController {
  constructor(
    private menuService: MenuService,
    private auditService: AuditService
  ) {}

  getAllItems = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      let onlyActive = true;
      if (req.query.onlyActive === 'false') {
        const profile = req.profile;
        if (profile && (profile.role === 'admin' || profile.role === 'branch_manager')) {
          onlyActive = false;
        }
      }
      
      const search = req.query.search as string | undefined;
      const categoryId = req.query.category_id as string | undefined;
      const branchId = req.query.branch_id as string | undefined;

      const items = await this.menuService.getAllItems(onlyActive, search, categoryId, branchId);
      sendSuccess(res, items, 'Products retrieved successfully.');
    } catch (error) {
      next(error);
    }
  };

  getItemById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const item = await this.menuService.getItemById(id);
      sendSuccess(res, item, 'Product retrieved successfully.');
    } catch (error) {
      next(error);
    }
  };

  createItem = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { category_id, name, description, base_price, image_url, is_active, is_loyalty_eligible } = req.body;
      const newItem = await this.menuService.createItem({
        category_id,
        name,
        description,
        base_price,
        image_url,
        is_active,
        is_loyalty_eligible,
      });

      this.auditService.logEvent({
        userId: req.user?.id,
        actorType: (req.user as any)?.role || AuditActorType.ADMIN,
        actorName: req.user?.email,
        action: AuditAction.PRODUCT_CREATE,
        status: AuditStatus.SUCCESS,
        entityType: AuditEntityType.PRODUCT,
        entityId: newItem.id,
        details: { name },
        req
      });

      sendSuccess(res, newItem, 'Product created successfully.', 201);
    } catch (error: any) {
      this.auditService.logEvent({
        userId: req.user?.id,
        actorType: (req.user as any)?.role || AuditActorType.ADMIN,
        actorName: req.user?.email,
        action: AuditAction.PRODUCT_CREATE,
        status: AuditStatus.FAILURE,
        entityType: AuditEntityType.PRODUCT,
        details: { name: req.body.name, error: error.message },
        req
      });
      next(error);
    }
  };

  updateItem = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const updatedFields = req.body;
      const updatedItem = await this.menuService.updateItem(id, updatedFields);
      
      this.auditService.logEvent({
        userId: req.user?.id,
        actorType: (req.user as any)?.role || AuditActorType.ADMIN,
        actorName: req.user?.email,
        action: AuditAction.PRODUCT_UPDATE,
        status: AuditStatus.SUCCESS,
        entityType: AuditEntityType.PRODUCT,
        entityId: id,
        details: { updatedFields },
        req
      });

      sendSuccess(res, updatedItem, 'Product updated successfully.');
    } catch (error: any) {
      this.auditService.logEvent({
        userId: req.user?.id,
        actorType: (req.user as any)?.role || AuditActorType.ADMIN,
        actorName: req.user?.email,
        action: AuditAction.PRODUCT_UPDATE,
        status: AuditStatus.FAILURE,
        entityType: AuditEntityType.PRODUCT,
        entityId: req.params.id,
        details: { updatedFields: req.body, error: error.message },
        req
      });
      next(error);
    }
  };

  deleteItem = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      await this.menuService.deleteItem(id);
      
      this.auditService.logEvent({
        userId: req.user?.id,
        actorType: (req.user as any)?.role || AuditActorType.ADMIN,
        actorName: req.user?.email,
        action: AuditAction.PRODUCT_DELETE,
        status: AuditStatus.SUCCESS,
        entityType: AuditEntityType.PRODUCT,
        entityId: id,
        req
      });

      sendSuccess(res, null, 'Product deleted successfully.');
    } catch (error: any) {
      this.auditService.logEvent({
        userId: req.user?.id,
        actorType: (req.user as any)?.role || AuditActorType.ADMIN,
        actorName: req.user?.email,
        action: AuditAction.PRODUCT_DELETE,
        status: AuditStatus.FAILURE,
        entityType: AuditEntityType.PRODUCT,
        entityId: req.params.id,
        details: { error: error.message },
        req
      });
      next(error);
    }
  };
}
