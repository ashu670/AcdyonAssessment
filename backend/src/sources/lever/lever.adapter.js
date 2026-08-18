import { SourceAdapter } from '../source.interface.js';
import { parseLeverResponse, normalizeLeverJob } from './lever.parser.js';
import { config } from '../../config/env.js';
import { logger } from '../../config/logger.js';
import { sandboxService } from '../../services/sandbox.service.js';

const BASE_URL = 'https://api.lever.co/v0/postings';

// Adapter implementation for public Lever Postings API
export class LeverAdapter extends SourceAdapter {
  constructor(boardToken = config.lever.boardToken, companyName = 'Spotify') {
    super();
    this.boardToken = boardToken;
    this.companyName = companyName;
    this.name = 'Lever';
    this.type = 'lever';
  }

  // Fetches public postings from Lever API
  async fetchJobs() {
    // Check development sandbox simulation overrides
    const sandboxOverride = sandboxService.getOverride(this.type);
    if (sandboxOverride) {
      logger.warn({ override: sandboxOverride }, 'Sandbox failure override triggered for Lever');
      sandboxService.simulateFailure(sandboxOverride, 'Lever');
    }

    const url = `${BASE_URL}/${this.boardToken}?mode=json`;
    logger.info({ boardToken: this.boardToken, url }, 'Fetching jobs from Lever API');

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), config.lever.apiTimeoutMs);

    try {
      const response = await fetch(url, { signal: controller.signal });

      if (!response.ok) {
        const error = new Error(`Lever HTTP ${response.status}: ${response.statusText}`);
        error.status = response.status;
        throw error;
      }

      const data = await response.json();
      logger.info({ jobCount: Array.isArray(data) ? data.length : 0 }, 'Lever API response received');
      return data;
    } catch (err) {
      if (err.name === 'AbortError') {
        const timeoutErr = new Error(`Lever request timed out after ${config.lever.apiTimeoutMs}ms`);
        timeoutErr.status = 504;
        throw timeoutErr;
      }
      throw err;
    } finally {
      clearTimeout(timeoutId);
    }
  }

  parseJobs(rawResponse) {
    return parseLeverResponse(rawResponse, this.companyName);
  }

  normalizeJob(rawJob) {
    return normalizeLeverJob(rawJob, this.companyName);
  }
}
