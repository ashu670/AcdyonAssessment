import { logger } from '../config/logger.js';

// Enforces per-source rate limits, request intervals, and concurrency limits
class RequestGovernanceService {
  constructor() {
    this.config = {
      minIntervalMs: parseInt(process.env.SOURCE_MIN_INTERVAL_MS || '200', 10),
      maxRequestsPerMin: parseInt(process.env.SOURCE_MAX_REQUESTS_PER_MINUTE || '100', 10),
      maxConcurrency: parseInt(process.env.SOURCE_MAX_CONCURRENCY || '1', 10),
      userAgent: 'JobPulse/1.0 (+https://jobpulse.dev/docs)',
    };
    this.sourceState = new Map();
  }

  // Returns or initializes sliding window state for target source
  _getOrCreateState(sourceKey) {
    const key = String(sourceKey).toLowerCase();
    const now = Date.now();

    if (!this.sourceState.has(key)) {
      this.sourceState.set(key, {
        requestsMade: 0,
        windowStartedAt: now,
        currentConcurrency: 0,
        lastRequestTime: 0,
      });
    }

    const state = this.sourceState.get(key);

    // Reset rate counter every 60 seconds
    if (now - state.windowStartedAt >= 60000) {
      state.requestsMade = 0;
      state.windowStartedAt = now;
    }

    return state;
  }

  // Validates current request against budget and active concurrency limits
  canMakeRequest(sourceKey, sourceName = '') {
    const state = this._getOrCreateState(sourceKey);
    const requestsAllowed = this.config.maxRequestsPerMin;
    const requestsRemaining = Math.max(0, requestsAllowed - state.requestsMade);

    if (state.requestsMade >= requestsAllowed) {
      logger.warn(
        { sourceKey, sourceName, requestsMade: state.requestsMade, limit: requestsAllowed },
        'Request Governance: Budget EXHAUSTED for 60s window'
      );
      return {
        allowed: false,
        reason: 'REQUEST_BUDGET_EXHAUSTED',
        budget: {
          requestsMade: state.requestsMade,
          requestsAllowed,
          requestsRemaining: 0,
          windowStartedAt: state.windowStartedAt,
          minIntervalMs: this.config.minIntervalMs,
          maxConcurrency: this.config.maxConcurrency,
        },
      };
    }

    if (state.currentConcurrency >= this.config.maxConcurrency) {
      logger.warn(
        { sourceKey, sourceName, concurrency: state.currentConcurrency, max: this.config.maxConcurrency },
        'Request Governance: Concurrency limit reached'
      );
      return {
        allowed: false,
        reason: 'CONCURRENCY_LIMIT_REACHED',
        budget: {
          requestsMade: state.requestsMade,
          requestsAllowed,
          requestsRemaining,
          windowStartedAt: state.windowStartedAt,
          minIntervalMs: this.config.minIntervalMs,
          maxConcurrency: this.config.maxConcurrency,
        },
      };
    }

    return {
      allowed: true,
      reason: 'BUDGET_AVAILABLE',
      budget: {
        requestsMade: state.requestsMade,
        requestsAllowed,
        requestsRemaining,
        windowStartedAt: state.windowStartedAt,
        minIntervalMs: this.config.minIntervalMs,
        maxConcurrency: this.config.maxConcurrency,
      },
    };
  }

  // Delays execution if min interval threshold is not met, then increments slots
  async acquireSlot(sourceKey, sourceName = '') {
    const state = this._getOrCreateState(sourceKey);
    const now = Date.now();

    const timeSinceLast = now - state.lastRequestTime;
    if (timeSinceLast < this.config.minIntervalMs) {
      const waitMs = this.config.minIntervalMs - timeSinceLast;
      await new Promise((r) => setTimeout(r, waitMs));
    }

    state.requestsMade += 1;
    state.currentConcurrency += 1;
    state.lastRequestTime = Date.now();

    logger.debug(
      {
        sourceKey,
        requestsMade: state.requestsMade,
        requestsRemaining: this.config.maxRequestsPerMin - state.requestsMade,
      },
      'Request Governance: Slot acquired'
    );
  }

  // Decrements active concurrency counter
  releaseSlot(sourceKey) {
    const state = this._getOrCreateState(sourceKey);
    state.currentConcurrency = Math.max(0, state.currentConcurrency - 1);
  }

  // Generates unique request context metadata for log tracing
  createRequestContext(sourceKey, sessionId = null, attemptNumber = 1) {
    const requestId = `req_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    return {
      requestId,
      sourceId: sourceKey,
      timestamp: new Date().toISOString(),
      sessionId: sessionId || `sess_${sourceKey}_default`,
      attemptNumber,
      userAgent: this.config.userAgent,
    };
  }

  // Returns snapshot of governance metrics for all sources
  getGovernanceSummary() {
    const now = Date.now();
    const result = {};

    const sources = ['greenhouse', 'lever', 'ashby', 'arbeitnow'];
    for (const key of sources) {
      const state = this._getOrCreateState(key);
      const requestsAllowed = this.config.maxRequestsPerMin;
      const requestsRemaining = Math.max(0, requestsAllowed - state.requestsMade);
      const windowAgeSec = Math.floor((now - state.windowStartedAt) / 1000);

      result[key] = {
        minIntervalMs: this.config.minIntervalMs,
        requestsMade: state.requestsMade,
        requestsAllowed,
        requestsRemaining,
        concurrency: state.currentConcurrency,
        maxConcurrency: this.config.maxConcurrency,
        windowAgeSec,
        userAgent: this.config.userAgent,
        status: state.requestsMade >= requestsAllowed ? 'BUDGET_EXHAUSTED' : 'BUDGET_OK',
      };
    }

    return result;
  }

  // Flushes state map for unit testing
  resetGovernance() {
    this.sourceState.clear();
    logger.info('Request Governance reset complete');
  }
}

export const requestGovernanceService = new RequestGovernanceService();
