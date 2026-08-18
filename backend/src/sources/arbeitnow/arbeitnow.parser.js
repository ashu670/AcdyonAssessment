import { logger } from '../../config/logger.js';

// Maps raw Arbeitnow API response data array to normalized jobs
export function parseArbeitnowResponse(rawResponse) {
  if (!rawResponse || typeof rawResponse !== 'object') {
    logger.warn({ rawResponse }, 'Arbeitnow response is not an object');
    return [];
  }

  const rawJobs = Array.isArray(rawResponse.data) ? rawResponse.data : [];
  const jobs = [];

  for (const raw of rawJobs) {
    const normalised = normalizeArbeitnowJob(raw);
    if (normalised) {
      jobs.push(normalised);
    }
  }

  return jobs;
}

// Maps single Arbeitnow listing and validates target listing URL
export function normalizeArbeitnowJob(raw) {
  if (!raw || typeof raw !== 'object') {
    return null;
  }

  // Validate mandatory attributes
  const externalId = raw.slug ? String(raw.slug).trim() : null;
  const title = raw.title ? String(raw.title).trim() : null;
  const company = raw.company_name ? String(raw.company_name).trim() : null;
  const rawUrl = raw.url ? String(raw.url).trim() : null;

  if (!externalId || !title || !company || !rawUrl) {
    logger.debug({ raw }, 'Skipping Arbeitnow job: missing slug, title, company_name, or url');
    return null;
  }

  // Safeguard: Reject placeholder or synthetic URLs
  if (
    rawUrl.includes('example.com') ||
    rawUrl.includes('example.org') ||
    rawUrl.includes('localhost') ||
    (!rawUrl.startsWith('http://') && !rawUrl.startsWith('https://'))
  ) {
    logger.warn({ rawUrl }, 'Rejecting Arbeitnow job with invalid/placeholder URL');
    return null;
  }

  // Parse location and remote status
  let location = raw.location ? String(raw.location).trim() : 'Germany';
  if (raw.remote) {
    location = location ? `${location} (Remote)` : 'Remote';
  }

  // Parse publication epoch timestamp
  let postedAt = null;
  if (raw.created_at) {
    const dateMs = typeof raw.created_at === 'number' ? raw.created_at * 1000 : new Date(raw.created_at).getTime();
    if (!isNaN(dateMs)) {
      postedAt = new Date(dateMs);
    }
  }

  return {
    externalId,
    title,
    company,
    location: location || null,
    description: raw.description || null,
    url: rawUrl,
    postedAt,
  };
}
