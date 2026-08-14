import { Request, Response, NextFunction } from 'express';
import { supabase, supabaseAdmin } from '../config/supabase';
import { profileCache } from '../config/profile-cache';
import { AppError } from '../utils/app-error';
import { UserProfile } from '../types';

/**
 * Middleware that requires a valid Supabase JWT Bearer token.
 * Populates req.user, req.token, and req.profile.
 */
export const requireAuth = async (
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AppError('Authentication required. Format: Bearer <token>', 401);
    }

    const token = authHeader.split(' ')[1];

    // Verify token with Supabase and fetch the corresponding user
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      throw new AppError('Unauthorized: Invalid or expired token', 401);
    }

    // Check Redis TTL cache before querying the database
    const cachedProfile = await profileCache.get(user.id);
    if (cachedProfile) {
      req.user = user;
      req.token = token;
      req.profile = cachedProfile;
      return next();
    }

    // Fetch the profile for this user from public.profiles
    let { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .maybeSingle();

    if (profileError) {
      throw new AppError('Failed to retrieve user profile', 500);
    }

    // If profile doesn't exist, create a default customer profile
    if (!profile) {
      const { data: newProfile, error: createError } = await supabaseAdmin
        .from('profiles')
        .upsert({ id: user.id, role: 'customer' })
        .select()
        .single();
      
      if (createError) {
        throw new AppError('Failed to initialize user profile', 500);
      }
      profile = newProfile;
    }

    const userProfile = profile as UserProfile;
    // Cache the newly fetched profile
    await profileCache.set(user.id, userProfile);

    // Attach the user, token, and profile to the request context
    req.user = user;
    req.token = token;
    req.profile = userProfile;

    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Middleware that optionally parses a Supabase JWT Bearer token.
 * If valid, populates req.user, req.token, and req.profile.
 * If invalid or absent, just calls next() without throwing error.
 */
export const optionalAuth = async (
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next();
  }

  // Use the same logic but swallow errors
  try {
    const token = authHeader.split(' ')[1];
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (!error && user) {
      const cachedProfile = await profileCache.get(user.id);
      if (cachedProfile) {
        req.user = user;
        req.token = token;
        req.profile = cachedProfile;
        return next();
      }

      let { data: profile } = await supabaseAdmin
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();

      if (profile) {
        req.user = user;
        req.token = token;
        req.profile = profile as UserProfile;
        await profileCache.set(user.id, profile as UserProfile);
      }
    }
  } catch (e) {
    // Ignore error in optional auth
  }
  next();
};
