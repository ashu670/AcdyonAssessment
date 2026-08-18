import { PrismaClient } from '@prisma/client';
import { GreenhouseAdapter } from '../sources/greenhouse/greenhouse.adapter.js';
import { computeHash } from '../utils/hash.js';
import { logger } from '../config/logger.js';

const prisma = new PrismaClient();

let lastIngestionStatus = null;

// Removes legacy jobs containing placeholder or localhost URLs
export async function cleanUpFakeJobs() {
  try {
    const deleted = await prisma.job.deleteMany({
      where: {
        OR: [
          { url: { contains: 'example.com' } },
          { url: { contains: 'example.org' } },
          { url: { contains: 'localhost' } },
        ],
      },
    });

    if (deleted.count > 0) {
      logger.warn({ count: deleted.count }, 'Cleaned up legacy fake jobs containing placeholder URLs');
    }
  } catch (err) {
    logger.error({ err }, 'Failed during fake jobs cleanup');
  }
}

// Executes Greenhouse single-source ingestion cycle
export async function runGreenhouseIngestion() {
  const startedAt = Date.now();

  const source = await prisma.source.upsert({
    where: { name: 'Greenhouse' },
    update: {},
    create: {
      name: 'Greenhouse',
      type: 'greenhouse',
      baseUrl: 'https://boards-api.greenhouse.io/v1/boards',
      enabled: true,
    },
  });

  logger.info({ sourceId: source.id }, 'Ingestion started');

  const adapter = new GreenhouseAdapter();
  let normalisedJobs;

  try {
    const rawResponse = await adapter.fetchJobs();
    normalisedJobs = adapter.parseJobs(rawResponse);
  } catch (err) {
    const result = {
      source: 'Greenhouse',
      status: 'error',
      error: err.message,
      jobsFetched: 0,
      jobsInserted: 0,
      jobsUpdated: 0,
      jobsSkipped: 0,
      jobsDeleted: 0,
      durationMs: Date.now() - startedAt,
      ranAt: new Date().toISOString(),
    };
    lastIngestionStatus = result;
    throw err;
  }

  const jobsFetched = normalisedJobs.length;
  logger.info({ jobsFetched }, 'Jobs parsed; performing source reconciliation');

  const stats = await reconcileSourceJobs(source.id, normalisedJobs, true);
  const durationMs = Date.now() - startedAt;

  const result = {
    source: 'Greenhouse',
    status: 'success',
    ...stats,
    durationMs,
    ranAt: new Date().toISOString(),
  };

  lastIngestionStatus = result;
  logger.info(result, 'Ingestion complete');
  return result;
}

// Upserts active listings and reconciles stale jobs using optimized batching
export async function reconcileSourceJobs(sourceId, normalisedJobs, isComplete = true) {
  let jobsInserted = 0;
  let jobsUpdated = 0;
  let jobsSkipped = 0;
  let jobsDeleted = 0;

  // Filter listings with valid HTTP/HTTPS URLs
  const validJobs = (normalisedJobs || []).filter((job) => {
    return (
      job &&
      job.externalId &&
      job.url &&
      !job.url.includes('example.com') &&
      !job.url.includes('example.org') &&
      !job.url.includes('localhost') &&
      (job.url.startsWith('http://') || job.url.startsWith('https://'))
    );
  });

  const fetchedExternalIds = new Set(validJobs.map((j) => String(j.externalId)));

  // Fetch all existing jobs for this source in a single query
  let existingJobs = [];
  try {
    existingJobs = await prisma.job.findMany({
      where: { sourceId },
      select: { id: true, externalId: true, contentHash: true },
    });
  } catch (err) {
    logger.error({ err, sourceId }, 'Error fetching existing jobs for reconciliation');
  }

  const existingMap = new Map(existingJobs.map((j) => [j.externalId, j]));

  const toCreate = [];
  const toUpdate = [];

  for (const job of validJobs) {
    const extId = String(job.externalId);
    const hashInput = [
      job.title || '',
      job.company || '',
      job.location ?? '',
      job.description ?? '',
    ].join('|');
    const contentHash = computeHash(hashInput);

    const existing = existingMap.get(extId);

    if (!existing) {
      toCreate.push({
        sourceId,
        externalId: extId,
        title: job.title || 'Untitled Position',
        company: job.company || 'Company',
        location: job.location || null,
        description: job.description || null,
        url: job.url,
        postedAt: job.postedAt ? new Date(job.postedAt) : null,
        contentHash,
      });
    } else if (existing.contentHash !== contentHash) {
      toUpdate.push({
        id: existing.id,
        data: {
          title: job.title || 'Untitled Position',
          company: job.company || 'Company',
          location: job.location || null,
          description: job.description || null,
          url: job.url,
          postedAt: job.postedAt ? new Date(job.postedAt) : null,
          contentHash,
        },
      });
    } else {
      jobsSkipped++;
    }
  }

  const staleJobs = isComplete
    ? existingJobs.filter((j) => !fetchedExternalIds.has(j.externalId))
    : [];

  // Execute database writes inside a transaction with 30s timeout
  await prisma.$transaction(
    async (tx) => {
      if (toCreate.length > 0) {
        const createResult = await tx.job.createMany({
          data: toCreate,
          skipDuplicates: true,
        });
        jobsInserted = createResult.count;
      }

      for (const item of toUpdate) {
        await tx.job.update({
          where: { id: item.id },
          data: item.data,
        });
        jobsUpdated++;
      }

      if (staleJobs.length > 0) {
        const staleIds = staleJobs.map((j) => j.id);
        const delRes = await tx.job.deleteMany({
          where: { id: { in: staleIds } },
        });
        jobsDeleted = delRes.count;
        logger.info(
          { sourceId, count: jobsDeleted },
          'Reconciliation: Removed stale jobs no longer in current source payload'
        );
      }
    },
    { timeout: 30000 }
  );

  return {
    jobsFetched: normalisedJobs.length,
    jobsInserted,
    jobsUpdated,
    jobsSkipped,
    jobsDeleted,
  };
}

// Backward compatibility alias
export const upsertNormalizedJobs = (sourceId, jobs) => reconcileSourceJobs(sourceId, jobs, true);

export function getLastIngestionStatus() {
  return lastIngestionStatus;
}
