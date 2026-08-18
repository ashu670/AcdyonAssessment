import { logger } from '../../config/logger.js';

// Maps raw Lever API array to normalized job instances
export function parseLeverResponse(rawArray, companyName = 'Spotify') {
  if (!Array.isArray(rawArray)) {
    logger.warn({ rawArray }, 'Lever response is not an array');
    return [];
  }

  const jobs = [];
  for (const raw of rawArray) {
    const normalised = normalizeLeverJob(raw, companyName);
    if (normalised) {
      jobs.push(normalised);
    }
  }

  return jobs;
}

// Maps single Lever posting into normalized job object
export function normalizeLeverJob(raw, companyName = 'Spotify') {
  if (!raw || typeof raw !== 'object') {
    return null;
  }

  // Validate mandatory fields
  const externalId = raw.id ? String(raw.id).trim() : null;
  const title = raw.text ? String(raw.text).trim() : null;
  const url = raw.hostedUrl ? String(raw.hostedUrl).trim() : null;

  if (!externalId || !title || !url) {
    logger.debug({ raw }, 'Skipping Lever job: missing id, title, or hostedUrl');
    return null;
  }

  // Parse location from categories or workplaceType
  let location = null;
  if (raw.categories?.location) {
    if (Array.isArray(raw.categories.location)) {
      location = raw.categories.location.join(', ');
    } else {
      location = String(raw.categories.location).trim();
    }
  } else if (raw.workplaceType) {
    location = String(raw.workplaceType).trim();
  }

  // Combine descriptionBody and list items
  let description = raw.descriptionBody || raw.openingHtml || null;
  if (Array.isArray(raw.lists) && raw.lists.length > 0) {
    const listsHtml = raw.lists
      .map((item) => `<h3>${item.text || ''}</h3><ul>${item.content || ''}</ul>`)
      .join('');
    description = (description || '') + listsHtml;
  }

  // Parse publication timestamp
  let postedAt = null;
  if (raw.createdAt) {
    const date = new Date(raw.createdAt);
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
