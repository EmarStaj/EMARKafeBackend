import { injectable } from 'tsyringe';
import { supabase, supabaseAdmin } from '../../config/supabase';
import { AppError } from '../../utils/app-error';
import { profileCache } from '../../config/profile-cache';
import { logger } from '../../config/logger';

@injectable()
export class AuthService {
  /**
   * Register a new user with email and password.
   */
  async signUp(email: string, password: string, full_name?: string, phone?: string, birth_date?: string) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name,
          phone,
          birth_date,
        }
      }
    });

    if (error) {
      throw new AppError(error.message, 400);
    }

    return data;
  }

  /**
   * Log in an existing user with email and password.
   */
  async signIn(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      throw new AppError(error.message, 400);
    }

    return data;
  }

  /**
   * Sign out the user. Since Supabase auth is client-bound,
   * we use the admin client or standard client to sign out.
   */
  async signOut(accessToken: string, userId?: string) {
    if (userId) {
      await profileCache.invalidate(userId);
    }
    const { error } = await supabase.auth.admin.signOut(accessToken);
    if (error) {
      throw new AppError(error.message, 400);
    }
  }

  /**
   * Send a password reset email.
   * Silently logs warnings if email service is rate-limited or fails, preventing user enumeration.
   */
  async forgotPassword(email: string) {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email);
      if (error) {
        logger.warn(`Password reset email warning for ${email}: ${error.message}`);
      }
    } catch (err: any) {
      logger.warn(`Unexpected error in forgotPassword for ${email}: ${err.message}`);
    }
  }

  /**
   * Reset user password (used after following the link in the email or authenticated session).
   */
  async resetPassword(accessToken: string, newPassword: string) {
    const { data: { user }, error } = await supabase.auth.getUser(accessToken);
    if (error || !user) {
      throw new AppError('Geçersiz veya süresi dolmuş token.', 401);
    }
    const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(user.id, { password: newPassword });
    if (updateError) {
      throw new AppError(updateError.message, 400);
    }
    await profileCache.invalidate(user.id);
  }

  /**
   * Refresh the access token using a refresh token.
   */
  async refreshSession(refreshToken: string) {
    const { data, error } = await supabase.auth.refreshSession({ refresh_token: refreshToken });
    if (error) {
      throw new AppError(error.message, 401);
    }
    return data;
  }
}
