import express, { Request, Response } from 'express';
import prisma from '../lib/prisma';
import logger from '../lib/logger';

const router = express.Router();

/**
 * @swagger
 * /health:
 *   get:
 *     summary: Health check
 *     description: Check if the API is running correctly
 *     tags:
 *       - System
 *     responses:
 *       200:
 *         description: API is healthy and operating normally
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: ok
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *                   example: "2023-05-04T12:00:00Z"
 *                 uptime:
 *                   type: number
 *                   description: Server uptime in seconds
 *                   example: 3600
 *                 memory:
 *                   type: object
 *                   description: Memory usage statistics
 *                 version:
 *                   type: string
 *                   description: Application version
 *                   example: "1.0.0"
 *       500:
 *         description: Service is experiencing issues
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: error
 *                 error:
 *                   type: string
 *                   example: Database connection error
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *                   example: "2023-05-04T12:00:00Z"
 */
router.get('/', (req: Request, res: Response) => {
  // Test database connectivity with a simple query
  prisma.$queryRaw`SELECT 1 AS health`
    .then(() => {
      res.status(200).json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(), // Time in seconds since the server started
        memory: process.memoryUsage(), // Memory statistics for monitoring
        version: process.env.npm_package_version || 'unknown',
      });
    })
    .catch((error: Error) => {
      logger.error('Health check database error:', error);
      res.status(500).json({
        status: 'error',
        error: 'Database connection error',
        timestamp: new Date().toISOString(),
      });
    });
});

export default router;
