import { query } from 'express-validator';
import { listJobs, getJobById } from '../services/jobs.service.js';
import { validateRequest } from '../middleware/validate.middleware.js';

// Query parameter validators for search, location, company, and pagination
export const jobListValidators = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('page must be a positive integer')
    .toInt(),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('limit must be between 1 and 100')
    .toInt(),
  query('search').optional().isString().trim().escape(),
  query('location').optional().isString().trim().escape(),
  query('company').optional().isString().trim().escape(),
  query('q').optional().isString().trim().escape(),
];

// GET /api/jobs - Returns paginated, filtered job listings
export async function getJobs(req, res, next) {
  try {
    const search = req.query.search || req.query.q;
    const result = await listJobs({
      page: req.query.page || 1,
      limit: req.query.limit || 20,
      search,
      location: req.query.location,
      company: req.query.company,
    });
    return res.status(200).json(result);
  } catch (err) {
    next(err);
  }
}

// GET /api/jobs/:id - Fetches single job record by ID
export async function getJob(req, res, next) {
  try {
    const job = await getJobById(req.params.id);
    if (!job) {
      return res.status(404).json({ error: { message: 'Job not found' } });
    }
    return res.status(200).json(job);
  } catch (err) {
    next(err);
  }
}

export { validateRequest };
