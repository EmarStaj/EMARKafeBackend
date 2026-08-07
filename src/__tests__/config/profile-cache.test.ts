import { ProfileCache } from '../../config/profile-cache';
import { UserProfile } from '../../types';
import { redis } from '../../config/redis';



jest.mock('../../config/logger', () => ({
  logger: {
    error: jest.fn(),
    debug: jest.fn(),
    info: jest.fn(),
  },
}));

const mockProfile: UserProfile = {
  id: 'user1',
  role: 'customer',
  balance: 0,
  created_at: '2023-01-01T00:00:00Z',
};

describe('ProfileCache', () => {
  let cache: ProfileCache;

  beforeEach(() => {
    cache = new ProfileCache(300); // 300 sec TTL
    jest.clearAllMocks();
  });

  it('should return null for non-existent userId', async () => {
    (redis.get as jest.Mock).mockResolvedValueOnce(null);
    const result = await cache.get('unknown-user');
    expect(result).toBeNull();
    expect(redis.get).toHaveBeenCalledWith('profile:unknown-user');
  });

  it('should store and return a cached profile', async () => {
    (redis.get as jest.Mock).mockResolvedValueOnce(JSON.stringify(mockProfile));
    
    const result = await cache.get(mockProfile.id);
    expect(result).toEqual(mockProfile);
  });

  it('should set a profile in redis with correct ttl', async () => {
    await cache.set(mockProfile.id, mockProfile);
    expect(redis.setex).toHaveBeenCalledWith('profile:user1', 300, JSON.stringify(mockProfile));
  });

  it('should invalidate a cached profile explicitly', async () => {
    (redis.del as jest.Mock).mockResolvedValueOnce(1);
    await cache.invalidate(mockProfile.id);
    expect(redis.del).toHaveBeenCalledWith('profile:user1');
  });

  it('should clear all cached profiles', async () => {
    (redis.keys as jest.Mock).mockResolvedValueOnce(['profile:user-1', 'profile:user-2']);
    await cache.clear();
    expect(redis.keys).toHaveBeenCalledWith('profile:*');
    expect(redis.del).toHaveBeenCalledWith('profile:user-1', 'profile:user-2');
  });
  
  it('should handle redis errors gracefully in get', async () => {
    (redis.get as jest.Mock).mockRejectedValueOnce(new Error('Redis Error'));
    const result = await cache.get('user1');
    expect(result).toBeNull();
  });
});
