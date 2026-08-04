import { UserProfile } from '../types';
import { logger } from './logger';

interface CacheEntry {
  profile: UserProfile;
  expiresAt: number;
}

/**
 * In-Memory TTL Cache for User Profiles.
 * Prevents making a database query to `public.profiles` on every authenticated request.
 * Default TTL is 5 minutes (300,000 ms).
 */
export class ProfileCache {
  private cache = new Map<string, CacheEntry>();
  private readonly ttlMs: number;

  constructor(ttlMs = 5 * 60 * 1000) {
    this.ttlMs = ttlMs;
  }

  /**
   * Retrieve a user profile from the cache if present and not expired.
   */
  get(userId: string): UserProfile | null {
    const entry = this.cache.get(userId);
    if (!entry) {
      return null;
    }

    if (Date.now() > entry.expiresAt) {
      this.cache.delete(userId);
      return null;
    }

    return entry.profile;
  }

  /**
   * Store a user profile in the cache with the configured TTL.
   */
  set(userId: string, profile: UserProfile): void {
    const expiresAt = Date.now() + this.ttlMs;
    this.cache.set(userId, { profile, expiresAt });
  }

  /**
   * Remove a user profile from the cache (e.g. upon logout or profile update).
   */
  invalidate(userId: string): void {
    if (this.cache.delete(userId)) {
      logger.debug(`Profile cache invalidated for user ${userId}`);
    }
  }

  /**
   * Clear the entire cache (useful for testing or cache resets).
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Get the current number of cached profiles.
   */
  size(): number {
    return this.cache.size;
  }
}

export const profileCache = new ProfileCache();
