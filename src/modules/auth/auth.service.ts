import { injectable } from 'tsyringe';
import { supabase } from '../../config/supabase';
import { AppError } from '../../utils/app-error';
import { profileCache } from '../../config/profile-cache';

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

    return {
      user: data.user,
      session: {
        access_token: data.session?.access_token,
        refresh_token: data.session?.refresh_token,
        expires_at: data.session?.expires_at,
      },
    };
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
}
