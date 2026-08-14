import { logger } from '../config/logger';

export interface RetryOptions {
  maxRetries?: number;
  initialDelayMs?: number;
  factor?: number;
  maxDelayMs?: number;
}

/**
 * Executes an async function with exponential backoff retry mechanism.
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const {
    maxRetries = 3,
    initialDelayMs = 200,
    factor = 2,
    maxDelayMs = 3000,
  } = options;

  let attempt = 0;
  let delay = initialDelayMs;

  while (true) {
    try {
      return await fn();
    } catch (error: any) {
      attempt++;
      if (attempt >= maxRetries) {
        logger.error(`Operation failed after ${attempt} attempts:`, error.message || error);
        throw error;
      }

      logger.warn(`Operation failed (attempt ${attempt}/${maxRetries}), retrying in ${delay}ms... Error: ${error.message || error}`);
      await new Promise((resolve) => setTimeout(resolve, delay));
      delay = Math.min(delay * factor, maxDelayMs);
    }
  }
}
