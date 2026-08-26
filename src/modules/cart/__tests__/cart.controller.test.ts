import { CartController } from '../cart.controller';
import { CartService } from '../cart.service';
import { Request, Response, NextFunction } from 'express';
import { sendSuccess } from '../../../utils/response';
import { AppError } from '../../../utils/app-error';

jest.mock('../../../utils/response', () => ({
  sendSuccess: jest.fn()
}));

describe('CartController', () => {
  let controller: CartController;
  let cartService: jest.Mocked<CartService>;
  let req: Partial<Request>;
  let res: Partial<Response>;
  let next: NextFunction;

  beforeEach(() => {
    cartService = {
      getCart: jest.fn(),
      addToCart: jest.fn(),
      updateCartItem: jest.fn(),
      removeFromCart: jest.fn(),
      clearCart: jest.fn(),
    } as any;
    controller = new CartController(cartService);
    
    req = {
      user: { id: 'user-1' } as any,
      token: 'mock-token',
      body: {},
      params: {}
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    next = jest.fn();
    jest.clearAllMocks();
  });

  describe('getCart', () => {
    it('should throw Unauthorized if user or token is missing', async () => {
      req.user = undefined;
      await controller.getCart(req as Request, res as Response, next);
      expect(next).toHaveBeenCalledWith(expect.any(AppError));
      expect(next).toHaveBeenCalledWith(expect.objectContaining({ message: 'Unauthorized', statusCode: 401 }));
    });

    it('should throw Unauthorized if token is missing', async () => {
      req.token = undefined;
      await controller.getCart(req as Request, res as Response, next);
      expect(next).toHaveBeenCalledWith(expect.any(AppError));
    });

    it('should return cart successfully', async () => {
      const mockCart = { id: 'cart-1', items: [] };
      cartService.getCart.mockResolvedValue(mockCart as any);

      await controller.getCart(req as Request, res as Response, next);
      
      expect(cartService.getCart).toHaveBeenCalledWith('user-1', 'mock-token');
      expect(sendSuccess).toHaveBeenCalledWith(res, mockCart, 'Cart retrieved successfully.');
      expect(next).not.toHaveBeenCalled();
    });

    it('should call next with error if service throws', async () => {
      const error = new Error('service error');
      cartService.getCart.mockRejectedValue(error);

      await controller.getCart(req as Request, res as Response, next);
      expect(next).toHaveBeenCalledWith(error);
    });
  });

  describe('addToCart', () => {
    it('should throw Unauthorized if user or token is missing', async () => {
      req.user = undefined;
      await controller.addToCart(req as Request, res as Response, next);
      expect(next).toHaveBeenCalledWith(expect.any(AppError));
    });

    it('should add to cart successfully', async () => {
      req.body = { product_id: 'prod-1', quantity: 2, selected_options: [] };
      const mockResult = { item: { id: 'item-1' }, warnings: ['warn1'] };
      cartService.addToCart.mockResolvedValue(mockResult as any);

      await controller.addToCart(req as Request, res as Response, next);
      
      expect(cartService.addToCart).toHaveBeenCalledWith('user-1', 'prod-1', 2, [], 'mock-token');
      expect(sendSuccess).toHaveBeenCalledWith(res, { id: 'item-1' }, 'Item added to cart successfully.', 201, ['warn1']);
    });

    it('should call next with error if service throws', async () => {
      req.body = { product_id: 'prod-1', quantity: 2 };
      const error = new Error('service error');
      cartService.addToCart.mockRejectedValue(error);

      await controller.addToCart(req as Request, res as Response, next);
      expect(next).toHaveBeenCalledWith(error);
    });
  });

  describe('updateCartItem', () => {
    it('should throw Unauthorized if token is missing', async () => {
      req.token = undefined;
      await controller.updateCartItem(req as Request, res as Response, next);
      expect(next).toHaveBeenCalledWith(expect.any(AppError));
    });

    it('should update cart item successfully', async () => {
      req.params = { id: 'item-1' };
      req.body = { quantity: 3 };
      const mockResult = { id: 'item-1', quantity: 3 };
      cartService.updateCartItem.mockResolvedValue(mockResult as any);

      await controller.updateCartItem(req as Request, res as Response, next);
      
      expect(cartService.updateCartItem).toHaveBeenCalledWith('item-1', 3, 'mock-token');
      expect(sendSuccess).toHaveBeenCalledWith(res, mockResult, 'Cart item updated successfully.');
    });

    it('should call next with error if service throws', async () => {
      req.params = { id: 'item-1' };
      req.body = { quantity: 3 };
      const error = new Error('service error');
      cartService.updateCartItem.mockRejectedValue(error);

      await controller.updateCartItem(req as Request, res as Response, next);
      expect(next).toHaveBeenCalledWith(error);
    });
  });

  describe('removeFromCart', () => {
    it('should throw Unauthorized if token is missing', async () => {
      req.token = undefined;
      await controller.removeFromCart(req as Request, res as Response, next);
      expect(next).toHaveBeenCalledWith(expect.any(AppError));
    });

    it('should remove item from cart successfully', async () => {
      req.params = { id: 'item-1' };
      cartService.removeFromCart.mockResolvedValue(undefined);

      await controller.removeFromCart(req as Request, res as Response, next);
      
      expect(cartService.removeFromCart).toHaveBeenCalledWith('item-1', 'mock-token');
      expect(sendSuccess).toHaveBeenCalledWith(res, null, 'Item removed from cart successfully.');
    });

    it('should call next with error if service throws', async () => {
      req.params = { id: 'item-1' };
      const error = new Error('service error');
      cartService.removeFromCart.mockRejectedValue(error);

      await controller.removeFromCart(req as Request, res as Response, next);
      expect(next).toHaveBeenCalledWith(error);
    });
  });

  describe('clearCart', () => {
    it('should throw Unauthorized if user or token is missing', async () => {
      req.token = undefined;
      await controller.clearCart(req as Request, res as Response, next);
      expect(next).toHaveBeenCalledWith(expect.any(AppError));
    });

    it('should clear cart successfully', async () => {
      cartService.clearCart.mockResolvedValue(undefined);

      await controller.clearCart(req as Request, res as Response, next);
      
      expect(cartService.clearCart).toHaveBeenCalledWith('user-1', 'mock-token');
      expect(sendSuccess).toHaveBeenCalledWith(res, null, 'Cart cleared successfully.');
    });

    it('should call next with error if service throws', async () => {
      const error = new Error('service error');
      cartService.clearCart.mockRejectedValue(error);

      await controller.clearCart(req as Request, res as Response, next);
      expect(next).toHaveBeenCalledWith(error);
    });
  });
});
