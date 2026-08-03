import { Request, Response, NextFunction } from 'express';
import { DeviceTokenService } from './device-token.service';
import { sendSuccess } from '../../utils/response';
import { AppError } from '../../utils/app-error';

export class DeviceTokenController {
  private deviceTokenService: DeviceTokenService;

  constructor() {
    this.deviceTokenService = new DeviceTokenService();
  }

  saveDeviceToken = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user?.id;
      if (!userId) throw new AppError('Unauthorized', 401);

      const { fcm_token, platform } = req.body;
      const data = await this.deviceTokenService.saveDeviceToken(userId, fcm_token, platform);
      sendSuccess(res, data, 'Device token registered successfully.', 201);
    } catch (error) {
      next(error);
    }
  };
}
