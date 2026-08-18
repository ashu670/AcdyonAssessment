import { logger } from '../../config/logger.js';

/**
 * Normalises raw Backup API job response into common JobPulse schema.
 */
export function parseBackupResponse(rawResponse, companyName = 'Backup Jobs Aggregator') {
  if (!rawResponse || typeof rawResponse !== 'object') {
    logger.warn({ rawResponse }, 'Backup response is invalid');
    return [];
  }

  const rawJobs = Array.isArray(rawResponse.jobs)
    ? rawResponse.jobs
    : Array.isArray(rawResponse)
    ? rawResponse
    : [];

  const jobs = [];
  for (const raw of rawJobs) {
    const normalised = normalizeBackupJob(raw, companyName);
    if (normalised) {
      jobs.push(normalised);
    }
  }

  return jobs;
}

export function normalizeBackupJob(raw, companyName = 'Backup Jobs Aggregator') {
  if (!raw || typeof raw !== 'object') {
    return null;
  }

  const externalId = raw.id ? String(raw.id).trim() : null;
  const title = raw.title ? String(raw.title).trim() : null;
  const url = raw.url || raw.jobUrl ? String(raw.url || raw.jobUrl).trim() : null;

  if (!externalId || !title || !url) {
    return null;
  }

  return {
    externalId,
    title,
    company: raw.company || companyName,
    location: raw.location || 'Remote',
    description: raw.description || '<p>Backup job feed listing ingested via fallback aggregator.</p>',
    url,
    postedAt: raw.postedAt ? new Date(raw.postedAt) : new Date(),
  };
}
