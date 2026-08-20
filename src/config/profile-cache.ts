import { UserProfile } from '../types';
import { logger } from './logger';
import { redis } from './redis';

/**
 * Redis-backed Cache for User Profiles.
 * Prevents making a database query to `public.profiles` on every authenticated request.
 * Default TTL is 5 minutes (300 seconds).
 */
export class ProfileCache {
  private readonly ttlSeconds: number;
  private readonly prefix = 'profile:';

  constructor(ttlSeconds = 5 * 60) {
    this.ttlSeconds = ttlSeconds;
  }

  /**
   * Retrieve a user profile from the cache if present.
   */
  async get(userId: string): Promise<UserProfile | null> {
    try {
      const data = await redis.get(this.prefix + userId);
      if (!data) return null;
      return JSON.parse(data) as UserProfile;
    } catch (error: any) {
      // Sadece debug log atalım, konsol kirlenmesin
      logger.debug(`Profile cache skip (Redis unavailable) for user ${userId}: ${error.message}`);
      return null; // Fail open (DB'ye gider)
    }
  }

  /**
   * Store a user profile in the cache with the configured TTL.
   */
  async set(userId: string, profile: UserProfile): Promise<void> {
    try {
      await redis.setex(this.prefix + userId, this.ttlSeconds, JSON.stringify(profile));
    } catch (error: any) {
      logger.debug(`Profile cache set skip (Redis unavailable) for user ${userId}: ${error.message}`);
    }
  }

  /**
   * Remove a user profile from the cache (e.g. upon logout or profile update).
   */
  async invalidate(userId: string): Promise<void> {
    try {
      const deleted = await redis.del(this.prefix + userId);
      if (deleted > 0) {
        logger.debug(`Profile cache invalidated for user ${userId}`);
      }
    } catch (error) {
      logger.error(`Error invalidating profile cache for user ${userId}:`, error);
    }
  }

  /**
   * Clear the entire cache (useful for testing or cache resets).
   */
  async clear(): Promise<void> {
    try {
      const keys = await redis.keys(this.prefix + '*');
      if (keys.length > 0) {
        await redis.del(...keys);
      }
    } catch (error) {
      logger.error('Error clearing profile cache:', error);
    }
  }
}

export const profileCache = new ProfileCache();
