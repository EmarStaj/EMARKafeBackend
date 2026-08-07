import { injectable } from 'tsyringe';
import { Request, Response, NextFunction } from 'express';
import { RatingService } from './rating.service';
import { sendSuccess } from '../../utils/response';
import { AppError } from '../../utils/app-error';

@injectable()
export class RatingController {
  constructor(private ratingService: RatingService) {}

  rateProduct = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user?.id;
      const token = req.token;
      if (!userId || !token) {
        throw new AppError('Unauthorized', 401);
      }

      const { productId } = req.params;
      const { order_id, rating } = req.body;

      const data = await this.ratingService.rateProduct(
        userId,
        productId,
        order_id,
        rating,
        token
      );

      sendSuccess(res, data, 'Rating submitted successfully.', 201);
    } catch (error) {
      next(error);
    }
  };
}
