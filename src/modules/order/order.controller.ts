import { Request, Response, NextFunction } from 'express';
import { OrderService } from './order.service';
import { sendSuccess } from '../../utils/response';
import { AppError } from '../../utils/app-error';

export class OrderController {
  private orderService: OrderService;

  constructor() {
    this.orderService = new OrderService();
  }

  placeOrder = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user?.id;
      const token = req.token;
      if (!userId || !token) throw new AppError('Unauthorized', 401);

      const { branch_id } = req.body;
      const order = await this.orderService.placeOrder(userId, branch_id, token);
      sendSuccess(res, order, 'Order placed successfully.', 201);
    } catch (error) {
      next(error);
    }
  };

  getOrders = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user?.id;
      const token = req.token;
      if (!userId || !token) throw new AppError('Unauthorized', 401);

      const orders = await this.orderService.getOrders(userId, token);
      sendSuccess(res, orders, 'Order history retrieved successfully.');
    } catch (error) {
      next(error);
    }
  };

  getOrderById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const token = req.token;
      if (!token) throw new AppError('Unauthorized', 401);

      const { id } = req.params;
      const order = await this.orderService.getOrderById(id, token);
      sendSuccess(res, order, 'Order details retrieved successfully.');
    } catch (error) {
      next(error);
    }
  };
}
