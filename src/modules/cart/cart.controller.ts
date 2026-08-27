import { injectable } from 'tsyringe';
import { Request, Response, NextFunction } from 'express';
import { CartService } from './cart.service';
import { sendSuccess } from '../../utils/response';
import { AppError } from '../../utils/app-error';

@injectable()
export class CartController {
  constructor(private cartService: CartService) {}

  getCart = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user?.id;
      const token = req.token;
      if (!userId || !token) throw new AppError('Unauthorized', 401);

      const cart = await this.cartService.getCart(userId, token);
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

      const { product_id, quantity, selected_options } = req.body;
      const { item, warnings } = await this.cartService.addToCart(userId, product_id, quantity, selected_options, token);
      sendSuccess(res, item, 'Item added to cart successfully.', 201, warnings);
    } catch (error) {
      next(error);
    }
  };

  updateCartItem = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user?.id;
      const token = req.token;
      if (!userId || !token) throw new AppError('Unauthorized', 401);

      const { id } = req.params;
      const { quantity } = req.body;

      const data = await this.cartService.updateCartItem(id, quantity, token, userId);
      sendSuccess(res, data, 'Cart item updated successfully.');
    } catch (error) {
      next(error);
    }
  };

  removeFromCart = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user?.id;
      const token = req.token;
      if (!userId || !token) throw new AppError('Unauthorized', 401);

      const { id } = req.params;
      await this.cartService.removeFromCart(id, token, userId);
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
