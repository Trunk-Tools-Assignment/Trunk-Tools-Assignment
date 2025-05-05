import { Request, Response, NextFunction } from 'express';
import { extractUserId } from '../lib/auth';
import { schemas } from '../lib/validation';
import logger from '../lib/logger';

// Extend the Express Request type to add userId
// Using module augmentation instead of namespace
declare module 'express' {
  interface Request {
    userId?: string;
  }
}

/**
 * Type for a validation error
 */
interface ValidationError extends Error {
  errors?: Array<{
    path: string[];
    message: string;
  }>;
}

/**
 * Middleware to validate user authorization
 *
 * Extracts user ID from Authorization header, validates it,
 * and attaches it to the request object for downstream handlers
 *
 * @param {Request} req - Express request object
 * @param {Object} req.headers - HTTP headers
 * @param {string} [req.headers.authorization] - Authorization header (Bearer token)
 * @param {Response} res - Express response object
 * @param {NextFunction} next - Express next middleware function
 * @returns {void}
 */
export const validateAuth = (
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  try {
    const userId = extractUserId(req.headers);

    if (!userId) {
      res.status(401).json({ error: 'Unauthorized - User ID required' });
      return;
    }

    // Validate the user ID using Zod
    const result = schemas.auth.parse({ userId });

    // Attach the validated user ID to the request
    req.userId = result.userId;

    next();
  } catch (error) {
    logger.error(`Auth validation error: ${(error as Error).message}`);

    if ((error as ValidationError).errors) {
      res.status(401).json({
        error: 'Unauthorized',
        details: (error as ValidationError).errors?.map((e) => ({
          path: e.path.join('.'),
          message: e.message,
        })),
      });
      return;
    }

    res.status(401).json({ error: 'Unauthorized' });
  }
};
