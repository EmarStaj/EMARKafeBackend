import 'reflect-metadata';
import { StaffController } from '../staff.controller';
import { StaffService } from '../staff.service';
import { Request, Response, NextFunction } from 'express';
import { AppError } from '../../../utils/app-error';

describe('StaffController', () => {
  let controller: StaffController;
  let service: jest.Mocked<StaffService>;
  let req: Partial<Request>;
  let res: Partial<Response>;
  let next: NextFunction;

  beforeEach(() => {
    service = {
      createStaff: jest.fn(),
      getStaffList: jest.fn(),
      getStaffById: jest.fn(),
      updateStaff: jest.fn(),
      deleteStaff: jest.fn(),
    } as any;
    controller = new StaffController(service);

    req = { profile: { id: 'u1' }, query: {}, params: {}, body: {} } as any;
    res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    next = jest.fn();
    jest.clearAllMocks();
  });

  describe('createStaff', () => {
    it('should create staff', async () => {
      service.createStaff.mockResolvedValue({ id: '1' } as any);
      await controller.createStaff(req as Request, res as Response, next);
      
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ data: { id: '1' } }));
    });

    it('should handle unauth', async () => {
      req.profile = undefined;
      await controller.createStaff(req as Request, res as Response, next);
      expect(next).toHaveBeenCalledWith(expect.any(AppError));
    });

    it('should pass error', async () => {
      const err = new Error('err');
      service.createStaff.mockRejectedValue(err);
      await controller.createStaff(req as Request, res as Response, next);
      expect(next).toHaveBeenCalledWith(err);
    });
  });

  describe('getStaffList', () => {
    it('should return list', async () => {
      service.getStaffList.mockResolvedValue([{ id: '1' }] as any);
      await controller.getStaffList(req as Request, res as Response, next);
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('should handle unauth', async () => {
      req.profile = undefined;
      await controller.getStaffList(req as Request, res as Response, next);
      expect(next).toHaveBeenCalledWith(expect.any(AppError));
    });

    it('should pass error', async () => {
      const err = new Error('err');
      service.getStaffList.mockRejectedValue(err);
      await controller.getStaffList(req as Request, res as Response, next);
      expect(next).toHaveBeenCalledWith(err);
    });
  });

  describe('getStaffById', () => {
    it('should return staff', async () => {
      req.params = { id: '1' };
      service.getStaffById.mockResolvedValue({ id: '1' } as any);
      await controller.getStaffById(req as Request, res as Response, next);
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('should handle unauth', async () => {
      req.profile = undefined;
      await controller.getStaffById(req as Request, res as Response, next);
      expect(next).toHaveBeenCalledWith(expect.any(AppError));
    });

    it('should pass error', async () => {
      const err = new Error('err');
      service.getStaffById.mockRejectedValue(err);
      await controller.getStaffById(req as Request, res as Response, next);
      expect(next).toHaveBeenCalledWith(err);
    });
  });

  describe('updateStaff', () => {
    it('should update staff', async () => {
      req.params = { id: '1' };
      service.updateStaff.mockResolvedValue({ id: '1' } as any);
      await controller.updateStaff(req as Request, res as Response, next);
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('should handle unauth', async () => {
      req.profile = undefined;
      await controller.updateStaff(req as Request, res as Response, next);
      expect(next).toHaveBeenCalledWith(expect.any(AppError));
    });

    it('should pass error', async () => {
      const err = new Error('err');
      service.updateStaff.mockRejectedValue(err);
      await controller.updateStaff(req as Request, res as Response, next);
      expect(next).toHaveBeenCalledWith(err);
    });
  });

  describe('deleteStaff', () => {
    it('should delete staff', async () => {
      req.params = { id: '1' };
      service.deleteStaff.mockResolvedValue();
      await controller.deleteStaff(req as Request, res as Response, next);
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('should handle unauth', async () => {
      req.profile = undefined;
      await controller.deleteStaff(req as Request, res as Response, next);
      expect(next).toHaveBeenCalledWith(expect.any(AppError));
    });

    it('should pass error', async () => {
      const err = new Error('err');
      service.deleteStaff.mockRejectedValue(err);
      await controller.deleteStaff(req as Request, res as Response, next);
      expect(next).toHaveBeenCalledWith(err);
    });
  });
});
