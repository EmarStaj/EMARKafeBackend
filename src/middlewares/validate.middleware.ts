import { Request, Response, NextFunction } from 'express';
import { AnyZodObject } from 'zod';

/**
 * Express middleware to validate request payload against a Zod schema.
 * Validates body, query, and params.
 */
export const validate = (schema: AnyZodObject) => {
  return async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    try {
      // Parse and validate the request structure
      const parsed = await schema.parseAsync({
        body: req.body,
        query: req.query,
        params: req.params,
      });

      // Assign the parsed/sanitized data back to req properties
      req.body = parsed.body || req.body;
      req.query = parsed.query || req.query;
      req.params = parsed.params || req.params;

      next();
    } catch (error) {
      next(error);
    }
  };
};
