import { SourceAdapter } from '../source.interface.js';
import { parseArbeitnowResponse, normalizeArbeitnowJob } from './arbeitnow.parser.js';
import { logger } from '../../config/logger.js';
import { sandboxService } from '../../services/sandbox.service.js';

const API_URL = 'https://www.arbeitnow.com/api/job-board-api';

// Adapter implementation for public Arbeitnow Job Board API
export class ArbeitnowAdapter extends SourceAdapter {
  constructor() {
    super();
    this.name = 'Arbeitnow';
    this.type = 'arbeitnow';
  }

  // Fetches public job feed from Arbeitnow API
  async fetchJobs() {
    // Check development sandbox simulation overrides
    const sandboxOverride =
      sandboxService.getOverride(this.type) || sandboxService.getOverride('backup');

    if (sandboxOverride) {
      logger.warn({ override: sandboxOverride }, 'Sandbox failure override triggered for Arbeitnow');
      sandboxService.simulateFailure(sandboxOverride, 'Arbeitnow');
    }

    logger.info({ url: API_URL }, 'Fetching real job listings from Arbeitnow API');

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    try {
      const response = await fetch(API_URL, {
        signal: controller.signal,
        headers: {
          Accept: 'application/json',
          'User-Agent': 'JobPulse/1.0 (+https://jobpulse.dev/docs)',
        },
      });

      if (!response.ok) {
        const error = new Error(`Arbeitnow HTTP ${response.status}: ${response.statusText}`);
        error.status = response.status;
        throw error;
      }

      const data = await response.json();
      const count = Array.isArray(data?.data) ? data.data.length : 0;
      logger.info({ jobCount: count }, 'Arbeitnow API response received');
      return data;
    } catch (err) {
      if (err.name === 'AbortError') {
        const timeoutErr = new Error('Arbeitnow API request timed out after 10000ms');
        timeoutErr.status = 504;
        throw timeoutErr;
      }
      throw err;
    } finally {
      clearTimeout(timeoutId);
    }
  }

  parseJobs(rawResponse) {
    return parseArbeitnowResponse(rawResponse);
  }

  normalizeJob(rawJob) {
    return normalizeArbeitnowJob(rawJob);
  }
}
