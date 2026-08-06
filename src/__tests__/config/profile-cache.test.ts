import { ProfileCache } from '../../config/profile-cache';
import { UserProfile } from '../../types';

const mockProfile: UserProfile = {
  id: 'user1',
  role: 'customer',
  balance: 0,
  created_at: '2023-01-01T00:00:00Z',
};

describe('ProfileCache', () => {
  let cache: ProfileCache;

  beforeEach(() => {
    cache = new ProfileCache(100); // 100 ms TTL for quick testing
  });

  it('should return null for non-existent userId', () => {
    expect(cache.get('unknown-user')).toBeNull();
  });

  it('should store and return a cached profile before expiry', () => {
    cache.set(mockProfile.id, mockProfile);
    expect(cache.size()).toBe(1);
    expect(cache.get(mockProfile.id)).toEqual(mockProfile);
  });

  it('should expire and return null after TTL has passed', async () => {
    cache.set(mockProfile.id, mockProfile);
    expect(cache.get(mockProfile.id)).toEqual(mockProfile);

    // Wait 150 ms to exceed 100 ms TTL
    await new Promise(resolve => setTimeout(resolve, 150));

    expect(cache.get(mockProfile.id)).toBeNull();
    expect(cache.size()).toBe(0); // auto-cleared on get
  });

  it('should invalidate a cached profile explicitly', () => {
    cache.set(mockProfile.id, mockProfile);
    cache.invalidate(mockProfile.id);
    expect(cache.get(mockProfile.id)).toBeNull();
    expect(cache.size()).toBe(0);
  });

  it('should clear all cached profiles', () => {
    cache.set('user-1', { ...mockProfile, id: 'user-1' });
    cache.set('user-2', { ...mockProfile, id: 'user-2' });
    expect(cache.size()).toBe(2);

    cache.clear();
    expect(cache.size()).toBe(0);
  });
});
