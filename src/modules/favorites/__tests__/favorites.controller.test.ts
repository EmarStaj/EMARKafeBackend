import 'reflect-metadata';
import { Request, Response } from 'express';
import { FavoritesController } from '../favorites.controller';
import { FavoritesService } from '../favorites.service';
import { AppError } from '../../../utils/app-error';
import { sendSuccess } from '../../../utils/response';

jest.mock('../../../utils/response');

describe('FavoritesController', () => {
  let controller: FavoritesController;
  let service: jest.Mocked<FavoritesService>;
  let req: Partial<Request>;
  let res: Partial<Response>;
  let next: jest.Mock;

  beforeEach(() => {
    service = {
      getFavorites: jest.fn(),
      addFavorite: jest.fn(),
      removeFavorite: jest.fn(),
    } as unknown as jest.Mocked<FavoritesService>;
    
    controller = new FavoritesController(service);
    req = { user: { id: 'user1' }, token: 'token123', body: {}, params: {} } as any;
    res = { status: jest.fn().mockReturnThis(), json: jest.fn() } as any;
    next = jest.fn();
    jest.clearAllMocks();
  });

  describe('getFavorites', () => {
    it('should throw Unauthorized if no user id', async () => {
      req.user = undefined;
      await controller.getFavorites(req as Request, res as Response, next);
      expect(next).toHaveBeenCalledWith(expect.any(AppError));
      expect(next.mock.calls[0][0].message).toBe('Unauthorized');
    });

    it('should retrieve favorites successfully', async () => {
      const mockFavorites = [{ id: 'fav1' }];
      service.getFavorites.mockResolvedValue(mockFavorites as any);
      
      await controller.getFavorites(req as Request, res as Response, next);
      
      expect(service.getFavorites).toHaveBeenCalledWith('token123', 'user1');
      expect(sendSuccess).toHaveBeenCalledWith(res, mockFavorites, 'Favorites retrieved successfully.');
    });

    it('should call next with error if service fails', async () => {
      const error = new Error('Service Error');
      service.getFavorites.mockRejectedValue(error);
      
      await controller.getFavorites(req as Request, res as Response, next);
      expect(next).toHaveBeenCalledWith(error);
    });
  });

  describe('addFavorite', () => {
    it('should throw Unauthorized if no token', async () => {
      req.token = undefined;
      await controller.addFavorite(req as Request, res as Response, next);
      expect(next).toHaveBeenCalledWith(expect.any(AppError));
    });

    it('should add a new favorite successfully (201)', async () => {
      req.body = { product_id: 'prod1' };
      service.addFavorite.mockResolvedValue({ data: { id: 'fav1' }, isNew: true } as any);
      
      await controller.addFavorite(req as Request, res as Response, next);
      
      expect(service.addFavorite).toHaveBeenCalledWith('user1', 'prod1', 'token123');
      expect(sendSuccess).toHaveBeenCalledWith(res, { id: 'fav1' }, 'Added to favorites successfully.', 201);
    });

    it('should return 200 if already in favorites', async () => {
      req.body = { product_id: 'prod1' };
      service.addFavorite.mockResolvedValue({ data: { id: 'fav1' }, isNew: false } as any);
      
      await controller.addFavorite(req as Request, res as Response, next);
      
      expect(sendSuccess).toHaveBeenCalledWith(res, { id: 'fav1' }, 'Already in favorites.', 200);
    });

    it('should call next with error if service fails', async () => {
      const error = new Error('error');
      service.addFavorite.mockRejectedValue(error);
      await controller.addFavorite(req as Request, res as Response, next);
      expect(next).toHaveBeenCalledWith(error);
    });
  });

  describe('removeFavorite', () => {
    it('should throw Unauthorized if no user id', async () => {
      req.user = undefined;
      await controller.removeFavorite(req as Request, res as Response, next);
      expect(next).toHaveBeenCalledWith(expect.any(AppError));
    });

    it('should remove favorite successfully', async () => {
      req.params = { productId: 'prod1' };
      service.removeFavorite.mockResolvedValue(undefined);
      
      await controller.removeFavorite(req as Request, res as Response, next);
      
      expect(service.removeFavorite).toHaveBeenCalledWith('user1', 'prod1', 'token123');
      expect(sendSuccess).toHaveBeenCalledWith(res, null, 'Removed from favorites successfully.');
    });

    it('should call next with error if service fails', async () => {
      const error = new Error('error');
      service.removeFavorite.mockRejectedValue(error);
      await controller.removeFavorite(req as Request, res as Response, next);
      expect(next).toHaveBeenCalledWith(error);
    });
  });
});
