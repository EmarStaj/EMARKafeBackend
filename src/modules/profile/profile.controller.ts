import { Request, Response, NextFunction } from 'express';
import { ProfileService } from './profile.service';
import { sendSuccess } from '../../utils/response';
import { AppError } from '../../utils/app-error';
import { profileCache } from '../../config/profile-cache';

export class ProfileController {
  private profileService: ProfileService;

  constructor() {
    this.profileService = new ProfileService();
  }

  getProfile = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user?.id;
      const token = req.token;

      if (!userId || !token) {
        throw new AppError('Unauthorized', 401);
      }

      const profile = await this.profileService.getProfile(userId, token);
      sendSuccess(res, profile, 'Profile retrieved successfully.');
    } catch (error) {
      next(error);
    }
  };

  updateProfile = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user?.id;
      const token = req.token;

      if (!userId || !token) {
        throw new AppError('Unauthorized', 401);
      }

      const { full_name, phone, avatar_url } = req.body;
      const updatedProfile = await this.profileService.updateProfile(userId, { full_name, phone, avatar_url }, token);
      profileCache.invalidate(userId);
      sendSuccess(res, updatedProfile, 'Profile updated successfully.');
    } catch (error) {
      next(error);
    }
  };

  clearCache = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user?.id;
      if (userId) {
        profileCache.invalidate(userId);
      }
      sendSuccess(res, null, 'Profile cache invalidated successfully.');
    } catch (error) {
      next(error);
    }
  };
}
