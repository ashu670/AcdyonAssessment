import { PrismaClient } from '@prisma/client';
import { GreenhouseAdapter } from '../sources/greenhouse/greenhouse.adapter.js';
import { LeverAdapter } from '../sources/lever/lever.adapter.js';
import { AshbyAdapter } from '../sources/ashby/ashby.adapter.js';
import { ArbeitnowAdapter } from '../sources/arbeitnow/arbeitnow.adapter.js';
import { reconcileSourceJobs, cleanUpFakeJobs } from './ingestion.service.js';
import { circuitBreakerService } from './circuit-breaker.service.js';
import { requestGovernanceService } from './request-governance.service.js';
import { sourceSessionService } from './source-session.service.js';
import { logger } from '../config/logger.js';

const prisma = new PrismaClient();

const MAX_RETRIES = parseInt(process.env.MAX_RETRIES || '2', 10);

// Priority sequence of supported ATS sources and backup job board
const SOURCE_DEFINITIONS = [
  {
    name: 'Greenhouse',
    type: 'greenhouse',
    baseUrl: 'https://boards-api.greenhouse.io/v1/boards',
    adapterFactory: () => new GreenhouseAdapter(),
  },
  {
    name: 'Lever',
    type: 'lever',
    baseUrl: 'https://api.lever.co/v0/postings',
    adapterFactory: () => new LeverAdapter(),
  },
  {
    name: 'Ashby',
    type: 'ashby',
    baseUrl: 'https://api.ashbyhq.com/posting-api/job-board',
    adapterFactory: () => new AshbyAdapter(),
  },
  {
    name: 'Arbeitnow',
    type: 'arbeitnow',
    baseUrl: 'https://www.arbeitnow.com/api/job-board-api',
    adapterFactory: () => new ArbeitnowAdapter(),
  },
];

