import 'reflect-metadata';
import { AuthService } from '../auth.service';
import { supabase, supabaseAdmin } from '../../../config/supabase';
import { AppError } from '../../../utils/app-error';
import { profileCache } from '../../../config/profile-cache';

jest.mock('../../../config/supabase', () => ({
  supabase: {
    auth: {
      signUp: jest.fn(),
      signInWithPassword: jest.fn(),
      signOut: jest.fn(),
      resetPasswordForEmail: jest.fn(),
      updateUser: jest.fn(),
      getUser: jest.fn(),
      refreshSession: jest.fn(),
      admin: {
        signOut: jest.fn(),
      }
    }
  },
  supabaseAdmin: {
    auth: {
      admin: {
        updateUserById: jest.fn(),
      }
    }
  }
}));

jest.mock('../../../config/profile-cache', () => ({
  profileCache: {
    invalidate: jest.fn()
  }
}));

describe('AuthService', () => {
  let authService: AuthService;

  beforeEach(() => {
    jest.clearAllMocks();
    authService = new AuthService();
  });

  describe('signUp', () => {
    it('should sign up successfully', async () => {
      (supabase.auth.signUp as jest.Mock).mockResolvedValue({
        data: { user: { id: 'test-id' } },
        error: null
      });

      const res = await authService.signUp('test@test.com', 'password', 'Test Name', '123', '2000-01-01');
      expect(res).toEqual({ user: { id: 'test-id' } });
      expect(supabase.auth.signUp).toHaveBeenCalledWith({
        email: 'test@test.com',
        password: 'password',
        options: {
          data: {
            full_name: 'Test Name',
            phone: '123',
            birth_date: '2000-01-01'
          }
        }
      });
    });

    it('should throw AppError on error', async () => {
      (supabase.auth.signUp as jest.Mock).mockResolvedValue({
        data: null,
        error: { message: 'signup error' }
      });

      await expect(authService.signUp('test@test.com', 'password')).rejects.toThrow(AppError);
    });
  });

  describe('signIn', () => {
    it('should sign in successfully', async () => {
      (supabase.auth.signInWithPassword as jest.Mock).mockResolvedValue({
        data: { user: { id: 'test-id' } },
        error: null
      });

      const res = await authService.signIn('test@test.com', 'password');
      expect(res).toEqual({ user: { id: 'test-id' } });
      expect(supabase.auth.signInWithPassword).toHaveBeenCalledWith({
        email: 'test@test.com',
        password: 'password'
      });
    });

    it('should throw AppError on error', async () => {
      (supabase.auth.signInWithPassword as jest.Mock).mockResolvedValue({
        data: null,
        error: { message: 'signin error' }
      });

      await expect(authService.signIn('test@test.com', 'password')).rejects.toThrow(AppError);
    });
  });

  describe('signOut', () => {
    it('should sign out successfully and invalidate cache if userId provided', async () => {
      (supabase.auth.admin.signOut as jest.Mock).mockResolvedValue({ error: null });

      await authService.signOut('token', 'user-id');
      expect(profileCache.invalidate).toHaveBeenCalledWith('user-id');
      expect(supabase.auth.admin.signOut).toHaveBeenCalledWith('token');
    });

    it('should sign out successfully without invalidating cache if userId not provided', async () => {
      (supabase.auth.admin.signOut as jest.Mock).mockResolvedValue({ error: null });

      await authService.signOut('token');
      expect(profileCache.invalidate).not.toHaveBeenCalled();
      expect(supabase.auth.admin.signOut).toHaveBeenCalledWith('token');
    });

    it('should throw AppError on error', async () => {
      (supabase.auth.admin.signOut as jest.Mock).mockResolvedValue({ error: { message: 'signout error' } });

      await expect(authService.signOut('token')).rejects.toThrow(AppError);
    });
  });

  describe('forgotPassword', () => {
    it('should send forgot password email successfully', async () => {
      (supabase.auth.resetPasswordForEmail as jest.Mock).mockResolvedValue({ error: null });

      await authService.forgotPassword('test@test.com');
      expect(supabase.auth.resetPasswordForEmail).toHaveBeenCalledWith('test@test.com');
    });

    it('should throw AppError on error', async () => {
      (supabase.auth.resetPasswordForEmail as jest.Mock).mockResolvedValue({ error: { message: 'forgot error' } });

      await expect(authService.forgotPassword('test@test.com')).rejects.toThrow(AppError);
    });
  });

  describe('resetPassword', () => {
    it('should reset password successfully', async () => {
      (supabase.auth.getUser as jest.Mock).mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null
      });
      (supabaseAdmin.auth.admin.updateUserById as jest.Mock).mockResolvedValue({ error: null });

      await authService.resetPassword('valid-token', 'newpass');
      expect(supabase.auth.getUser).toHaveBeenCalledWith('valid-token');
      expect(supabaseAdmin.auth.admin.updateUserById).toHaveBeenCalledWith('user-123', { password: 'newpass' });
      expect(profileCache.invalidate).toHaveBeenCalledWith('user-123');
    });

    it('should throw AppError if token is invalid or user not found', async () => {
      (supabase.auth.getUser as jest.Mock).mockResolvedValue({
        data: { user: null },
        error: { message: 'invalid token' }
      });

      await expect(authService.resetPassword('bad-token', 'newpass')).rejects.toThrow(AppError);
    });

    it('should throw AppError on updateUserById error', async () => {
      (supabase.auth.getUser as jest.Mock).mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null
      });
      (supabaseAdmin.auth.admin.updateUserById as jest.Mock).mockResolvedValue({ error: { message: 'update error' } });

      await expect(authService.resetPassword('valid-token', 'newpass')).rejects.toThrow(AppError);
    });
  });

  describe('refreshSession', () => {
    it('should refresh session successfully', async () => {
      (supabase.auth.refreshSession as jest.Mock).mockResolvedValue({ data: { session: 'mock' }, error: null });

      const res = await authService.refreshSession('refresh-token');
      expect(supabase.auth.refreshSession).toHaveBeenCalledWith({ refresh_token: 'refresh-token' });
      expect(res).toEqual({ session: 'mock' });
    });

    it('should throw AppError on error', async () => {
      (supabase.auth.refreshSession as jest.Mock).mockResolvedValue({ data: null, error: { message: 'refresh error' } });

      await expect(authService.refreshSession('refresh-token')).rejects.toThrow(AppError);
    });
  });
});
