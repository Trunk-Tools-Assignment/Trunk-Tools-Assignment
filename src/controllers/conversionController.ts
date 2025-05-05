import { Request, Response, NextFunction } from 'express';
import conversionService from '../services/conversionService';

/**
 * Controller handling currency conversion requests
 * Acts as a layer between the HTTP routes and service logic
 */
class ConversionController {
  /**
   * Handles currency conversion requests
   *
   * @async
   * @param {Request} req - Express request object
   * @param {Response} res - Express response object
   * @param {NextFunction} next - Express next middleware function
   * @returns {Promise<void>}
   */
  convert = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      // The validation middleware has already validated and transformed these
      // We need to cast here to use the correct types
      const from = req.query.from as string;
      const to = req.query.to as string;
      const amount = Number(req.query.amount);
      const userId = req.userId;

      if (!userId) {
        res.status(401).json({ error: 'Unauthorized - User ID required' });
        return;
      }

      const result = await conversionService.convertCurrency(
        from, // Already validated and transformed to uppercase
        to, // Already validated and transformed to uppercase
        amount, // Already validated and coerced to number
        userId,
      );

      res.json(result);
    } catch (error) {
      // Handle specific error types with appropriate status codes
      if (
        (error as Error).message === 'Invalid currency code' ||
        (error as Error).message === 'Invalid exchange rate'
      ) {
        res.status(400).json({ error: (error as Error).message });
        return;
      }

      next(error);
    }
  };
}

export default new ConversionController();