// Executes multi-source ingestion run with request governance, failover, and job reconciliation
export async function runOrchestratedIngestion(requestId = `req_${Date.now()}`) {
  const startedAt = new Date();
  logger.info({ requestId }, 'Starting resilient multi-source ingestion run with Request Governance');

  // Purge legacy fake jobs containing example.com URLs
  try {
    await cleanUpFakeJobs();
  } catch (err) {
    logger.warn({ err }, 'Fake jobs cleanup encountered error (non-fatal)');
  }

  // Synchronize source entries in database
  const dbSourcesMap = new Map();
  for (const def of SOURCE_DEFINITIONS) {
    try {
      const src = await prisma.source.upsert({
        where: { name: def.name },
        update: { enabled: true, baseUrl: def.baseUrl, type: def.type },
        create: {
          name: def.name,
          type: def.type,
          baseUrl: def.baseUrl,
          enabled: true,
        },
      });
      dbSourcesMap.set(def.name, src);
    } catch (err) {
      logger.error({ err, sourceName: def.name }, 'Source upsert failed during orchestration init');
      const existing = await prisma.source.findFirst({ where: { type: def.type } });
      if (existing) {
        dbSourcesMap.set(def.name, existing);
      }
    }
  }

  // Create active run record
  let runRecord = null;
  try {
    runRecord = await prisma.ingestionRun.create({
      data: {
        startedAt,
        status: 'running',
      },
    });
  } catch (err) {
    logger.error({ err }, 'Failed to create IngestionRun record');
  }

  const runRecordId = runRecord ? runRecord.id : null;
  const attemptedSources = [];
  let successfulSource = null;
  let successfulStats = { jobsFetched: 0, jobsInserted: 0, jobsUpdated: 0, jobsSkipped: 0, jobsDeleted: 0 };

  // Iterate sources in priority sequence
  for (const def of SOURCE_DEFINITIONS) {
    const dbSource = dbSourcesMap.get(def.name);
    const sourceStartMs = Date.now();

    if (!dbSource) {
      logger.warn({ sourceName: def.name }, 'DB Source record missing; skipping source attempt');
      continue;
    }

    // Check circuit breaker and cooldown health
    let canAttempt = { allowed: true, status: 'HEALTHY' };
    try {
      canAttempt = await circuitBreakerService.canAttempt(dbSource.id, def.name);
    } catch (err) {
      logger.warn({ err, source: def.name }, 'Error checking circuit breaker state; defaulting to allowed');
    }

    if (!canAttempt.allowed) {
      logger.warn(
        { source: def.name, reason: canAttempt.reason, status: canAttempt.status, requestId },
        'Skipping source during health cooldown'
      );

      const statusKey = canAttempt.status === 'RATE_LIMITED' ? 'rate_limited' : 'circuit_open';

      if (runRecordId) {
        try {
          await prisma.ingestionRunSource.create({
            data: {
              runId: runRecordId,
              sourceId: dbSource.id,
              status: statusKey,
              error: canAttempt.reason,
              durationMs: Date.now() - sourceStartMs,
            },
          });
        } catch {
          // Ignored
        }
      }

      attemptedSources.push({
        source: def.type,
        name: def.name,
        status: statusKey,
        error: canAttempt.reason,
        jobsFetched: 0,
        jobsInserted: 0,
        jobsUpdated: 0,
        jobsSkipped: 0,
        jobsDeleted: 0,
        durationMs: Date.now() - sourceStartMs,
      });

      continue;
    }

    // Check proactive rate budget and max concurrency limits
    let governanceCheck = { allowed: true };
    try {
      governanceCheck = requestGovernanceService.canMakeRequest(def.type, def.name);
    } catch {
      // Ignored
    }

    if (!governanceCheck.allowed) {
      logger.warn(
        { source: def.name, reason: governanceCheck.reason, requestId },
        'Skipping source: Request Governance budget exhausted or concurrency limit hit'
      );

      if (runRecordId) {
        try {
          await prisma.ingestionRunSource.create({
            data: {
              runId: runRecordId,
              sourceId: dbSource.id,
              status: 'budget_exhausted',
              error: `Request Governance: ${governanceCheck.reason}`,
              durationMs: Date.now() - sourceStartMs,
            },
          });
        } catch {
          // Ignored
        }
      }

      attemptedSources.push({
        source: def.type,
        name: def.name,
        status: 'budget_exhausted',
        error: `Request Governance: ${governanceCheck.reason}`,
        jobsFetched: 0,
        jobsInserted: 0,
        jobsUpdated: 0,
        jobsSkipped: 0,
        jobsDeleted: 0,
        durationMs: Date.now() - sourceStartMs,
      });

      continue;
    }

    // Attempt fetch with request context and retries
    let attemptSuccess = false;
    let lastError = null;

    for (let attempt = 1; attempt <= MAX_RETRIES + 1; attempt++) {
      const adapter = def.adapterFactory();
      const session = sourceSessionService.getOrCreateSession(def.type);
      const reqContext = requestGovernanceService.createRequestContext(def.type, session.sessionId, attempt);

      try {
        await requestGovernanceService.acquireSlot(def.type, def.name);

        logger.info(
          { requestId: reqContext.requestId, source: def.name, attempt, userAgent: reqContext.userAgent },
          'Executing governed outbound request'
        );

        const rawData = await adapter.fetchJobs();
        const normalisedJobs = adapter.parseJobs(rawData);

        // Upsert jobs and reconcile stale records
        const stats = await reconcileSourceJobs(dbSource.id, normalisedJobs, true);
        const durationMs = Date.now() - sourceStartMs;

        // Record successful run in health manager
        await circuitBreakerService.recordSuccess(dbSource.id, def.name);

        // Save attempt details
        if (runRecordId) {
          try {
            await prisma.ingestionRunSource.create({
              data: {
                runId: runRecordId,
                sourceId: dbSource.id,
                status: 'success',
                jobsFetched: stats.jobsFetched,
                jobsInserted: stats.jobsInserted,
                jobsUpdated: stats.jobsUpdated,
                jobsSkipped: stats.jobsSkipped,
                jobsDeleted: stats.jobsDeleted,
                durationMs,
              },
            });
          } catch {
            // Ignored
          }
        }

        attemptedSources.push({
          source: def.type,
          name: def.name,
          status: 'success',
          requestId: reqContext.requestId,
          jobsFetched: stats.jobsFetched,
          jobsInserted: stats.jobsInserted,
          jobsUpdated: stats.jobsUpdated,
          jobsSkipped: stats.jobsSkipped,
          jobsDeleted: stats.jobsDeleted,
          durationMs,
        });

        successfulSource = def.type;
        successfulStats = stats;
        attemptSuccess = true;

        logger.info(
          { source: def.name, requestId: reqContext.requestId, jobsFetched: stats.jobsFetched, durationMs },
          'Source ingestion SUCCESS & RECONCILED — stopping fallback sequence'
        );

        break;
      } catch (err) {
        lastError = err;
        const httpStatus = err.status || null;
        const isTransient =
          httpStatus === 429 ||
          httpStatus === 500 ||
          httpStatus === 502 ||
          httpStatus === 503 ||
          httpStatus === 504 ||
          (err.message && err.message.includes('timed out')) ||
          err.isNetworkError;

        if (isTransient && attempt <= MAX_RETRIES && !err.isCaptchaDetected && !err.isRestricted) {
          const delayMs = Math.pow(2, attempt) * 100;
          logger.warn(
            { source: def.name, attempt, max: MAX_RETRIES, delayMs, error: err.message, requestId },
            'Transient error encountered, retrying governed request...'
          );
          await new Promise((r) => setTimeout(r, delayMs));
          continue;
        }

        break;
      } finally {
        requestGovernanceService.releaseSlot(def.type);
      }
    }

    if (attemptSuccess) {
      // Mark remaining fallback sources as NOT ATTEMPTED
      const currentIndex = SOURCE_DEFINITIONS.findIndex((s) => s.type === def.type);
      for (let i = currentIndex + 1; i < SOURCE_DEFINITIONS.length; i++) {
        const remainingDef = SOURCE_DEFINITIONS[i];
        attemptedSources.push({
          source: remainingDef.type,
          name: remainingDef.name,
          status: 'not_attempted',
          error: 'Primary source succeeded (Fallback not required)',
          jobsFetched: 0,
          jobsInserted: 0,
          jobsUpdated: 0,
          jobsSkipped: 0,
          jobsDeleted: 0,
          durationMs: 0,
        });
      }
      break;
    }

    // Source failed after retries; classify error and failover
    const durationMs = Date.now() - sourceStartMs;
    const httpStatus = lastError?.status || null;

    let errorStatus = 'error';
    if (lastError?.isCaptchaDetected) {
      errorStatus = 'captcha_detected';
    } else if (lastError?.isRestricted || httpStatus === 403) {
      errorStatus = 'restricted';
    } else if (lastError?.isHighFrequency) {
      errorStatus = 'high_frequency';
    } else if (lastError?.isHeaderAnomaly) {
      errorStatus = 'header_anomaly';
    } else if (lastError?.isSessionInconsistent) {
      errorStatus = 'session_inconsistent';
    } else if (httpStatus === 429) {
      errorStatus = 'rate_limited';
    } else if (lastError?.message?.includes('timed out') || httpStatus === 504) {
      errorStatus = 'timeout';
    } else if (lastError?.isNetworkError || httpStatus === 503 || httpStatus === 502) {
      errorStatus = 'network_error';
    } else if (lastError?.isSchemaError || httpStatus === 422) {
      errorStatus = 'schema_error';
    } else if (httpStatus && httpStatus >= 400) {
      errorStatus = 'http_error';
    }

    logger.error(
      { source: def.name, error: lastError?.message, status: errorStatus, httpStatus, requestId },
      'Source ingestion FAILED — proceeding to next fallback source'
    );

    // Record failure penalty in circuit breaker
    try {
      await circuitBreakerService.recordFailure(dbSource.id, def.name, lastError, httpStatus);
    } catch {
      // Ignored
    }

    // Record attempt details
    if (runRecordId) {
      try {
        await prisma.ingestionRunSource.create({
          data: {
            runId: runRecordId,
            sourceId: dbSource.id,
            status: errorStatus,
            httpStatus,
            error: lastError?.message || String(lastError || 'Error'),
            durationMs,
          },
        });
      } catch {
        // Ignored
      }
    }

    attemptedSources.push({
      source: def.type,
      name: def.name,
      status: errorStatus,
      httpStatus,
      error: lastError?.message || String(lastError || 'Error'),
      jobsFetched: 0,
      jobsInserted: 0,
      jobsUpdated: 0,
      jobsSkipped: 0,
      jobsDeleted: 0,
      durationMs,
    });
  }

  // Save final execution outcome
  const finishedAt = new Date();
  let totalJobsStored = 0;
  try {
    totalJobsStored = await prisma.job.count();
  } catch (err) {
    logger.error({ err }, 'Error counting total stored jobs');
  }

  if (successfulSource) {
    if (runRecordId) {
      try {
        await prisma.ingestionRun.update({
          where: { id: runRecordId },
          data: {
            finishedAt,
            status: 'success',
            finalSource: successfulSource,
            totalJobs: successfulStats.jobsFetched,
          },
        });
      } catch {
        // Ignored
      }
    }

    return {
      status: 'success',
      sourceUsed: successfulSource,
      attemptedSources,
      summary: {
        jobsFetched: successfulStats.jobsFetched,
        jobsInserted: successfulStats.jobsInserted,
        jobsUpdated: successfulStats.jobsUpdated,
        jobsSkipped: successfulStats.jobsSkipped,
        jobsDeleted: successfulStats.jobsDeleted,
        totalJobsStored,
      },
      durationMs: finishedAt.getTime() - startedAt.getTime(),
    };
  } else {
    if (runRecordId) {
      try {
        await prisma.ingestionRun.update({
          where: { id: runRecordId },
          data: {
            finishedAt,
            status: 'all_failed',
            finalSource: null,
            totalJobs: 0,
          },
        });
      } catch {
        // Ignored
      }
    }

    return {
      status: 'failed',
      reason: 'ALL_SOURCES_UNAVAILABLE',
      attemptedSources,
      summary: {
        jobsFetched: 0,
        jobsInserted: 0,
        jobsUpdated: 0,
        jobsSkipped: 0,
        jobsDeleted: 0,
        totalJobsStored,
      },
      durationMs: finishedAt.getTime() - startedAt.getTime(),
    };
  }
}

