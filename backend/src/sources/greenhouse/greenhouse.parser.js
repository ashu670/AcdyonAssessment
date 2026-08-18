import { logger } from '../../config/logger.js';

// Parses array of raw Greenhouse job objects into normalized schema
export function parseGreenhouseJobs(rawResponse, company) {
  if (!rawResponse || !Array.isArray(rawResponse.jobs)) {
    throw new Error(
      'Greenhouse API returned an unexpected response shape — expected { jobs: [] }'
    );
  }

  const jobs = rawResponse.jobs;

  if (jobs.length === 0) {
    logger.warn({ company }, 'Greenhouse returned 0 jobs for board token');
  }

  const normalised = [];
  let skipped = 0;

  for (const raw of jobs) {
    const job = normalizeGreenhouseJob(raw, company);
    if (job) {
      normalised.push(job);
    } else {
      skipped++;
    }
  }

  if (skipped > 0) {
    logger.warn({ skipped }, 'Skipped invalid Greenhouse job entries');
  }

  return normalised;
}

// Maps single raw Greenhouse listing to normalized job object
export function normalizeGreenhouseJob(raw, company) {
  // Validate mandatory fields
  if (!raw.id) {
    logger.warn({ raw }, 'Greenhouse job missing id — skipping');
    return null;
  }
  if (!raw.title || typeof raw.title !== 'string') {
    logger.warn({ id: raw.id }, 'Greenhouse job missing title — skipping');
    return null;
  }
  if (!raw.absolute_url || typeof raw.absolute_url !== 'string') {
    logger.warn({ id: raw.id }, 'Greenhouse job missing absolute_url — skipping');
    return null;
  }

  const externalId = String(raw.id);
  const title = raw.title.trim();
  const companyName = (raw.company_name && String(raw.company_name).trim()) || company;
  const location = raw.location && typeof raw.location.name === 'string'
    ? raw.location.name.trim() || null
    : null;
  const description = raw.content && typeof raw.content === 'string' ? raw.content : null;
  const url = raw.absolute_url;

  let postedAt = null;
  const rawDate = raw.first_published || raw.updated_at;
  if (rawDate) {
    const parsed = new Date(rawDate);
    postedAt = isNaN(parsed.getTime()) ? null : parsed;
  }

  return {
    externalId,
    title,
    company: companyName,
    location,
    description,
    url,
    postedAt,
  };
}
