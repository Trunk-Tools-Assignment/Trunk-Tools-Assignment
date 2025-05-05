import { Request, Response, NextFunction } from 'express';
import logger from '../lib/logger';

/**
 * Custom error interface with optional statusCode
 */
export interface ApplicationError extends Error {
  statusCode?: number;
}

/**
 * Global error handling middleware
 * Catches all errors thrown during request processing
 * Logs detailed error information and returns a consistent error response
 *
 * @param {ApplicationError} err - The error object thrown during request processing
 * @param {number} err.statusCode - Optional status code to override the default 500
 * @param {string} err.message - Error message
 * @param {string} err.stack - Error stack trace
 * @param {Request} req - Express request object
 * @param {string} req.path - The path that was requested
 * @param {string} req.method - The HTTP method used
 * @param {Response} res - Express response object
 * @param {NextFunction} _next - Express next middleware function (unused)
 * @returns {void}
 */
export const errorHandler = (
  err: ApplicationError,
  req: Request,
  res: Response,
  _next: NextFunction,
): void => {
  // Log detailed error information for debugging and monitoring
  logger.error({
    message: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
    timestamp: new Date().toISOString(),
  });

  // Use the error's status code or default to 500 (Internal Server Error)
  const statusCode = err.statusCode || 500;

  // Return a consistent error response structure to clients
  res.status(statusCode).json({
    error: {
      message: err.message || 'Internal Server Error',
      status: statusCode,
    },
  });
};
