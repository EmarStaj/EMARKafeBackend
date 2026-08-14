import { injectable } from 'tsyringe';
import { Request, Response, NextFunction } from 'express';
import { CategoryService } from './category.service';
import { sendSuccess } from '../../utils/response';
import { AuditService } from '../audit/audit.service';
import { AuditActorType, AuditAction, AuditStatus, AuditEntityType } from '../audit/audit.constants';

@injectable()
export class CategoryController {
  constructor(
    private categoryService: CategoryService,
    private auditService: AuditService
  ) {}

  getAllCategories = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const categories = await this.categoryService.getAllCategories();
      sendSuccess(res, categories, 'Categories retrieved successfully.');
    } catch (error) {
      next(error);
    }
  };

  getCategoryById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const category = await this.categoryService.getCategoryById(id);
      sendSuccess(res, category, 'Category retrieved successfully.');
    } catch (error) {
      next(error);
    }
  };

  createCategory = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { name, sort_order } = req.body;
      const newCategory = await this.categoryService.createCategory({ name, sort_order });
      
      this.auditService.logEvent({
        userId: req.user?.id,
        actorType: (req.user as any)?.role || AuditActorType.ADMIN,
        actorName: req.user?.email,
        action: AuditAction.CATEGORY_CREATE,
        status: AuditStatus.SUCCESS,
        entityType: AuditEntityType.CATEGORY,
        entityId: newCategory.id,
        details: { name },
        req
      });

      sendSuccess(res, newCategory, 'Category created successfully.', 201);
    } catch (error: any) {
      this.auditService.logEvent({
        userId: req.user?.id,
        actorType: (req.user as any)?.role || AuditActorType.ADMIN,
        actorName: req.user?.email,
        action: AuditAction.CATEGORY_CREATE,
        status: AuditStatus.FAILURE,
        entityType: AuditEntityType.CATEGORY,
        details: { name: req.body.name, error: error.message },
        req
      });
      next(error);
    }
  };

  updateCategory = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const updatedFields = req.body;
      const updatedCategory = await this.categoryService.updateCategory(id, updatedFields);
      
      this.auditService.logEvent({
        userId: req.user?.id,
        actorType: (req.user as any)?.role || AuditActorType.ADMIN,
        actorName: req.user?.email,
        action: AuditAction.CATEGORY_UPDATE,
        status: AuditStatus.SUCCESS,
        entityType: AuditEntityType.CATEGORY,
        entityId: id,
        details: { updatedFields },
        req
      });

      sendSuccess(res, updatedCategory, 'Category updated successfully.');
    } catch (error: any) {
      this.auditService.logEvent({
        userId: req.user?.id,
        actorType: (req.user as any)?.role || AuditActorType.ADMIN,
        actorName: req.user?.email,
        action: AuditAction.CATEGORY_UPDATE,
        status: AuditStatus.FAILURE,
        entityType: AuditEntityType.CATEGORY,
        entityId: req.params.id,
        details: { updatedFields: req.body, error: error.message },
        req
      });
      next(error);
    }
  };

  deleteCategory = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      await this.categoryService.deleteCategory(id);
      
      this.auditService.logEvent({
        userId: req.user?.id,
        actorType: (req.user as any)?.role || AuditActorType.ADMIN,
        actorName: req.user?.email,
        action: AuditAction.CATEGORY_DELETE,
        status: AuditStatus.SUCCESS,
        entityType: AuditEntityType.CATEGORY,
        entityId: id,
        req
      });

      sendSuccess(res, null, 'Category deleted successfully.');
    } catch (error: any) {
      this.auditService.logEvent({
        userId: req.user?.id,
        actorType: (req.user as any)?.role || AuditActorType.ADMIN,
        actorName: req.user?.email,
        action: AuditAction.CATEGORY_DELETE,
        status: AuditStatus.FAILURE,
        entityType: AuditEntityType.CATEGORY,
        entityId: req.params.id,
        details: { error: error.message },
        req
      });
      next(error);
    }
  };
}
