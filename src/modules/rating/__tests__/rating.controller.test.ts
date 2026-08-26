import 'reflect-metadata';
import { RatingController } from '../rating.controller';
import { RatingService } from '../rating.service';
import { Request, Response, NextFunction } from 'express';
import { AppError } from '../../../utils/app-error';

describe('RatingController', () => {
  let controller: RatingController;
  let service: jest.Mocked<RatingService>;
  let req: Partial<Request>;
  let res: Partial<Response>;
  let next: NextFunction;

  beforeEach(() => {
    service = {
      rateProduct: jest.fn(),
    } as any;
    controller = new RatingController(service);
    req = { user: { id: 'u1' }, token: 't1', params: {}, body: {} } as any;
    res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    next = jest.fn();
    jest.clearAllMocks();
  });

  describe('rateProduct', () => {
    it('should rate via params', async () => {
      req.params = { productId: 'p1' };
      req.body = { order_id: 'o1', rating: 5 };
      service.rateProduct.mockResolvedValue({} as any);

      await controller.rateProduct(req as Request, res as Response, next);
      expect(service.rateProduct).toHaveBeenCalledWith('u1', 'p1', 'o1', 5, 't1');
      expect(res.status).toHaveBeenCalledWith(201);
    });

    it('should rate via body', async () => {
      req.params = {};
      req.body = { product_id: 'p1', order_id: 'o1', rating: 5 };
      service.rateProduct.mockResolvedValue({} as any);

      await controller.rateProduct(req as Request, res as Response, next);
      expect(service.rateProduct).toHaveBeenCalledWith('u1', 'p1', 'o1', 5, 't1');
    });

    it('should throw 401 if user/token missing', async () => {
      req.user = undefined;
      await controller.rateProduct(req as Request, res as Response, next);
      expect(next).toHaveBeenCalledWith(expect.any(AppError));
      expect((next as jest.Mock).mock.calls[0][0].message).toBe('Unauthorized');
      
      jest.clearAllMocks();
      req.user = { id: 'u1', app_metadata: {}, user_metadata: {}, aud: '', created_at: '' } as any;
      req.token = undefined;
      await controller.rateProduct(req as Request, res as Response, next);
      expect(next).toHaveBeenCalledWith(expect.any(AppError));
      expect((next as jest.Mock).mock.calls[0][0].message).toBe('Unauthorized');
    });

    it('should throw 400 if product missing', async () => {
      req.params = {};
      req.body = {};
      await controller.rateProduct(req as Request, res as Response, next);
      expect(next).toHaveBeenCalledWith(expect.any(AppError));
      expect((next as jest.Mock).mock.calls[0][0].message).toBe('Product ID is required');
    });

    it('should pass error to next', async () => {
      req.params = { productId: 'p1' };
      const err = new Error('err');
      service.rateProduct.mockRejectedValue(err);

      await controller.rateProduct(req as Request, res as Response, next);
      expect(next).toHaveBeenCalledWith(err);
    });
  });
});
