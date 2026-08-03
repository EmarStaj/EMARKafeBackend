import { supabase } from '../../config/supabase';
import { AppError } from '../../utils/app-error';

export class AuthService {
  /**
   * Register a new user with email and password.
   */
  async signUp(email: string, password: string) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
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
  async signOut(accessToken: string) {
    const { error } = await supabase.auth.admin.signOut(accessToken);
    if (error) {
      throw new AppError(error.message, 400);
    }
  }
}
