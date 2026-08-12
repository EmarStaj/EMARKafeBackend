import { Request, Response, NextFunction } from 'express';
import { injectable } from 'tsyringe';
import { NotificationService } from './notification.service';
import { sendSuccess } from '../../utils/response';

@injectable()
export class NotificationController {
  constructor(private notificationService: NotificationService) {}

  broadcast = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { title, message, data } = req.body;
      
      // Execute fire-and-forget
      this.notificationService.broadcast(title, message, data);
      
      sendSuccess(res, null, 'Broadcast notification triggered successfully.', 200);
    } catch (error) {
      next(error);
    }
  };
}
