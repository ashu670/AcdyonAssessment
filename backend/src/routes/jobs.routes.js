import { Router } from 'express';
import { getJobs, getJob, jobListValidators, validateRequest } from '../controllers/jobs.controller.js';

const router = Router();

// GET /api/jobs/search?q=... — must come BEFORE /:id to avoid route conflict
router.get('/search', jobListValidators, validateRequest, getJobs);

// GET /api/jobs?page=1&limit=20&search=...&location=...&company=...
router.get('/', jobListValidators, validateRequest, getJobs);

// GET /api/jobs/:id
router.get('/:id', getJob);

export default router;
