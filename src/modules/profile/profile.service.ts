import { injectable } from 'tsyringe';
import { ProfileRepository } from './profile.repository';
import { AppError } from '../../utils/app-error';
import { supabaseAdmin } from '../../config/supabase';

@injectable()
export class ProfileService {
  constructor(private profileRepository: ProfileRepository) {}

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
  async updateProfile(userId: string, profileData: { full_name?: string; email?: string; phone?: string; avatar_url?: string; birth_date?: string | null; branch_id?: string }, token: string) {
    try {
      if (profileData.email) {
        const { error: emailError } = await supabaseAdmin.auth.admin.updateUserById(userId, { email: profileData.email });
        if (emailError) throw emailError;
      }
      const { email, ...dbFields } = profileData;
      return await this.profileRepository.updateProfile(userId, dbFields, token);
    } catch (error: any) {
      throw new AppError(error.message || 'Failed to update profile', 400);
    }
  }
}
