import { injectable } from 'tsyringe';
import { Request, Response, NextFunction } from 'express';
import { ProfileService } from './profile.service';
import { sendSuccess } from '../../utils/response';
import { AppError } from '../../utils/app-error';
import { profileCache } from '../../config/profile-cache';

@injectable()
export class ProfileController {
  constructor(private profileService: ProfileService) {}

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

      const { full_name, phone, avatar_url, birth_date } = req.body;
      const updatedProfile = await this.profileService.updateProfile(userId, { full_name, phone, avatar_url, birth_date }, token);
      await profileCache.invalidate(userId);
      sendSuccess(res, updatedProfile, 'Profile updated successfully.');
    } catch (error) {
      next(error);
    }
  };

  updateDefaultBranch = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user?.id;
      const token = req.token;

      if (!userId || !token) {
        throw new AppError('Unauthorized', 401);
      }

      const { branch_id } = req.body;
      const updatedProfile = await this.profileService.updateProfile(userId, { branch_id }, token);
      await profileCache.invalidate(userId);
      sendSuccess(res, { branch_id: updatedProfile.branch_id }, 'Default branch updated successfully.');
    } catch (error) {
      next(error);
    }
  };

  clearCache = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user?.id;
      if (userId) {
        await profileCache.invalidate(userId);
      }
      sendSuccess(res, null, 'Profile cache invalidated successfully.');
    } catch (error) {
      next(error);
    }
  };
}
