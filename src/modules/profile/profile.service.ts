import { injectable } from 'tsyringe';
import { ProfileRepository } from './profile.repository';
import { AppError } from '../../utils/app-error';

@injectable()
export class ProfileService {
  private profileRepository: ProfileRepository;

  constructor() {
    this.profileRepository = new ProfileRepository();
  }

  /**
   * Get user profile. Handles PGRST116 (No rows found) by throwing 404.
   */
  async getProfile(userId: string, token: string) {
    try {
      return await this.profileRepository.getProfile(userId, token);
    } catch (error: any) {
      const isNotFound = error.code === 'PGRST116';
      throw new AppError(
        isNotFound ? 'Profile not found' : error.message,
        isNotFound ? 404 : 400
      );
    }
  }

  /**
   * Update profile.
   */
  async updateProfile(userId: string, profileData: { full_name?: string; phone?: string; avatar_url?: string; birth_date?: string; branch_id?: string }, token: string) {
    try {
      return await this.profileRepository.updateProfile(userId, profileData, token);
    } catch (error: any) {
      throw new AppError(error.message || 'Failed to update profile', 400);
    }
  }
}
