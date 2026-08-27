import 'reflect-metadata';
import { Request, Response } from 'express';
import { LoyaltyController } from '../loyalty.controller';
import { LoyaltyService } from '../loyalty.service';
import { AppError } from '../../../utils/app-error';
import { sendSuccess } from '../../../utils/response';

jest.mock('../../../utils/response');

describe('LoyaltyController', () => {
  let controller: LoyaltyController;
  let service: jest.Mocked<LoyaltyService>;
  let req: Partial<Request>;
  let res: Partial<Response>;
  let next: jest.Mock;

  beforeEach(() => {
    service = {
      getLoyaltyProgress: jest.fn(),
      getLoyaltyRewards: jest.fn(),
      getLoyaltySummary: jest.fn(),
      addStampsForProduct: jest.fn(),
    } as unknown as jest.Mocked<LoyaltyService>;

    controller = new LoyaltyController(service);
    req = { user: { id: 'u1' } } as any;
    res = { status: jest.fn().mockReturnThis(), json: jest.fn() } as any;
    next = jest.fn();
    jest.clearAllMocks();
  });

  describe('getLoyaltyProgress', () => {
    it('should throw Unauthorized if no user id', async () => {
      req.user = undefined;
      await controller.getLoyaltyProgress(req as Request, res as Response, next);
      expect(next).toHaveBeenCalledWith(expect.any(AppError));
    });

    it('should get loyalty progress successfully', async () => {
      service.getLoyaltyProgress.mockResolvedValue([{ id: 'prog1' }] as any);
      await controller.getLoyaltyProgress(req as Request, res as Response, next);
      expect(service.getLoyaltyProgress).toHaveBeenCalledWith('u1');
      expect(sendSuccess).toHaveBeenCalledWith(res, [{ id: 'prog1' }], 'Loyalty stamp progress retrieved successfully.');
    });

    it('should call next on error', async () => {
      const err = new Error('err');
      service.getLoyaltyProgress.mockRejectedValue(err);
      await controller.getLoyaltyProgress(req as Request, res as Response, next);
      expect(next).toHaveBeenCalledWith(err);
    });
  });

  describe('getLoyaltyRewards', () => {
    it('should throw Unauthorized if no user id', async () => {
      req.user = undefined;
      await controller.getLoyaltyRewards(req as Request, res as Response, next);
      expect(next).toHaveBeenCalledWith(expect.any(AppError));
    });

    it('should get loyalty rewards successfully', async () => {
      service.getLoyaltyRewards.mockResolvedValue([{ id: 'rew1' }] as any);
      await controller.getLoyaltyRewards(req as Request, res as Response, next);
      expect(service.getLoyaltyRewards).toHaveBeenCalledWith('u1');
      expect(sendSuccess).toHaveBeenCalledWith(res, [{ id: 'rew1' }], 'Loyalty rewards list retrieved successfully.');
    });

    it('should call next on error', async () => {
      const err = new Error('err');
      service.getLoyaltyRewards.mockRejectedValue(err);
      await controller.getLoyaltyRewards(req as Request, res as Response, next);
      expect(next).toHaveBeenCalledWith(err);
    });
  });

  describe('getLoyaltySummary', () => {
    it('should throw Unauthorized if no user id', async () => {
      req.user = undefined;
      await controller.getLoyaltySummary(req as Request, res as Response, next);
      expect(next).toHaveBeenCalledWith(expect.any(AppError));
    });

    it('should get loyalty summary successfully', async () => {
      const mockSummary = { progress: [], rewards: [] };
      service.getLoyaltySummary.mockResolvedValue(mockSummary as any);
      await controller.getLoyaltySummary(req as Request, res as Response, next);
      expect(service.getLoyaltySummary).toHaveBeenCalledWith('u1');
      expect(sendSuccess).toHaveBeenCalledWith(res, mockSummary, 'Loyalty summary retrieved successfully.');
    });

    it('should call next on error', async () => {
      const err = new Error('err');
      service.getLoyaltySummary.mockRejectedValue(err);
      await controller.getLoyaltySummary(req as Request, res as Response, next);
      expect(next).toHaveBeenCalledWith(err);
    });
  });

  describe('redeemReward', () => {
    it('should throw Unauthorized if no user id', async () => {
      req.user = undefined;
      await controller.redeemReward(req as Request, res as Response, next);
      expect(next).toHaveBeenCalledWith(expect.any(AppError));
    });

    it('should throw 400 if reward id is missing', async () => {
      req.params = {};
      req.body = {};
      await controller.redeemReward(req as Request, res as Response, next);
      expect(next).toHaveBeenCalledWith(expect.any(AppError));
    });

    it('should redeem reward successfully', async () => {
      req.params = { id: 'r1' };
      req.body = { order_id: 'o1' };
      service.redeemReward = jest.fn().mockResolvedValue({ id: 'r1', status: 'redeemed' } as any);
      
      await controller.redeemReward(req as Request, res as Response, next);
      expect(service.redeemReward).toHaveBeenCalledWith('u1', 'r1', 'o1');
      expect(sendSuccess).toHaveBeenCalledWith(res, { id: 'r1', status: 'redeemed' }, 'Loyalty reward redeemed successfully.');
    });

    it('should call next on error', async () => {
      req.params = { id: 'r1' };
      req.body = {};
      const err = new Error('err');
      service.redeemReward = jest.fn().mockRejectedValue(err);
      
      await controller.redeemReward(req as Request, res as Response, next);
      expect(next).toHaveBeenCalledWith(err);
    });
  });
});
