import 'reflect-metadata';
import { AuthService } from '../../../modules/auth/auth.service';
import { supabase } from '../../../config/supabase';
import { profileCache } from '../../../config/profile-cache';

jest.mock('../../../config/supabase', () => ({
  supabase: {
    auth: {
      signUp: jest.fn(),
      signInWithPassword: jest.fn(),
      admin: { signOut: jest.fn() },
      resetPasswordForEmail: jest.fn(),
      updateUser: jest.fn(),
      refreshSession: jest.fn(),
    },
  },
}));

jest.mock('../../../config/profile-cache', () => ({
  profileCache: {
    invalidate: jest.fn(),
  },
}));

describe('AuthService Unit Tests', () => {
  let authService: AuthService;

  beforeEach(() => {
    jest.clearAllMocks();
    authService = new AuthService();
  });

  describe('signUp', () => {
    it('should register user and return data', async () => {
      const mockResult = { user: { id: 'u-1', email: 'test@emar.com' } };
      (supabase.auth.signUp as jest.Mock).mockResolvedValue({ data: mockResult, error: null });

      const res = await authService.signUp('test@emar.com', 'password123', 'Test User');
      expect(res).toEqual(mockResult);
      expect(supabase.auth.signUp).toHaveBeenCalled();
    });

    it('should throw AppError on sign up error', async () => {
      (supabase.auth.signUp as jest.Mock).mockResolvedValue({ data: null, error: { message: 'Email already registered' } });

      await expect(authService.signUp('test@emar.com', 'password123')).rejects.toThrow('Email already registered');
    });
  });

  describe('signIn', () => {
    it('should authenticate user and return session data', async () => {
      const mockSession = { session: { access_token: 'tok-123' }, user: { id: 'u-1' } };
      (supabase.auth.signInWithPassword as jest.Mock).mockResolvedValue({ data: mockSession, error: null });

      const res = await authService.signIn('test@emar.com', 'pass');
      expect(res).toEqual(mockSession);
    });

    it('should throw AppError on invalid credentials', async () => {
      (supabase.auth.signInWithPassword as jest.Mock).mockResolvedValue({ data: null, error: { message: 'Invalid credentials' } });

      await expect(authService.signIn('test@emar.com', 'wrong')).rejects.toThrow('Invalid credentials');
    });
  });

  describe('signOut', () => {
    it('should invalidate profile cache and call supabase admin signOut', async () => {
      (supabase.auth.admin.signOut as jest.Mock).mockResolvedValue({ error: null });

      await authService.signOut('tok-123', 'u-1');

      expect(profileCache.invalidate).toHaveBeenCalledWith('u-1');
      expect(supabase.auth.admin.signOut).toHaveBeenCalledWith('tok-123');
    });
  });

  describe('forgotPassword & resetPassword & refreshSession', () => {
    it('should call resetPasswordForEmail', async () => {
      (supabase.auth.resetPasswordForEmail as jest.Mock).mockResolvedValue({ error: null });
      await expect(authService.forgotPassword('test@emar.com')).resolves.toBeUndefined();
    });

    it('should call updateUser for resetPassword', async () => {
      (supabase.auth.updateUser as jest.Mock).mockResolvedValue({ error: null });
      await expect(authService.resetPassword('new-pass-123')).resolves.toBeUndefined();
    });

    it('should refresh session', async () => {
      (supabase.auth.refreshSession as jest.Mock).mockResolvedValue({ data: { access_token: 'new-tok' }, error: null });
      const res = await authService.refreshSession('refresh-tok');
      expect(res).toEqual({ access_token: 'new-tok' });
    });
  });
});
