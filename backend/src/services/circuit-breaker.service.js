import { PrismaClient } from '@prisma/client';
import { config } from '../config/env.js';
import { logger } from '../config/logger.js';
import { sandboxService } from './sandbox.service.js';
import { sourceSessionService } from './source-session.service.js';

const prisma = new PrismaClient();

const RATE_LIMIT_BASE_MS = parseInt(process.env.RATE_LIMIT_BASE_MS || '30000', 10);
const RATE_LIMIT_MAX_MS = parseInt(process.env.RATE_LIMIT_MAX_MS || '300000', 10);

// Tracks source health, exponential cooldown backoff, and circuit state transitions
class CircuitBreakerService {
  constructor() {
    this.threshold = config.circuitBreaker.failureThreshold || 3;
    this.cooldownMs = config.circuitBreaker.cooldownMs || 60000;
  }

  // Resets circuit state, clear overrides, and sets status back to HEALTHY
  async resetTestHealth() {
    logger.warn('Resetting test state & source health for all sources');
    sandboxService.clearOverrides();
    sourceSessionService.resetSessions();

    try {
      await prisma.sourceHealth.updateMany({
        data: {
          status: 'HEALTHY',
          circuitState: 'CLOSED',
          consecutiveFailures: 0,
          cooldownUntil: null,
          lastError: null,
        },
      });
    } catch (err) {
      logger.error({ err }, 'Failed to reset source health in database');
    }

    return this.getHealthSummary();
  }

  // Checks if target source is eligible to accept outbound requests
  async canAttempt(sourceId, sourceName) {
    if (!sourceId) {
      return { allowed: true, status: 'HEALTHY', circuitState: 'CLOSED' };
    }

    let health = null;
    try {
      health = await prisma.sourceHealth.findUnique({
        where: { sourceId },
      });

      if (!health) {
        health = await prisma.sourceHealth.create({
          data: {
            sourceId,
            status: 'HEALTHY',
            circuitState: 'CLOSED',
            consecutiveFailures: 0,
            totalFailures: 0,
            totalSuccesses: 0,
          },
        });
      }
    } catch (err) {
      logger.warn({ err, sourceId, sourceName }, 'Could not fetch/create SourceHealth record; defaulting to HEALTHY');
      return { allowed: true, status: 'HEALTHY', circuitState: 'CLOSED' };
    }

    if (health.status === 'DISABLED') {
      return {
        allowed: false,
        reason: 'Source is manually disabled',
        status: 'DISABLED',
        circuitState: health.circuitState || 'CLOSED',
      };
    }

    const now = new Date();
    const cooldownDate = health.cooldownUntil ? new Date(health.cooldownUntil) : null;
    const isCooldownValid = cooldownDate && !isNaN(cooldownDate.getTime());

    // Check if source is cooling down after receiving a rate limit
    if (health.status === 'RATE_LIMITED' && isCooldownValid && now < cooldownDate) {
      const remainingSec = Math.ceil((cooldownDate.getTime() - now.getTime()) / 1000);
      return {
        allowed: false,
        reason: `Source is RATE_LIMITED (cooldown ${remainingSec}s remaining until ${cooldownDate.toISOString()})`,
        status: 'RATE_LIMITED',
        circuitState: health.circuitState || 'CLOSED',
      };
    }

    // Check if source is cooling down after receiving access restriction
    if (health.status === 'UNAVAILABLE' && isCooldownValid && now < cooldownDate) {
      const remainingSec = Math.ceil((cooldownDate.getTime() - now.getTime()) / 1000);
      return {
        allowed: false,
        reason: `Source Access RESTRICTED (cooldown ${remainingSec}s remaining)`,
        status: 'RESTRICTED',
        circuitState: health.circuitState || 'CLOSED',
      };
    }

    // Evaluate circuit state machine
    if (health.circuitState === 'OPEN') {
      if (isCooldownValid && now >= cooldownDate) {
        logger.info({ sourceName, sourceId }, 'Circuit breaker cooldown expired; setting HALF_OPEN state for trial request');
        try {
          await prisma.sourceHealth.update({
            where: { sourceId },
            data: { circuitState: 'HALF_OPEN' },
          });
        } catch {
          // Ignored
        }
        return { allowed: true, isHalfOpen: true, status: health.status || 'HEALTHY', circuitState: 'HALF_OPEN' };
      }

      const remainingSec = isCooldownValid
        ? Math.ceil((cooldownDate.getTime() - now.getTime()) / 1000)
        : 0;

      return {
        allowed: false,
        reason: `Circuit Breaker OPEN (${remainingSec}s cooldown remaining)`,
        status: 'CIRCUIT_OPEN',
        circuitState: 'OPEN',
      };
    }

    return {
      allowed: true,
      isHalfOpen: health.circuitState === 'HALF_OPEN',
      status: health.status || 'HEALTHY',
      circuitState: health.circuitState || 'CLOSED',
    };
  }

