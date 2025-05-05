import winston from 'winston';

/**
 * Centralized application logger based on Winston
 * Configures different log levels and transports based on environment
 *
 * Log levels (from highest to lowest priority):
 * - error: Critical errors that require immediate attention
 * - warn: Warning conditions that should be addressed
 * - info: Informational messages about application state
 * - debug: Detailed debugging information
 */
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json(),
  ),
  transports: [
    new winston.transports.File({
      filename: 'logs/error.log',
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
    new winston.transports.File({
      filename: 'logs/combined.log',
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
  ],
});

// Add console transport in non-production environments
if (process.env.NODE_ENV !== 'production') {
  logger.add(
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple(),
      ),
    }),
  );
}

// We need to directly add the stream property to the logger object
// eslint-disable-next-line @typescript-eslint/no-explicit-any
(logger as any).stream = {
  write: (message: string): void => {
    logger.info(message.trim());
  },
};

export default logger;
