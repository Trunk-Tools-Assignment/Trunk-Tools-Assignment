import express from 'express';
import conversionController from '../controllers/conversionController';
import { validate, schemas } from '../lib/validation';
import { validateAuth } from '../middleware/authMiddleware';

const router = express.Router();

/**
 * @swagger
 * /api/convert:
 *   get:
 *     summary: Convert currency
 *     description: Converts an amount from one currency to another using real-time exchange rates
 *     tags:
 *       - Conversion
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: from
 *         required: true
 *         schema:
 *           type: string
 *           minLength: 3
 *           maxLength: 4
 *         description: Source currency code (e.g., USD, BTC)
 *         example: USD
 *       - in: query
 *         name: to
 *         required: true
 *         schema:
 *           type: string
 *           minLength: 3
 *           maxLength: 4
 *         description: Target currency code (e.g., EUR, ETH)
 *         example: EUR
 *       - in: query
 *         name: amount
 *         required: true
 *         schema:
 *           type: number
 *           minimum: 0.01
 *         description: Amount to convert
 *         example: 100
 *     responses:
 *       200:
 *         description: Successful conversion
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 from:
 *                   type: string
 *                   description: Source currency code
 *                   example: USD
 *                 to:
 *                   type: string
 *                   description: Target currency code
 *                   example: EUR
 *                 amount:
 *                   type: number
 *                   description: Original amount
 *                   example: 100
 *                 result:
 *                   type: number
 *                   description: Converted amount
 *                   example: 92.34
 *                 rate:
 *                   type: number
 *                   description: Exchange rate
 *                   example: 0.9234
 *       400:
 *         description: Bad request - missing or invalid parameters
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: Validation error
 *       401:
 *         description: Unauthorized - missing or invalid authentication
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: Authentication required
 *       429:
 *         description: Too many requests - rate limit exceeded
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: Rate limit exceeded
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: Internal server error
 */
router.get(
  '/',
  validateAuth,
  validate(schemas.conversion),
  conversionController.convert,
);

export default router;
