/**
 * @module validation
 * Input validation utilities using Zod
 */
import { z } from 'zod';
import { Request, Response, NextFunction } from 'express';
import logger from './logger';

/**
 * List of supported FIAT currencies
 * @type {string[]}
 */
export const SUPPORTED_FIAT_CURRENCIES = ['USD', 'EUR'];

/**
 * List of supported cryptocurrencies
 * @type {string[]}
 */
export const SUPPORTED_CRYPTOCURRENCIES = ['BTC', 'ETH'];

/**
 * All supported currencies (combined FIAT and crypto)
 * @type {string[]}
 */
export const SUPPORTED_CURRENCIES = [
  ...SUPPORTED_FIAT_CURRENCIES,
  ...SUPPORTED_CRYPTOCURRENCIES,
];

/**
 * Collection of validation schemas for different parts of the application
 * @type {Object}
 */
export const schemas = {
  /**
   * Schema for currency conversion parameters
   * Validates and normalizes input for currency conversion operations
   * @type {z.ZodObject}
   */
  conversion: z.object({
    from: z
      .string()
      .toUpperCase()
      .refine((val) => SUPPORTED_CURRENCIES.includes(val), {
        message: `Currency must be one of: ${SUPPORTED_CURRENCIES.join(', ')}`,
      }),
    to: z
      .string()
      .toUpperCase()
      .refine((val) => SUPPORTED_CURRENCIES.includes(val), {
        message: `Currency must be one of: ${SUPPORTED_CURRENCIES.join(', ')}`,
      }),
    amount: z.coerce
      .number()
      .positive('Amount must be a positive number')
      .finite('Amount must be a finite number'),
  }),

  /**
   * Schema for user authentication
   * Validates user identification data
   * @type {z.ZodObject}
   */
  auth: z.object({
    userId: z.string().min(1, 'User ID is required'),
  }),
};

/**
 * Type for a Zod validation error
 */
type ValidationError = z.ZodError & {
  errors: Array<{
    path: string[];
    message: string;
  }>;
};

/**
 * Creates middleware for validating request data against a Zod schema
 * Parses, transforms, and validates the data, then attaches the validated
 * data back to the request object
 *
 * @param {z.ZodSchema} schema - The Zod schema to validate against
 * @param {string} source - Request property to validate ('query', 'body', or 'params')
 * @returns {Function} Express middleware function
 * @throws {Error} If validation fails, returns a 400 response with error details
 *
 * @example
 * // Validate query parameters
 * router.get('/endpoint', validate(schemas.conversion), (req, res) => {
 *   // req.query is now validated and transformed
 * });
 *
 * @example
 * // Validate request body
 * router.post('/endpoint', validate(schemas.auth, 'body'), (req, res) => {
 *   // req.body is now validated and transformed
 * });
 */
export const validate = (
  schema: z.ZodSchema,
  source: 'query' | 'body' | 'params' = 'query',
) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      // Parse and validate the request data
      const result = schema.parse(req[source]);

      // Replace the original data with the validated and transformed data
      req[source] = result;

      next();
    } catch (error) {
      logger.error(`Validation error: ${(error as Error).message}`);

      // If it's a ZodError, format the errors
      if ((error as ValidationError).errors) {
        res.status(400).json({
          error: 'Validation error',
          details: (error as ValidationError).errors.map((e) => ({
            path: e.path.join('.'),
            message: e.message,
          })),
        });
        return;
      }

      // For other types of errors
      res.status(400).json({ error: (error as Error).message });
    }
  };
};
