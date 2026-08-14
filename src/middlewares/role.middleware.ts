import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/app-error';

/**
 * Middleware that restricts access to specific roles.
 * Must be used after requireAuth middleware.
 */
export const requireRole = (allowedRoles: ('customer' | 'barista' | 'branch_manager' | 'admin')[]) => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    try {
      if (!req.profile) {
        throw new AppError('Unauthorized: User profile not loaded.', 401);
      }

      const currentRole = req.profile.role;
      const normalizedRole = (currentRole as string) === 'manager' ? 'branch_manager' : currentRole;
      const hasRole = allowedRoles.includes(currentRole as any) || allowedRoles.includes(normalizedRole as any);
      if (!hasRole) {
        throw new AppError('Forbidden: You do not have permission to perform this action.', 403);
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};
