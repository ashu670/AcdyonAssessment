import { isDev } from '../config/env.js';
import { logger } from '../config/logger.js';

/**
 * Centralised Express error handler.
 * Must be registered LAST (after all routes) via app.use(errorMiddleware).
 *
 * Rules:
 * - Always returns JSON so clients get a consistent error envelope.
 * - Hides the stack trace in production to avoid leaking internals.
 * - Logs every error with its full stack for server-side debugging.
 *
 * @param {Error} err
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} _next  - required 4-arg signature for Express
 */
// eslint-disable-next-line no-unused-vars
export function errorMiddleware(err, req, res, _next) {
  const statusCode = err.statusCode || err.status || 500;

  logger.error(
    { err, method: req.method, url: req.url },
    'Unhandled error'
  );

  res.status(statusCode).json({
    error: {
      message: err.message || 'Internal server error',
      // Only expose the stack trace in development
      ...(isDev && { stack: err.stack }),
    },
  });
}

/**
 * A simple helper to create operational errors with an HTTP status code.
 * Use this instead of throwing plain Error objects from controllers/services.
 *
 * @param {string} message
 * @param {number} statusCode
 * @returns {Error}
 */
export function createError(message, statusCode = 500) {
  const err = new Error(message);
  err.statusCode = statusCode;
  return err;
}
