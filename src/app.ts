import express, { Request, Response } from 'express';
import rateLimit from 'express-rate-limit';
import conversionRoutes from './routes/conversion';
import { errorHandler } from './middleware/errorHandler';
import prisma from './lib/prisma';
import logger from './lib/logger';
import { extractUserId } from './lib/auth';

// Initialize Express app
const app = express();

// Rate limiting configuration
// Different rate limits for weekdays and weekends to handle varying traffic patterns
// Weekdays: lower limit since it's primarily business hours
const weekdayLimit = rateLimit({
  windowMs: 24 * 60 * 60 * 1000, // 24 hours
  max: 100, // 100 requests per workday
  message: 'Daily request limit exceeded (100 requests per workday)',
  skip: (_req: Request) => {
    const day = new Date().getDay();
    return day === 0 || day === 6; // Skip on weekends (0=Sunday, 6=Saturday)
  },
  keyGenerator: (req: Request) => {
    // Use userId from auth token or fallback to anonymous for rate limiting
    return extractUserId(req.headers) || 'anonymous';
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: true, // Enable the `X-RateLimit-*` headers for backwards compatibility
});

// Weekend: higher limit since usage patterns differ and load is typically lower
const weekendLimit = rateLimit({
  windowMs: 24 * 60 * 60 * 1000, // 24 hours
  max: 200, // 200 requests per weekend day
  message: 'Daily request limit exceeded (200 requests per weekend day)',
  skip: (_req: Request) => {
    const day = new Date().getDay();
    return day !== 0 && day !== 6; // Skip on weekdays
  },
  keyGenerator: (req: Request) => {
    // Use userId from auth token or fallback to anonymous for rate limiting
    return extractUserId(req.headers) || 'anonymous';
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: true, // Enable the `X-RateLimit-*` headers for backwards compatibility
});

// Middleware
app.use(express.json());
app.use(weekdayLimit);
app.use(weekendLimit);

// Health check endpoint
// Used by monitoring systems to check if the service is healthy
// Returns system information and database connectivity status
app.get('/health', (req: Request, res: Response) => {
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

// Routes
app.use('/api/convert', conversionRoutes);

// Error handling
app.use(errorHandler);

// Graceful shutdown
// Handle application termination to clean up resources
process.on('SIGINT', async () => {
  await prisma.$disconnect();
  logger.info('Application shutting down...');
  process.exit(0);
});

export default app;
