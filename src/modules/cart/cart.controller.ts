import { Request, Response, NextFunction } from 'express';
import { CartService } from './cart.service';
import { sendSuccess } from '../../utils/response';
import { AppError } from '../../utils/app-error';

export class CartController {
  private cartService: CartService;

  constructor() {
    this.cartService = new CartService();
  }

  getCart = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const token = req.token;
      if (!token) throw new AppError('Unauthorized', 401);

      const cart = await this.cartService.getCart(token);
      sendSuccess(res, cart, 'Cart retrieved successfully.');
    } catch (error) {
      next(error);
    }
  };

  addToCart = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user?.id;
      const token = req.token;
      if (!userId || !token) throw new AppError('Unauthorized', 401);

      const { menu_item_id, quantity } = req.body;
      const data = await this.cartService.addToCart(userId, menu_item_id, quantity, token);
      sendSuccess(res, data, 'Item added to cart successfully.', 201);
    } catch (error) {
      next(error);
    }
  };

  updateCartItem = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const token = req.token;
      if (!token) throw new AppError('Unauthorized', 401);

      const { id } = req.params;
      const { quantity } = req.body;

      const data = await this.cartService.updateCartItem(id, quantity, token);
      sendSuccess(res, data, 'Cart item updated successfully.');
    } catch (error) {
      next(error);
    }
  };

  removeFromCart = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const token = req.token;
      if (!token) throw new AppError('Unauthorized', 401);

      const { id } = req.params;
      await this.cartService.removeFromCart(id, token);
      sendSuccess(res, null, 'Item removed from cart successfully.');
    } catch (error) {
      next(error);
    }
  };

  clearCart = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user?.id;
      const token = req.token;
      if (!userId || !token) throw new AppError('Unauthorized', 401);

      await this.cartService.clearCart(userId, token);
      sendSuccess(res, null, 'Cart cleared successfully.');
    } catch (error) {
      next(error);
    }
  };
}
