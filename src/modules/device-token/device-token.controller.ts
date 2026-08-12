import { injectable } from 'tsyringe';
import { Request, Response, NextFunction } from 'express';
import { DeviceTokenService } from './device-token.service';
import { sendSuccess } from '../../utils/response';
import { AppError } from '../../utils/app-error';

@injectable()
export class DeviceTokenController {
  constructor(private deviceTokenService: DeviceTokenService) {}

  registerToken = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user?.id;
      if (!userId) throw new AppError('Unauthorized', 401);

      const { onesignal_id, platform } = req.body;
      const data = await this.deviceTokenService.saveDeviceToken(userId, onesignal_id, platform);
      sendSuccess(res, data, 'Device token registered successfully.', 201);
    } catch (error) {
      next(error);
    }
  };
}
