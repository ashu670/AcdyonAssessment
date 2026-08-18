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

// Upserts active listings and reconciles stale jobs inside an atomic transaction
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

  const fetchedExternalIds = new Set(validJobs.map((j) => j.externalId));

  // Atomic database upsert and stale-record deletion
  await prisma.$transaction(async (tx) => {
    // Upsert valid jobs based on content hash
    for (const job of validJobs) {
      const hashInput = [
        job.title,
        job.company,
        job.location ?? '',
        job.description ?? '',
      ].join('|');
      const contentHash = computeHash(hashInput);

      const existing = await tx.job.findUnique({
        where: {
          sourceId_externalId: {
            sourceId,
            externalId: job.externalId,
          },
        },
        select: { id: true, contentHash: true },
      });

      if (!existing) {
        await tx.job.create({
          data: {
            sourceId,
            externalId: job.externalId,
            title: job.title,
            company: job.company,
            location: job.location,
            description: job.description,
            url: job.url,
            postedAt: job.postedAt,
            contentHash,
          },
        });
        jobsInserted++;
      } else if (existing.contentHash !== contentHash) {
        await tx.job.update({
          where: { id: existing.id },
          data: {
            title: job.title,
            company: job.company,
            location: job.location,
            description: job.description,
            url: job.url,
            postedAt: job.postedAt,
            contentHash,
          },
        });
        jobsUpdated++;
      } else {
        jobsSkipped++;
      }
    }

    // Reconcile and purge stale source records if fetch was 100% complete
    if (isComplete) {
      const existingSourceJobs = await tx.job.findMany({
        where: { sourceId },
        select: { id: true, externalId: true },
      });

      const staleJobs = existingSourceJobs.filter((j) => !fetchedExternalIds.has(j.externalId));
      if (staleJobs.length > 0) {
        const staleIds = staleJobs.map((j) => j.id);
        const delRes = await tx.job.deleteMany({
          where: { id: { in: staleIds } },
        });
        jobsDeleted = delRes.count;
        logger.info(
          { sourceId, count: jobsDeleted },
          'Reconciliation: Removed jobs no longer listed in latest complete source response'
        );
      }
    } else {
      logger.warn(
        { sourceId },
        'Reconciliation SKIPPED: Source fetch was marked incomplete or partial. Preserving existing DB jobs.'
      );
    }
  });

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
