import 'reflect-metadata';
import { CategoryController } from '../category.controller';
import { CategoryService } from '../category.service';
import { AuditService } from '../../audit/audit.service';
import { Request, Response, NextFunction } from 'express';
import { AuditAction, AuditStatus, AuditActorType } from '../../audit/audit.constants';
import { sendSuccess } from '../../../utils/response';

jest.mock('../category.service');
jest.mock('../../audit/audit.service');
jest.mock('../../../utils/response', () => ({
  sendSuccess: jest.fn()
}));

describe('CategoryController', () => {
  let controller: CategoryController;
  let service: jest.Mocked<CategoryService>;
  let audit: jest.Mocked<AuditService>;
  let req: Partial<Request>;
  let res: Partial<Response>;
  let next: NextFunction;

  beforeEach(() => {
    service = new CategoryService(null as any) as jest.Mocked<CategoryService>;
    audit = new AuditService() as jest.Mocked<AuditService>;
    controller = new CategoryController(service, audit);
    
    req = {
      params: {},
      body: {},
      user: { id: 'u1', email: 'test@test.com', role: 'admin' }
    } as any;
    res = {};
    next = jest.fn();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getAllCategories', () => {
    it('should return all categories', async () => {
      const mockCats = [{ id: '1', name: 'Cat 1' }];
      service.getAllCategories.mockResolvedValue(mockCats as any);

      await controller.getAllCategories(req as Request, res as Response, next);

      expect(sendSuccess).toHaveBeenCalledWith(res, mockCats, 'Categories retrieved successfully.');
      expect(next).not.toHaveBeenCalled();
    });

    it('should call next on error', async () => {
      const error = new Error('error');
      service.getAllCategories.mockRejectedValue(error);

      await controller.getAllCategories(req as Request, res as Response, next);
      expect(next).toHaveBeenCalledWith(error);
    });
  });

  describe('getCategoryById', () => {
    it('should return a category by id', async () => {
      req.params = { id: '1' };
      const mockCat = { id: '1', name: 'Cat 1' };
      service.getCategoryById.mockResolvedValue(mockCat as any);

      await controller.getCategoryById(req as Request, res as Response, next);

      expect(sendSuccess).toHaveBeenCalledWith(res, mockCat, 'Category retrieved successfully.');
    });

    it('should call next on error', async () => {
      req.params = { id: '1' };
      const error = new Error('error');
      service.getCategoryById.mockRejectedValue(error);

      await controller.getCategoryById(req as Request, res as Response, next);
      expect(next).toHaveBeenCalledWith(error);
    });
  });

  describe('createCategory', () => {
    it('should create a category and log audit success', async () => {
      req.body = { name: 'Cat 1', sort_order: 1 };
      const mockCat = { id: '1', name: 'Cat 1', sort_order: 1 };
      service.createCategory.mockResolvedValue(mockCat);

      await controller.createCategory(req as Request, res as Response, next);

      expect(sendSuccess).toHaveBeenCalledWith(res, mockCat, 'Category created successfully.', 201);
      expect(audit.logEvent).toHaveBeenCalledWith(expect.objectContaining({
        action: AuditAction.CATEGORY_CREATE,
        status: AuditStatus.SUCCESS,
        entityId: '1',
        details: { name: 'Cat 1' }
      }));
    });

    it('should fallback to Admin role if user role is missing on create', async () => {
      req.body = { name: 'Cat 1' };
      (req.user as any).role = undefined;
      const mockCat = { id: '1', name: 'Cat 1' };
      service.createCategory.mockResolvedValue(mockCat);

      await controller.createCategory(req as Request, res as Response, next);

      expect(audit.logEvent).toHaveBeenCalledWith(expect.objectContaining({
        actorType: AuditActorType.ADMIN
      }));
    });

    it('should call next and log audit failure on error', async () => {
      req.body = { name: 'Cat 1' };
      const error = new Error('error');
      service.createCategory.mockRejectedValue(error);

      await controller.createCategory(req as Request, res as Response, next);
      
      expect(next).toHaveBeenCalledWith(error);
      expect(audit.logEvent).toHaveBeenCalledWith(expect.objectContaining({
        action: AuditAction.CATEGORY_CREATE,
        status: AuditStatus.FAILURE,
        details: { name: 'Cat 1', error: 'error' }
      }));
    });
    
    it('should fallback to Admin role if user role is missing on create error', async () => {
      req.body = { name: 'Cat 1' };
      (req.user as any).role = undefined;
      service.createCategory.mockRejectedValue(new Error('error'));

      await controller.createCategory(req as Request, res as Response, next);
      
      expect(audit.logEvent).toHaveBeenCalledWith(expect.objectContaining({
        actorType: AuditActorType.ADMIN
      }));
    });
  });

  describe('updateCategory', () => {
    it('should update a category and log audit success', async () => {
      req.params = { id: '1' };
      req.body = { name: 'Cat 2' };
      const mockCat = { id: '1', name: 'Cat 2' };
      service.updateCategory.mockResolvedValue(mockCat);

      await controller.updateCategory(req as Request, res as Response, next);

      expect(sendSuccess).toHaveBeenCalledWith(res, mockCat, 'Category updated successfully.');
      expect(audit.logEvent).toHaveBeenCalledWith(expect.objectContaining({
        action: AuditAction.CATEGORY_UPDATE,
        status: AuditStatus.SUCCESS,
        entityId: '1'
      }));
    });
    
    it('should fallback to Admin role if user role is missing on update', async () => {
      req.params = { id: '1' };
      req.body = { name: 'Cat 2' };
      (req.user as any).role = undefined;
      const mockCat = { id: '1', name: 'Cat 2' };
      service.updateCategory.mockResolvedValue(mockCat);

      await controller.updateCategory(req as Request, res as Response, next);

      expect(audit.logEvent).toHaveBeenCalledWith(expect.objectContaining({
        actorType: AuditActorType.ADMIN
      }));
    });

    it('should call next and log audit failure on error', async () => {
      req.params = { id: '1' };
      req.body = { name: 'Cat 2' };
      const error = new Error('error');
      service.updateCategory.mockRejectedValue(error);

      await controller.updateCategory(req as Request, res as Response, next);

      expect(next).toHaveBeenCalledWith(error);
      expect(audit.logEvent).toHaveBeenCalledWith(expect.objectContaining({
        action: AuditAction.CATEGORY_UPDATE,
        status: AuditStatus.FAILURE,
        entityId: '1'
      }));
    });
    
    it('should fallback to Admin role if user role is missing on update error', async () => {
      req.params = { id: '1' };
      req.body = { name: 'Cat 2' };
      (req.user as any).role = undefined;
      service.updateCategory.mockRejectedValue(new Error('error'));

      await controller.updateCategory(req as Request, res as Response, next);

      expect(audit.logEvent).toHaveBeenCalledWith(expect.objectContaining({
        actorType: AuditActorType.ADMIN
      }));
    });
  });

  describe('deleteCategory', () => {
    it('should delete a category and log audit success', async () => {
      req.params = { id: '1' };
      service.deleteCategory.mockResolvedValue(undefined);

      await controller.deleteCategory(req as Request, res as Response, next);

      expect(sendSuccess).toHaveBeenCalledWith(res, null, 'Category deleted successfully.');
      expect(audit.logEvent).toHaveBeenCalledWith(expect.objectContaining({
        action: AuditAction.CATEGORY_DELETE,
        status: AuditStatus.SUCCESS,
        entityId: '1'
      }));
    });
    
    it('should fallback to Admin role if user role is missing on delete', async () => {
      req.params = { id: '1' };
      (req.user as any).role = undefined;
      service.deleteCategory.mockResolvedValue(undefined);

      await controller.deleteCategory(req as Request, res as Response, next);

      expect(audit.logEvent).toHaveBeenCalledWith(expect.objectContaining({
        actorType: AuditActorType.ADMIN
      }));
    });

    it('should call next and log audit failure on error', async () => {
      req.params = { id: '1' };
      const error = new Error('error');
      service.deleteCategory.mockRejectedValue(error);

      await controller.deleteCategory(req as Request, res as Response, next);

      expect(next).toHaveBeenCalledWith(error);
      expect(audit.logEvent).toHaveBeenCalledWith(expect.objectContaining({
        action: AuditAction.CATEGORY_DELETE,
        status: AuditStatus.FAILURE,
        entityId: '1'
      }));
    });
    
    it('should fallback to Admin role if user role is missing on delete error', async () => {
      req.params = { id: '1' };
      (req.user as any).role = undefined;
      service.deleteCategory.mockRejectedValue(new Error('error'));

      await controller.deleteCategory(req as Request, res as Response, next);

      expect(audit.logEvent).toHaveBeenCalledWith(expect.objectContaining({
        actorType: AuditActorType.ADMIN
      }));
    });
  });
});
