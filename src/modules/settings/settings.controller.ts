import { injectable } from 'tsyringe';
import { Request, Response, NextFunction } from 'express';
import { SettingsService } from './settings.service';
import { sendSuccess } from '../../utils/response';
import { AppError } from '../../utils/app-error';

@injectable()
export class SettingsController {
  constructor(private settingsService: SettingsService) {}

  getSettings = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const settings = await this.settingsService.getSettings();
      sendSuccess(res, settings, 'Settings retrieved successfully.');
    } catch (error) {
      next(error);
    }
  };

  updateSetting = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user?.id;
      if (!userId) throw new AppError('Unauthorized', 401);

      const { key } = req.params;
      const { value } = req.body;

      const data = await this.settingsService.updateSetting(key, value, userId);
      sendSuccess(res, data, 'Setting updated successfully.');
    } catch (error) {
      next(error);
    }
  };
}
