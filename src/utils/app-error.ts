export class AppError extends Error {
  public readonly statusCode: number;
  public readonly isOperational: boolean;
  public readonly details?: any;

  constructor(message: string, statusCode = 500, isOperational = true, details?: any) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.details = details;

    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Re-throws AppError instances as-is (preserving statusCode),
 * and wraps any other error type in an AppError with the given fallback message and code.
 *
 * Use this in service catch blocks to prevent status code loss.
 */
export function rethrowAsAppError(
  error: unknown,
  fallbackMessage: string,
  fallbackCode = 400
): never {
  if (error instanceof AppError) throw error;
  const message = error instanceof Error ? error.message : fallbackMessage;
  throw new AppError(message || fallbackMessage, fallbackCode);
}

