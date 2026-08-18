import { listSources } from '../services/sources.service.js';

/**
 * GET /api/sources
 *
 * Returns all configured sources and their job counts.
 */
export async function getSources(req, res, next) {
  try {
    const sources = await listSources();
    return res.status(200).json({ data: sources });
  } catch (err) {
    next(err);
  }
}