// Fetches paginated history of ingestion runs
export async function getIngestionRunHistory({ page = 1, limit = 10 } = {}) {
  const safePage = Math.max(1, page);
  const safeLimit = Math.min(Math.max(1, limit), 50);
  const skip = (safePage - 1) * safeLimit;

  const [total, runs] = await Promise.all([
    prisma.ingestionRun.count(),
    prisma.ingestionRun.findMany({
      skip,
      take: safeLimit,
      orderBy: { startedAt: 'desc' },
      include: {
        sources: {
          include: { source: { select: { name: true, type: true } } },
          orderBy: { attemptedAt: 'asc' },
        },
      },
    }),
  ]);

  return {
    data: runs.map((r) => ({
      id: r.id,
      startedAt: r.startedAt,
      finishedAt: r.finishedAt,
      status: r.status,
      finalSource: r.finalSource,
      totalJobs: r.totalJobs,
      attempts: r.sources.map((s) => ({
        source: s.source.type,
        name: s.source.name,
        status: s.status,
        httpStatus: s.httpStatus,
        jobsFetched: s.jobsFetched,
        jobsInserted: s.jobsInserted,
        jobsUpdated: s.jobsUpdated,
        jobsSkipped: s.jobsSkipped,
        jobsDeleted: s.jobsDeleted || 0,
        error: s.error,
        durationMs: s.durationMs,
      })),
    })),
    pagination: {
      page: safePage,
      limit: safeLimit,
      total,
    },
  };
}

// Fetches run record by ID
export async function getIngestionRunById(id) {
  const r = await prisma.ingestionRun.findUnique({
    where: { id },
    include: {
      sources: {
        include: { source: { select: { name: true, type: true } } },
        orderBy: { attemptedAt: 'asc' },
      },
    },
  });

  if (!r) return null;

  return {
    id: r.id,
    startedAt: r.startedAt,
    finishedAt: r.finishedAt,
    status: r.status,
    finalSource: r.finalSource,
    totalJobs: r.totalJobs,
    attempts: r.sources.map((s) => ({
      source: s.source.type,
      name: s.source.name,
      status: s.status,
      httpStatus: s.httpStatus,
      jobsFetched: s.jobsFetched,
      jobsInserted: s.jobsInserted,
      jobsUpdated: s.jobsUpdated,
      jobsSkipped: s.jobsSkipped,
      jobsDeleted: s.jobsDeleted || 0,
      error: s.error,
      durationMs: s.durationMs,
    })),
  };
}
