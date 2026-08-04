import { Request, Response } from 'express';
import { requireAuth } from '../../middlewares/auth.middleware';
import { profileCache } from '../../config/profile-cache';
import { supabaseAdmin } from '../../config/supabase';
import { UserProfile } from '../../types';

const MockedSupabaseAdmin = supabaseAdmin as jest.Mocked<typeof supabaseAdmin>;

const mockProfile: UserProfile = {
  id: 'mock-user-id',
  role: 'customer',
  created_at: new Date().toISOString(),
};

describe('requireAuth Middleware — Profile Cache Optimization', () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let mockNext: jest.Mock;

  beforeEach(() => {
    profileCache.clear();
    mockReq = {
      headers: {
        authorization: 'Bearer mock-token',
      },
    };
    mockRes = {};
    mockNext = jest.fn();
    jest.clearAllMocks();
  });

  it('should query database on cache miss and cache the profile', async () => {
    // 1. Cache is initially empty
    expect(profileCache.get('mock-user-id')).toBeNull();

    // 2. Run requireAuth middleware
    await requireAuth(mockReq as Request, mockRes as Response, mockNext);

    // 3. Database from('profiles') should have been called
    expect(MockedSupabaseAdmin.from).toHaveBeenCalledWith('profiles');
    expect(mockNext).toHaveBeenCalledWith(); // called with no errors
    expect(mockReq.profile).toBeDefined();

    // 4. Cache should now have the profile stored
    expect(profileCache.get('mock-user-id')).toBeDefined();
  });

  it('should skip database query on cache hit (zero DB roundtrips for profile)', async () => {
    // 1. Pre-populate cache for 'mock-user-id'
    profileCache.set('mock-user-id', mockProfile);

    // 2. Run requireAuth middleware
    await requireAuth(mockReq as Request, mockRes as Response, mockNext);

    // 3. Database from('profiles') should NOT have been called!
    expect(MockedSupabaseAdmin.from).not.toHaveBeenCalledWith('profiles');
    expect(mockNext).toHaveBeenCalledWith();
    expect(mockReq.profile).toEqual(mockProfile);
  });
});
