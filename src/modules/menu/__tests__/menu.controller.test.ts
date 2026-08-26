import 'reflect-metadata';
import { Request, Response } from 'express';
import { MenuController } from '../menu.controller';
import { MenuService } from '../menu.service';
import { AuditService } from '../../audit/audit.service';
import { sendSuccess } from '../../../utils/response';


jest.mock('../../../utils/response');

describe('MenuController', () => {
  let controller: MenuController;
  let menuService: jest.Mocked<MenuService>;
  let auditService: jest.Mocked<AuditService>;
  let req: Partial<Request>;
  let res: Partial<Response>;
  let next: jest.Mock;

  beforeEach(() => {
    menuService = {
      getAllItems: jest.fn(),
      getItemById: jest.fn(),
      createItem: jest.fn(),
      updateItem: jest.fn(),
      deleteItem: jest.fn(),
    } as any;
    
    auditService = {
      logEvent: jest.fn(),
    } as any;

    controller = new MenuController(menuService, auditService);
    req = { query: {}, params: {}, body: {}, user: { id: 'u1', email: 'test@test.com' }, profile: {} } as any;
    res = { status: jest.fn().mockReturnThis(), json: jest.fn() } as any;
    next = jest.fn();
    jest.clearAllMocks();
  });

  describe('getAllItems', () => {
    it('should get active items by default', async () => {
      menuService.getAllItems.mockResolvedValue([{ id: '1' }] as any);
      await controller.getAllItems(req as Request, res as Response, next);
      expect(menuService.getAllItems).toHaveBeenCalledWith(true, undefined, undefined, undefined);
      expect(sendSuccess).toHaveBeenCalledWith(res, [{ id: '1' }], 'Products retrieved successfully.');
    });

    it('should get all items if onlyActive=false and user is admin', async () => {
      req.query = { onlyActive: 'false' };
      req.profile = { role: 'admin' } as any;
      menuService.getAllItems.mockResolvedValue([{ id: '1' }] as any);
      await controller.getAllItems(req as Request, res as Response, next);
      expect(menuService.getAllItems).toHaveBeenCalledWith(false, undefined, undefined, undefined);
    });

    it('should get active items if onlyActive=false but user is customer', async () => {
      req.query = { onlyActive: 'false' };
      req.profile = { role: 'customer' } as any;
      menuService.getAllItems.mockResolvedValue([{ id: '1' }] as any);
      await controller.getAllItems(req as Request, res as Response, next);
      expect(menuService.getAllItems).toHaveBeenCalledWith(true, undefined, undefined, undefined);
    });

    it('should pass search and categoryId', async () => {
      req.query = { search: 'coffee', category_id: 'cat1' };
      menuService.getAllItems.mockResolvedValue([{ id: '1' }] as any);
      await controller.getAllItems(req as Request, res as Response, next);
      expect(menuService.getAllItems).toHaveBeenCalledWith(true, 'coffee', 'cat1', undefined);
    });

    it('should call next on error', async () => {
      menuService.getAllItems.mockRejectedValue(new Error('err'));
      await controller.getAllItems(req as Request, res as Response, next);
      expect(next).toHaveBeenCalledWith(expect.any(Error));
    });
  });

  describe('getItemById', () => {
    it('should get item by id', async () => {
      req.params = { id: '1' };
      menuService.getItemById.mockResolvedValue({ id: '1' } as any);
      await controller.getItemById(req as Request, res as Response, next);
      expect(menuService.getItemById).toHaveBeenCalledWith('1');
    });

    it('should call next on error', async () => {
      menuService.getItemById.mockRejectedValue(new Error('err'));
      await controller.getItemById(req as Request, res as Response, next);
      expect(next).toHaveBeenCalledWith(expect.any(Error));
    });
  });

  describe('createItem', () => {
    it('should create item successfully', async () => {
      req.body = { name: 'Latte' };
      menuService.createItem.mockResolvedValue({ id: '1', name: 'Latte' } as any);
      await controller.createItem(req as Request, res as Response, next);
      expect(auditService.logEvent).toHaveBeenCalledWith(expect.objectContaining({ status: 'success' }));
      expect(sendSuccess).toHaveBeenCalledWith(res, { id: '1', name: 'Latte' }, 'Product created successfully.', 201);
    });

    it('should call next and log failure on error', async () => {
      req.body = { name: 'Latte' };
      menuService.createItem.mockRejectedValue(new Error('err'));
      await controller.createItem(req as Request, res as Response, next);
      expect(auditService.logEvent).toHaveBeenCalledWith(expect.objectContaining({ status: 'failure' }));
      expect(next).toHaveBeenCalledWith(expect.any(Error));
    });
  });

  describe('updateItem', () => {
    it('should update item successfully', async () => {
      req.params = { id: '1' };
      req.body = { name: 'Latte2' };
      menuService.updateItem.mockResolvedValue({ id: '1', name: 'Latte2' } as any);
      await controller.updateItem(req as Request, res as Response, next);
      expect(auditService.logEvent).toHaveBeenCalledWith(expect.objectContaining({ status: 'success' }));
      expect(sendSuccess).toHaveBeenCalledWith(res, { id: '1', name: 'Latte2' }, 'Product updated successfully.');
    });

    it('should call next and log failure on error', async () => {
      req.params = { id: '1' };
      menuService.updateItem.mockRejectedValue(new Error('err'));
      await controller.updateItem(req as Request, res as Response, next);
      expect(auditService.logEvent).toHaveBeenCalledWith(expect.objectContaining({ status: 'failure' }));
      expect(next).toHaveBeenCalledWith(expect.any(Error));
    });
  });

  describe('deleteItem', () => {
    it('should delete item successfully', async () => {
      req.params = { id: '1' };
      menuService.deleteItem.mockResolvedValue(undefined);
      await controller.deleteItem(req as Request, res as Response, next);
      expect(auditService.logEvent).toHaveBeenCalledWith(expect.objectContaining({ status: 'success' }));
      expect(sendSuccess).toHaveBeenCalledWith(res, null, 'Product deleted successfully.');
    });

    it('should call next and log failure on error', async () => {
      req.params = { id: '1' };
      menuService.deleteItem.mockRejectedValue(new Error('err'));
      await controller.deleteItem(req as Request, res as Response, next);
      expect(auditService.logEvent).toHaveBeenCalledWith(expect.objectContaining({ status: 'failure' }));
      expect(next).toHaveBeenCalledWith(expect.any(Error));
    });
  });
});
