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

    await prisma.sourceHealth.updateMany({
      data: {
        status: 'HEALTHY',
        circuitState: 'CLOSED',
        consecutiveFailures: 0,
        cooldownUntil: null,
        lastError: null,
      },
    });

    return this.getHealthSummary();
  }

  // Checks if target source is eligible to accept outbound requests
  async canAttempt(sourceId, sourceName) {
    let health = await prisma.sourceHealth.findUnique({
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

    if (health.status === 'DISABLED') {
      return {
        allowed: false,
        reason: 'Source is manually disabled',
        status: 'DISABLED',
        circuitState: health.circuitState,
      };
    }

    const now = new Date();

    // Check if source is cooling down after receiving a rate limit
    if (health.status === 'RATE_LIMITED' && health.cooldownUntil && now < new Date(health.cooldownUntil)) {
      const remainingSec = Math.ceil((new Date(health.cooldownUntil).getTime() - now.getTime()) / 1000);
      return {
        allowed: false,
        reason: `Source is RATE_LIMITED (cooldown ${remainingSec}s remaining until ${new Date(health.cooldownUntil).toISOString()})`,
        status: 'RATE_LIMITED',
        circuitState: health.circuitState,
      };
    }

    // Check if source is cooling down after receiving access restriction
    if (health.status === 'UNAVAILABLE' && health.cooldownUntil && now < new Date(health.cooldownUntil)) {
      const remainingSec = Math.ceil((new Date(health.cooldownUntil).getTime() - now.getTime()) / 1000);
      return {
        allowed: false,
        reason: `Source Access RESTRICTED (cooldown ${remainingSec}s remaining)`,
        status: 'RESTRICTED',
        circuitState: health.circuitState,
      };
    }

    // Evaluate circuit state machine
    if (health.circuitState === 'OPEN') {
      if (health.cooldownUntil && now >= new Date(health.cooldownUntil)) {
        logger.info({ sourceName, sourceId }, 'Circuit breaker cooldown expired; setting HALF_OPEN state for trial request');
        await prisma.sourceHealth.update({
          where: { sourceId },
          data: { circuitState: 'HALF_OPEN' },
        });
        return { allowed: true, isHalfOpen: true, status: health.status, circuitState: 'HALF_OPEN' };
      }

      const remainingSec = health.cooldownUntil
        ? Math.ceil((new Date(health.cooldownUntil).getTime() - now.getTime()) / 1000)
        : 0;

      return {
        allowed: false,
        reason: `Circuit Breaker OPEN (${remainingSec}s cooldown remaining until ${health.cooldownUntil ? new Date(health.cooldownUntil).toISOString() : 'N/A'})`,
        status: 'CIRCUIT_OPEN',
        circuitState: 'OPEN',
      };
    }

    return {
      allowed: true,
      isHalfOpen: health.circuitState === 'HALF_OPEN',
      status: health.status,
      circuitState: health.circuitState,
    };
  }

  // Resets failures and transitions state to HEALTHY on successful ingestion
  async recordSuccess(sourceId, sourceName) {
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

    const sourceKey = sourceName.toLowerCase();
    sourceSessionService.updateSessionState(sourceKey, 'ACTIVE', 'Success');

    logger.info({ sourceName, sourceId }, 'Source health recorded SUCCESS -> status HEALTHY, circuit CLOSED');
  }

  // Increments failure count, calculates backoff, and trips circuit breaker if threshold is hit
  async recordFailure(sourceId, sourceName, err, httpStatus = null) {
    const health = await prisma.sourceHealth.findUnique({ where: { sourceId } });

    const consecutiveFailures = (health?.consecutiveFailures || 0) + 1;
    const totalFailures = (health?.totalFailures || 0) + 1;
    const now = new Date();
    const errorMsg = err.message || String(err);
    const sourceKey = sourceName.toLowerCase();

    let status = 'DEGRADED';
    let circuitState = health?.circuitState || 'CLOSED';
    let cooldownUntil = null;

    if (httpStatus === 429 || err.isHighFrequency) {
      status = 'RATE_LIMITED';
      let cooldownMs = RATE_LIMIT_BASE_MS;

      const retryAfterHeader = err.headers ? (err.headers['retry-after'] || err.headers['Retry-After']) : null;
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
      sourceSessionService.updateSessionState(sourceKey, 'DEGRADED', 'Rate limited');
    } else if (err.isRestricted || httpStatus === 403 || err.isCaptchaDetected) {
      status = 'UNAVAILABLE';
      cooldownUntil = new Date(now.getTime() + 120000);
      sourceSessionService.updateSessionState(sourceKey, 'RESTRICTED', err.isCaptchaDetected ? 'CAPTCHA challenge detected' : 'Access restricted');
    } else if (err.isHeaderAnomaly) {
      status = 'DEGRADED';
      sourceSessionService.updateSessionState(sourceKey, 'DEGRADED', 'Header anomaly detected');
    } else if (err.isSessionInconsistent) {
      status = 'DEGRADED';
      sourceSessionService.updateSessionState(sourceKey, 'DEGRADED', 'Session inconsistent');
    } else if (err.isSchemaError) {
      status = 'SCHEMA_ERROR';
    } else if (httpStatus === 503 || httpStatus === 502 || err.isNetworkError) {
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

    return { status, circuitState, consecutiveFailures, cooldownUntil };
  }

  // Returns combined health state, active overrides, and active cooldown countdowns
  async getHealthSummary() {
    const records = await prisma.sourceHealth.findMany({
      include: {
        source: { select: { id: true, name: true, type: true, enabled: true } },
      },
      orderBy: { source: { name: 'asc' } },
    });

    const now = new Date();

    return records.map((h) => {
      const override = sandboxService.getOverride(h.source.type);
      const simulationOverride = override
        ? String(override.type || override.failureType || 'HTTP_' + override.status).toUpperCase()
        : 'NONE';

      let effectiveStatus = h.status;
      let cooldownRemainingSec = 0;

      if (h.cooldownUntil && now < new Date(h.cooldownUntil)) {
        cooldownRemainingSec = Math.ceil((new Date(h.cooldownUntil).getTime() - now.getTime()) / 1000);
      }

      if (simulationOverride !== 'NONE') {
        effectiveStatus = `${h.status} (Override: ${simulationOverride})`;
      } else if (h.status === 'RATE_LIMITED' && cooldownRemainingSec === 0) {
        effectiveStatus = 'HEALTHY (Cooldown Expired)';
      }

      return {
        sourceId: h.sourceId,
        name: h.source.name,
        type: h.source.type,
        realStatus: h.status,
        simulationOverride,
        effectiveStatus,
        status: h.status,
        circuitState: h.circuitState,
        consecutiveFailures: h.consecutiveFailures,
        totalFailures: h.totalFailures,
        totalSuccesses: h.totalSuccesses,
        lastSuccessAt: h.lastSuccessAt,
        lastFailureAt: h.lastFailureAt,
        lastError: h.lastError,
        cooldownUntil: h.cooldownUntil,
        cooldownRemainingSec,
        updatedAt: h.updatedAt,
      };
    });
  }
}

export const circuitBreakerService = new CircuitBreakerService();
