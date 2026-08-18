import { logger } from '../../config/logger.js';

// Maps raw Ashby response payload to normalized job instances
export function parseAshbyResponse(rawResponse, companyName = 'Linear') {
  if (!rawResponse || typeof rawResponse !== 'object') {
    logger.warn({ rawResponse }, 'Ashby response is not an object');
    return [];
  }

  const rawJobs = Array.isArray(rawResponse.jobs) ? rawResponse.jobs : [];
  const jobs = [];

  for (const raw of rawJobs) {
    const normalised = normalizeAshbyJob(raw, companyName);
    if (normalised) {
      jobs.push(normalised);
    }
  }

  return jobs;
}

// Maps single Ashby listing to normalized job schema
export function normalizeAshbyJob(raw, companyName = 'Linear') {
  if (!raw || typeof raw !== 'object') {
    return null;
  }

  // Validate mandatory fields
  const externalId = raw.id ? String(raw.id).trim() : null;
  const title = raw.title ? String(raw.title).trim() : null;
  const url = raw.jobUrl ? String(raw.jobUrl).trim() : null;

  if (!externalId || !title || !url) {
    logger.debug({ raw }, 'Skipping Ashby job: missing id, title, or jobUrl');
    return null;
  }

  // Parse location and remote flag
  let location = raw.location ? String(raw.location).trim() : null;
  if (!location && raw.address?.postalAddress) {
    const { addressLocality, addressRegion, addressCountry } = raw.address.postalAddress;
    location = [addressLocality, addressRegion, addressCountry].filter(Boolean).join(', ');
  }
  if (raw.isRemote) {
    location = location ? `${location} (Remote)` : 'Remote';
  }

  const description = raw.descriptionHtml || raw.descriptionPlain || null;

  // Parse publication date
  let postedAt = null;
  if (raw.publishedAt) {
    const date = new Date(raw.publishedAt);
    if (!isNaN(date.getTime())) {
      postedAt = date;
    }
  }

  return {
    externalId,
    title,
    company: companyName,
    location: location || null,
    description: description || null,
    url,
    postedAt,
  };
}
