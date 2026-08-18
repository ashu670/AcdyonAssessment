import { logger } from '../config/logger.js';

// Manages controlled failure and anti-bot detection overrides for testing pipeline fallbacks
class SandboxService {
  constructor() {
    this.overrides = new Map();
  }

  // Registers simulation override for source
  setOverride(sourceType, override) {
    const key = String(sourceType).toLowerCase().trim();
    this.overrides.set(key, override);
    logger.warn({ sourceType: key, override }, 'Failure & AntiBot Lab override set');
  }

  // Removes active override for single source
  removeOverride(sourceType) {
    const key = String(sourceType).toLowerCase().trim();
    this.overrides.delete(key);
    logger.info({ sourceType: key }, 'Failure & AntiBot Lab override removed');
  }

  // Clears all simulation overrides
  clearOverrides() {
    this.overrides.clear();
    logger.info('All AntiBot Lab overrides cleared');
  }

  // Retrieves active override by source key
  getOverride(sourceType) {
    const key = String(sourceType).toLowerCase().trim();
    if (key === 'backup' || key === 'arbeitnow') {
      return this.overrides.get('arbeitnow') || this.overrides.get('backup') || null;
    }
    return this.overrides.get(key) || null;
  }

  // Exports map of active overrides
  getAllOverrides() {
    const result = {};
    for (const [key, value] of this.overrides.entries()) {
      result[key] = value;
    }
    return result;
  }

  // Invoked inside source adapters to inject controlled synthetic errors
  simulateFailure(override, sourceName) {
    const type = String(override.type || override.failureType || '').toLowerCase();

    if (type === 'none') {
      return;
    }

    if (type === '429' || override.status === 429) {
      const err = new Error(`${sourceName} API returned HTTP 429: Too Many Requests (Rate Limited) (Simulated)`);
      err.status = 429;
      err.headers = { 'retry-after': String(override.retryAfter || 30) };
      throw err;
    }

    if (type === '403' || type === 'restricted' || override.status === 403) {
      const err = new Error(`${sourceName} API returned HTTP 403: Source Access Restricted (Simulated Detection)`);
      err.status = 403;
      err.isRestricted = true;
      throw err;
    }

    if (type === 'captcha') {
      const err = new Error(`${sourceName} returned CAPTCHA Challenge Page (Simulated AntiBot Detection)`);
      err.status = 403;
      err.isCaptchaDetected = true;
      err.isRestricted = true;
      throw err;
    }

    if (type === 'high_frequency') {
      const err = new Error(`${sourceName} request frequency exceeded threshold: REQUEST_FREQUENCY_TOO_HIGH (Simulated)`);
      err.status = 429;
      err.headers = { 'retry-after': '30' };
      err.isHighFrequency = true;
      throw err;
    }

    if (type === 'header_anomaly') {
      const err = new Error(`${sourceName} rejected client request: HEADER_ANOMALY (Missing or Invalid User-Agent) (Simulated)`);
      err.status = 400;
      err.isHeaderAnomaly = true;
      throw err;
    }

    if (type === 'session_inconsistent') {
      const err = new Error(`${sourceName} session context invalid: SESSION_INCONSISTENT (Simulated Session Failure)`);
      err.status = 401;
      err.isSessionInconsistent = true;
      throw err;
    }

    if (type === '500' || override.status === 500) {
      const err = new Error(`${sourceName} API returned HTTP 500: Internal Server Error (Simulated)`);
      err.status = 500;
      throw err;
    }

    if (type === 'timeout') {
      const err = new Error(`${sourceName} request timed out (Simulated Timeout)`);
      err.status = 504;
      throw err;
    }

    if (type === 'connection_refused' || type === 'network_error') {
      const err = new Error(`Network connection refused to ${sourceName} (Simulated Connection Error)`);
      err.status = 503;
      err.isNetworkError = true;
      throw err;
    }

    if (type === 'malformed_schema' || type === 'schema_error' || type === 'schema_drift') {
      const err = new Error(`${sourceName} returned malformed payload or schema drift (Simulated Schema Error)`);
      err.status = 422;
      err.isSchemaError = true;
      throw err;
    }

    const err = new Error(`${sourceName} encountered simulated event (${type})`);
    err.status = override.status || 500;
    throw err;
  }
}

export const sandboxService = new SandboxService();