  // Resets failures and transitions state to HEALTHY on successful ingestion
  async recordSuccess(sourceId, sourceName) {
    if (!sourceId) return;

    try {
      await prisma.sourceHealth.upsert({
        where: { sourceId },
        update: {
          status: 'HEALTHY',
          circuitState: 'CLOSED',
          consecutiveFailures: 0,
          totalSuccesses: { increment: 1 },
          lastSuccessAt: new Date(),
          lastError: null,
          cooldownUntil: null,
        },
        create: {
          sourceId,
          status: 'HEALTHY',
          circuitState: 'CLOSED',
          consecutiveFailures: 0,
          totalSuccesses: 1,
          lastSuccessAt: new Date(),
        },
      });
    } catch (err) {
      logger.error({ err, sourceId, sourceName }, 'Failed to record success in SourceHealth');
    }

    const sourceKey = (sourceName || '').toLowerCase();
    if (sourceKey) {
      sourceSessionService.updateSessionState(sourceKey, 'ACTIVE', 'Success');
    }

    logger.info({ sourceName, sourceId }, 'Source health recorded SUCCESS -> status HEALTHY, circuit CLOSED');
  }

  // Increments failure count, calculates backoff, and trips circuit breaker if threshold is hit
  async recordFailure(sourceId, sourceName, err, httpStatus = null) {
    if (!sourceId) return;

    let health = null;
    try {
      health = await prisma.sourceHealth.findUnique({ where: { sourceId } });
    } catch {
      // Ignored
    }

    const consecutiveFailures = (health?.consecutiveFailures || 0) + 1;
    const totalFailures = (health?.totalFailures || 0) + 1;
    const now = new Date();
    const errorMsg = err?.message || String(err || 'Unknown error');
    const sourceKey = (sourceName || '').toLowerCase();

    let status = 'DEGRADED';
    let circuitState = health?.circuitState || 'CLOSED';
    let cooldownUntil = null;

    if (httpStatus === 429 || err?.isHighFrequency) {
      status = 'RATE_LIMITED';
      let cooldownMs = RATE_LIMIT_BASE_MS;

      const retryAfterHeader = err?.headers ? (err.headers['retry-after'] || err.headers['Retry-After']) : null;
      if (retryAfterHeader) {
        const parsedSec = parseInt(retryAfterHeader, 10);
        if (!isNaN(parsedSec)) {
          cooldownMs = parsedSec * 1000;
        } else {
          const dateMs = new Date(retryAfterHeader).getTime();
          if (!isNaN(dateMs)) {
            cooldownMs = Math.max(1000, dateMs - now.getTime());
          }
        }
      } else {
        cooldownMs = Math.min(
          RATE_LIMIT_BASE_MS * Math.pow(2, Math.max(0, consecutiveFailures - 1)),
          RATE_LIMIT_MAX_MS
        );
      }

      cooldownUntil = new Date(now.getTime() + cooldownMs);
      if (sourceKey) sourceSessionService.updateSessionState(sourceKey, 'DEGRADED', 'Rate limited');
    } else if (err?.isRestricted || httpStatus === 403 || err?.isCaptchaDetected) {
      status = 'UNAVAILABLE';
      cooldownUntil = new Date(now.getTime() + 120000);
      if (sourceKey) sourceSessionService.updateSessionState(sourceKey, 'RESTRICTED', err.isCaptchaDetected ? 'CAPTCHA challenge detected' : 'Access restricted');
    } else if (err?.isHeaderAnomaly) {
      status = 'DEGRADED';
      if (sourceKey) sourceSessionService.updateSessionState(sourceKey, 'DEGRADED', 'Header anomaly detected');
    } else if (err?.isSessionInconsistent) {
      status = 'DEGRADED';
      if (sourceKey) sourceSessionService.updateSessionState(sourceKey, 'DEGRADED', 'Session inconsistent');
    } else if (err?.isSchemaError) {
      status = 'SCHEMA_ERROR';
    } else if (httpStatus === 503 || httpStatus === 502 || err?.isNetworkError) {
      status = 'UNAVAILABLE';
    } else {
      status = 'DEGRADED';
    }

    if (consecutiveFailures >= this.threshold) {
      circuitState = 'OPEN';
      if (!cooldownUntil) {
        cooldownUntil = new Date(now.getTime() + this.cooldownMs);
      }
    }

    try {
      await prisma.sourceHealth.upsert({
        where: { sourceId },
        update: {
          status,
          circuitState,
          consecutiveFailures,
          totalFailures,
          failureCount: consecutiveFailures,
          lastFailureAt: now,
          lastError: errorMsg,
          cooldownUntil,
        },
        create: {
          sourceId,
          status,
          circuitState,
          consecutiveFailures,
          totalFailures: 1,
          failureCount: 1,
          lastFailureAt: now,
          lastError: errorMsg,
          cooldownUntil,
        },
      });
    } catch (dbErr) {
      logger.error({ dbErr, sourceId }, 'Failed to record failure in SourceHealth');
    }

    return { status, circuitState, consecutiveFailures, cooldownUntil };
  }

