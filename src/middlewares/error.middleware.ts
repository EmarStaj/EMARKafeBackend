import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/app-error';
import { sendError } from '../utils/response';
import { ZodError } from 'zod';
import { logger } from '../config/logger';

export const errorMiddleware = (
  err: Error,
  _req: Request,
  res: Response,
  next: NextFunction
): void => {
  // If headers already sent, delegate to default express error handler
  if (res.headersSent) {
    return next(err);
  }

  // Log non-operational errors for debugging
  if (!(err instanceof AppError)) {
    logger.error('Unexpected Error:', { message: err.message, stack: err.stack });
  }

  // Handle Zod Validation Errors
  if (err instanceof ZodError) {
    sendError(res, 'Validation Error', 400, err.errors);
    return;
  }

  // Handle AppError (operational errors)
  if (err instanceof AppError) {
    sendError(res, err.message, err.statusCode);
    return;
  }

  // Fallback for generic/unhandled errors
  const message = process.env.NODE_ENV === 'production' 
    ? 'Internal Server Error' 
    : err.message;
    
  sendError(res, message, 500);
};
