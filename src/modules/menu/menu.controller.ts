import { Request, Response, NextFunction } from 'express';
import { MenuService } from './menu.service';
import { sendSuccess } from '../../utils/response';
import { auditService } from '../audit/audit.service';
import { AuditActorType, AuditAction, AuditStatus, AuditEntityType } from '../audit/audit.constants';

export class MenuController {
  private menuService: MenuService;

  constructor() {
    this.menuService = new MenuService();
  }

  getAllItems = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // Admins can see inactive items if they pass query onlyActive=false
      const onlyActive = req.query.onlyActive !== 'false';
      const items = await this.menuService.getAllItems(onlyActive);
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

      auditService.logEvent({
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
      auditService.logEvent({
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
      
      auditService.logEvent({
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
      auditService.logEvent({
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
      
      auditService.logEvent({
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
      auditService.logEvent({
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
