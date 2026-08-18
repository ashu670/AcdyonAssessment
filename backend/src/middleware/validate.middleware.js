import { validationResult } from 'express-validator';

/**
 * Run after express-validator check() chains.
 * If there are validation errors, respond with 400 and the list of field errors.
 * Otherwise call next() to continue to the handler.
 *
 * Usage:
 *   router.get('/jobs', [query('page').isInt({ min: 1 })], validateRequest, handler)
 */
export function validateRequest(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ error: { validation: errors.array() } });
  }
  next();
}
