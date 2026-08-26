import 'reflect-metadata';
import { Request, Response, NextFunction } from 'express';
import { BranchController } from '../branch.controller';
import { BranchService } from '../branch.service';
import { AuditService } from '../../audit/audit.service';
import { AuditStatus, AuditAction, AuditActorType } from '../../audit/audit.constants';
import { AppError } from '../../../utils/app-error';

jest.mock('../../../utils/response', () => ({
  sendSuccess: jest.fn(),
}));

import { sendSuccess } from '../../../utils/response';

describe('BranchController', () => {
  let controller: BranchController;
  let branchServiceMock: jest.Mocked<BranchService>;
  let auditServiceMock: jest.Mocked<AuditService>;
  let req: Partial<Request>;
  let res: Partial<Response>;
  let next: NextFunction;

  beforeEach(() => {
    branchServiceMock = {
      getAllBranches: jest.fn(),
      getBranchById: jest.fn(),
      createBranch: jest.fn(),
      updateBranch: jest.fn(),
      deleteBranch: jest.fn(),
      getBranchProducts: jest.fn(),
      updateBranchProductAvailability: jest.fn(),
    } as unknown as jest.Mocked<BranchService>;

    auditServiceMock = {
      logEvent: jest.fn(),
    } as unknown as jest.Mocked<AuditService>;

    controller = new BranchController(branchServiceMock, auditServiceMock);
    
    req = {
      params: {},
      query: {},
      body: {},
      user: { id: 'user1', email: 'user@example.com' } as any,
      profile: { role: 'admin' } as any,
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    next = jest.fn();
    jest.clearAllMocks();
  });

  describe('getAllBranches', () => {
    it('should get all active branches by default', async () => {
      const branches = [{ id: '1', name: 'Branch 1' }];
      branchServiceMock.getAllBranches.mockResolvedValue(branches);

      await controller.getAllBranches(req as Request, res as Response, next);

      expect(branchServiceMock.getAllBranches).toHaveBeenCalledWith(true);
      expect(sendSuccess).toHaveBeenCalledWith(res, branches, 'Branches retrieved successfully.');
    });

    it('should get all branches if onlyActive is false', async () => {
      req.query = { onlyActive: 'false' };
      const branches = [{ id: '1', name: 'Branch 1' }];
      branchServiceMock.getAllBranches.mockResolvedValue(branches);

      await controller.getAllBranches(req as Request, res as Response, next);

      expect(branchServiceMock.getAllBranches).toHaveBeenCalledWith(false);
    });

    it('should call next with error on failure', async () => {
      const error = new Error('Test error');
      branchServiceMock.getAllBranches.mockRejectedValue(error);

      await controller.getAllBranches(req as Request, res as Response, next);

      expect(next).toHaveBeenCalledWith(error);
    });
  });

  describe('getBranchById', () => {
    it('should get a branch by id', async () => {
      req.params = { id: '1' };
      const branch = { id: '1', name: 'Branch 1' };
      branchServiceMock.getBranchById.mockResolvedValue(branch);

      await controller.getBranchById(req as Request, res as Response, next);

      expect(branchServiceMock.getBranchById).toHaveBeenCalledWith('1');
      expect(sendSuccess).toHaveBeenCalledWith(res, branch, 'Branch retrieved successfully.');
    });

    it('should call next with error on failure', async () => {
      const error = new Error('Test error');
      branchServiceMock.getBranchById.mockRejectedValue(error);

      await controller.getBranchById(req as Request, res as Response, next);

      expect(next).toHaveBeenCalledWith(error);
    });
  });

  describe('createBranch', () => {
    it('should create a branch', async () => {
      req.body = { name: 'Branch 1', address: '123 St', lat: 0, lng: 0, opening_hours: '9-5', is_active: true };
      const newBranch = { id: '1', ...req.body };
      branchServiceMock.createBranch.mockResolvedValue(newBranch);

      await controller.createBranch(req as Request, res as Response, next);

      expect(branchServiceMock.createBranch).toHaveBeenCalledWith(req.body);
      expect(sendSuccess).toHaveBeenCalledWith(res, newBranch, 'Branch created successfully.', 201);
    });

    it('should call next with error on failure', async () => {
      const error = new Error('Test error');
      branchServiceMock.createBranch.mockRejectedValue(error);

      await controller.createBranch(req as Request, res as Response, next);

      expect(next).toHaveBeenCalledWith(error);
    });
  });

  describe('updateBranch', () => {
    it('should update a branch for admin', async () => {
      req.params = { id: '1' };
      req.body = { name: 'Updated Branch' };
      req.profile = { role: 'admin' } as any;
      const updatedBranch = { id: '1', name: 'Updated Branch' };
      branchServiceMock.updateBranch.mockResolvedValue(updatedBranch);

      await controller.updateBranch(req as Request, res as Response, next);

      expect(branchServiceMock.updateBranch).toHaveBeenCalledWith('1', req.body);
      expect(sendSuccess).toHaveBeenCalledWith(res, updatedBranch, 'Branch updated successfully.');
    });

    it('should update a branch for branch_manager if it is their branch', async () => {
      req.params = { id: '1' };
      req.body = { name: 'Updated Branch' };
      req.profile = { role: 'branch_manager', branch_id: '1' } as any;
      const updatedBranch = { id: '1', name: 'Updated Branch' };
      branchServiceMock.updateBranch.mockResolvedValue(updatedBranch);

      await controller.updateBranch(req as Request, res as Response, next);

      expect(branchServiceMock.updateBranch).toHaveBeenCalledWith('1', req.body);
    });

    it('should throw Forbidden for branch_manager if it is NOT their branch', async () => {
      req.params = { id: '1' };
      req.profile = { role: 'branch_manager', branch_id: '2' } as any;

      await controller.updateBranch(req as Request, res as Response, next);

      expect(next).toHaveBeenCalledWith(expect.any(AppError));
      const calledError = (next as jest.Mock).mock.calls[0][0];
      expect(calledError.statusCode).toBe(403);
      expect(calledError.message).toBe('Forbidden: You can only update your own branch.');
    });

    it('should call next with error on failure', async () => {
      req.params = { id: '1' };
      const error = new Error('Test error');
      branchServiceMock.updateBranch.mockRejectedValue(error);

      await controller.updateBranch(req as Request, res as Response, next);

      expect(next).toHaveBeenCalledWith(error);
    });
  });

  describe('deleteBranch', () => {
    it('should delete a branch', async () => {
      req.params = { id: '1' };
      branchServiceMock.deleteBranch.mockResolvedValue();

      await controller.deleteBranch(req as Request, res as Response, next);

      expect(branchServiceMock.deleteBranch).toHaveBeenCalledWith('1');
      expect(sendSuccess).toHaveBeenCalledWith(res, null, 'Branch deleted successfully.');
    });

    it('should call next with error on failure', async () => {
      req.params = { id: '1' };
      const error = new Error('Test error');
      branchServiceMock.deleteBranch.mockRejectedValue(error);

      await controller.deleteBranch(req as Request, res as Response, next);

      expect(next).toHaveBeenCalledWith(error);
    });
  });

  describe('getBranchProducts', () => {
    it('should get branch products', async () => {
      req.params = { branchId: '1' };
      const products: any = [{ product_id: 'p1' }];
      branchServiceMock.getBranchProducts.mockResolvedValue(products);

      await controller.getBranchProducts(req as Request, res as Response, next);

      expect(branchServiceMock.getBranchProducts).toHaveBeenCalledWith('1');
      expect(sendSuccess).toHaveBeenCalledWith(res, products, 'Branch product availability retrieved successfully.');
    });

    it('should call next with error on failure', async () => {
      req.params = { branchId: '1' };
      const error = new Error('Test error');
      branchServiceMock.getBranchProducts.mockRejectedValue(error);

      await controller.getBranchProducts(req as Request, res as Response, next);

      expect(next).toHaveBeenCalledWith(error);
    });
  });

  describe('updateBranchProductAvailability', () => {
    it('should throw 401 if userId is missing', async () => {
      req.user = undefined;
      req.params = { branchId: '1', productId: 'p1' };
      req.body = { is_available: true };

      await controller.updateBranchProductAvailability(req as Request, res as Response, next);

      expect(next).toHaveBeenCalledWith(expect.any(AppError));
      const calledError = (next as jest.Mock).mock.calls[0][0];
      expect(calledError.statusCode).toBe(401);
      expect(calledError.message).toBe('Unauthorized');
    });

    it('should throw 403 if barista tries to update other branch', async () => {
      req.params = { branchId: '1', productId: 'p1' };
      req.profile = { role: 'barista', branch_id: '2' } as any;
      req.body = { is_available: true };

      await controller.updateBranchProductAvailability(req as Request, res as Response, next);

      expect(next).toHaveBeenCalledWith(expect.any(AppError));
      const calledError = (next as jest.Mock).mock.calls[0][0];
      expect(calledError.statusCode).toBe(403);
      expect(calledError.message).toBe('Forbidden: You can only manage stock of your own branch.');
    });

    it('should allow barista to update their own branch stock', async () => {
      req.params = { branchId: '1', productId: 'p1' };
      req.profile = { role: 'barista', branch_id: '1' } as any;
      req.body = { is_available: false };
      const updatedMapping = { id: 'mapping-1' };
      branchServiceMock.updateBranchProductAvailability.mockResolvedValue(updatedMapping);

      await controller.updateBranchProductAvailability(req as Request, res as Response, next);

      expect(branchServiceMock.updateBranchProductAvailability).toHaveBeenCalledWith('1', 'p1', false, 'user1');
      expect(sendSuccess).toHaveBeenCalledWith(res, updatedMapping, 'Product availability updated successfully.');
      expect(auditServiceMock.logEvent).toHaveBeenCalledWith(expect.objectContaining({ status: AuditStatus.SUCCESS }));
    });

    it('should allow branch_manager to update their own branch stock', async () => {
      req.params = { branchId: '1', productId: 'p1' };
      req.profile = { role: 'branch_manager', branch_id: '1' } as any;
      req.body = { is_available: false };
      const updatedMapping = { id: 'mapping-1' };
      branchServiceMock.updateBranchProductAvailability.mockResolvedValue(updatedMapping);

      await controller.updateBranchProductAvailability(req as Request, res as Response, next);

      expect(branchServiceMock.updateBranchProductAvailability).toHaveBeenCalledWith('1', 'p1', false, 'user1');
      expect(sendSuccess).toHaveBeenCalledWith(res, updatedMapping, 'Product availability updated successfully.');
      expect(auditServiceMock.logEvent).toHaveBeenCalledWith(expect.objectContaining({ status: AuditStatus.SUCCESS }));
    });
    
    it('should default to BARISTA actorType if req.user.role is not provided', async () => {
      req.params = { branchId: '1', productId: 'p1' };
      req.profile = { role: 'admin' } as any;
      req.body = { is_available: false };
      const updatedMapping = { id: 'mapping-1' };
      branchServiceMock.updateBranchProductAvailability.mockResolvedValue(updatedMapping);

      await controller.updateBranchProductAvailability(req as Request, res as Response, next);

      expect(auditServiceMock.logEvent).toHaveBeenCalledWith(expect.objectContaining({ actorType: AuditActorType.BARISTA, status: AuditStatus.SUCCESS }));
    });

    it('should call next with error and log failure on failure', async () => {
      req.params = { branchId: '1', productId: 'p1' };
      req.body = { is_available: true };
      req.profile = { role: 'admin' } as any;
      req.user = { id: 'user1', email: 'user@example.com', role: 'admin' } as any;
      const error = new Error('Test error');
      branchServiceMock.updateBranchProductAvailability.mockRejectedValue(error);

      await controller.updateBranchProductAvailability(req as Request, res as Response, next);

      expect(next).toHaveBeenCalledWith(error);
      expect(auditServiceMock.logEvent).toHaveBeenCalledWith(expect.objectContaining({ status: AuditStatus.FAILURE, action: AuditAction.STOCK_UPDATE }));
    });
    
    it('should log event with correct actorType if req.user has role for success', async () => {
      req.params = { branchId: '1', productId: 'p1' };
      req.profile = { role: 'admin' } as any;
      req.body = { is_available: false };
      req.user = { id: 'user1', email: 'user@example.com', role: 'admin' } as any;
      const updatedMapping = { id: 'mapping-1' };
      branchServiceMock.updateBranchProductAvailability.mockResolvedValue(updatedMapping);

      await controller.updateBranchProductAvailability(req as Request, res as Response, next);

      expect(auditServiceMock.logEvent).toHaveBeenCalledWith(expect.objectContaining({ actorType: 'admin', status: AuditStatus.SUCCESS }));
    });

    it('should log event with correct actorType if req.user has role for failure', async () => {
      req.params = { branchId: '1', productId: 'p1' };
      req.profile = { role: 'admin' } as any;
      req.body = { is_available: false };
      req.user = { id: 'user1', email: 'user@example.com', role: 'admin' } as any;
      const error = new Error('Test error');
      branchServiceMock.updateBranchProductAvailability.mockRejectedValue(error);

      await controller.updateBranchProductAvailability(req as Request, res as Response, next);

      expect(auditServiceMock.logEvent).toHaveBeenCalledWith(expect.objectContaining({ actorType: 'admin', status: AuditStatus.FAILURE }));
    });
    
    it('should handle undefined user details in failure log', async () => {
      req.params = { branchId: '1', productId: 'p1' };
      req.profile = { role: 'admin' } as any;
      req.body = { is_available: false };
      // User has no role or we simulate a case where we hit failure logging directly
      const error = new Error('Test error');
      branchServiceMock.updateBranchProductAvailability.mockRejectedValue(error);
      
      // Let's set req.user to undefined just before to see if it defaults correctly in failure.
      // Wait, if req.user is undefined, it throws 'Unauthorized' at line 96!
      
      await controller.updateBranchProductAvailability(req as Request, res as Response, next);
      
      expect(auditServiceMock.logEvent).toHaveBeenCalledWith(expect.objectContaining({ status: AuditStatus.FAILURE, actorType: 'barista' }));
    });
  });
});
