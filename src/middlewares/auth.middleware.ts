import { Request, Response, NextFunction } from 'express';
import { supabase } from '../config/supabase';
import { AppError } from '../utils/app-error';

/**
 * Middleware that requires a valid Supabase JWT Bearer token.
 * Populates req.user and req.token.
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

    // Attach the user and token to the request context
    req.user = user;
    req.token = token;

    next();
  } catch (error) {
    next(error);
  }
};