  // Returns combined health state, active overrides, and active cooldown countdowns
  async getHealthSummary() {
    let sources = [];
    try {
      sources = await prisma.source.findMany();
    } catch (err) {
      logger.error({ err }, 'Failed to load Sources for health summary');
      return [];
    }

    let records = [];
    try {
      records = await prisma.sourceHealth.findMany({
        include: {
          source: { select: { id: true, name: true, type: true, enabled: true } },
        },
      });
    } catch (err) {
      logger.error({ err }, 'Failed to load SourceHealth records');
    }

    const recordsBySourceId = new Map(records.map((r) => [r.sourceId, r]));
    const now = new Date();

    const result = [];
    for (const src of sources) {
      let h = recordsBySourceId.get(src.id);
      if (!h) {
        h = {
          sourceId: src.id,
          status: 'HEALTHY',
          circuitState: 'CLOSED',
          consecutiveFailures: 0,
          totalFailures: 0,
          totalSuccesses: 0,
          source: src,
        };
      }

      const override = sandboxService.getOverride(src.type);
      const simulationOverride = override && override.type && override.type !== 'none'
        ? String(override.type || override.failureType || 'HTTP_' + override.status).toUpperCase()
        : 'NONE';

      let effectiveStatus = h.status || 'HEALTHY';
      let cooldownRemainingSec = 0;

      const cooldownDate = h.cooldownUntil ? new Date(h.cooldownUntil) : null;
      if (cooldownDate && !isNaN(cooldownDate.getTime()) && now < cooldownDate) {
        cooldownRemainingSec = Math.ceil((cooldownDate.getTime() - now.getTime()) / 1000);
      }

      if (simulationOverride !== 'NONE') {
        effectiveStatus = `${h.status || 'HEALTHY'} (Override: ${simulationOverride})`;
      } else if (h.status === 'RATE_LIMITED' && cooldownRemainingSec === 0) {
        effectiveStatus = 'HEALTHY (Cooldown Expired)';
      }

      result.push({
        sourceId: src.id,
        name: src.name,
        type: src.type,
        realStatus: h.status || 'HEALTHY',
        simulationOverride,
        effectiveStatus,
        status: h.status || 'HEALTHY',
        circuitState: h.circuitState || 'CLOSED',
        consecutiveFailures: h.consecutiveFailures || 0,
        totalFailures: h.totalFailures || 0,
        totalSuccesses: h.totalSuccesses || 0,
        lastSuccessAt: h.lastSuccessAt ? new Date(h.lastSuccessAt).toISOString() : null,
        lastFailureAt: h.lastFailureAt ? new Date(h.lastFailureAt).toISOString() : null,
        lastError: h.lastError || null,
        cooldownUntil: h.cooldownUntil ? new Date(h.cooldownUntil).toISOString() : null,
        cooldownRemainingSec,
        updatedAt: h.updatedAt ? new Date(h.updatedAt).toISOString() : new Date().toISOString(),
      });
    }

    return result;
  }
}

export const circuitBreakerService = new CircuitBreakerService();
