import 'reflect-metadata';
import { Request, Response, NextFunction } from 'express';
import { container } from 'tsyringe';
import { AuditController } from '../../../modules/audit/audit.controller';
import { AuditService } from '../../../modules/audit/audit.service';
import { AuditActorType, AuditAction, AuditStatus } from '../../../modules/audit/audit.constants';

const mockAuditService = {
  getAuditLogs: jest.fn(),
};

// Register mock in DI container
container.registerInstance(AuditService, mockAuditService as any);

const auditController = container.resolve(AuditController);

describe('AuditController', () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    mockReq = {
      query: {},
    };
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    mockNext = jest.fn();
    jest.clearAllMocks();
  });

  describe('getAuditLogs', () => {
    it('should return audit logs successfully with default pagination', async () => {
      const mockResult = {
        data: [{ id: '1', action: 'login' }],
        meta: { total: 1, page: 1, limit: 50, totalPages: 1 },
      };

      mockAuditService.getAuditLogs.mockResolvedValueOnce(mockResult);

      await auditController.getAuditLogs(mockReq as Request, mockRes as Response, mockNext);

      expect(mockAuditService.getAuditLogs).toHaveBeenCalledWith({
        page: 1,
        limit: 50,
        actorType: undefined,
        branchId: undefined,
        action: undefined,
        status: undefined,
        startDate: undefined,
        endDate: undefined,
      });

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        status: 'success',
        ...mockResult,
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should pass query parameters correctly to the service', async () => {
      const mockResult = {
        data: [],
        meta: { total: 0, page: 2, limit: 10, totalPages: 0 },
      };

      mockReq.query = {
        page: '2',
        limit: '10',
        actorType: AuditActorType.ADMIN,
        action: AuditAction.PRODUCT_CREATE,
        status: AuditStatus.SUCCESS,
        branchId: 'branch-xyz',
        startDate: '2023-01-01',
        endDate: '2023-12-31'
      };

      mockAuditService.getAuditLogs.mockResolvedValueOnce(mockResult);

      await auditController.getAuditLogs(mockReq as Request, mockRes as Response, mockNext);

      expect(mockAuditService.getAuditLogs).toHaveBeenCalledWith({
        page: 2,
        limit: 10,
        actorType: AuditActorType.ADMIN,
        branchId: 'branch-xyz',
        action: AuditAction.PRODUCT_CREATE,
        status: AuditStatus.SUCCESS,
        startDate: '2023-01-01',
        endDate: '2023-12-31',
      });

      expect(mockRes.status).toHaveBeenCalledWith(200);
    });

    it('should call next with error if service throws', async () => {
      const error = new Error('Service Error');
      mockAuditService.getAuditLogs.mockRejectedValueOnce(error);

      await auditController.getAuditLogs(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
      expect(mockRes.status).not.toHaveBeenCalled();
    });
  });
});
