import { SourceAdapter } from '../source.interface.js';
import { parseAshbyResponse, normalizeAshbyJob } from './ashby.parser.js';
import { config } from '../../config/env.js';
import { logger } from '../../config/logger.js';
import { sandboxService } from '../../services/sandbox.service.js';

const BASE_URL = 'https://api.ashbyhq.com/posting-api/job-board';

// Adapter implementation for public Ashby Job Board API
export class AshbyAdapter extends SourceAdapter {
  constructor(boardToken = config.ashby.boardToken, companyName = 'Linear') {
    super();
    this.boardToken = boardToken;
    this.companyName = companyName;
    this.name = 'Ashby';
    this.type = 'ashby';
  }

  // Fetches public postings from Ashby API
  async fetchJobs() {
    // Check development sandbox simulation overrides
    const sandboxOverride = sandboxService.getOverride(this.type);
    if (sandboxOverride) {
      logger.warn({ override: sandboxOverride }, 'Sandbox failure override triggered for Ashby');
      sandboxService.simulateFailure(sandboxOverride, 'Ashby');
    }

    const url = `${BASE_URL}/${this.boardToken}`;
    logger.info({ boardToken: this.boardToken, url }, 'Fetching jobs from Ashby API');

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), config.ashby.apiTimeoutMs);

    try {
      const response = await fetch(url, { signal: controller.signal });

      if (!response.ok) {
        const error = new Error(`Ashby HTTP ${response.status}: ${response.statusText}`);
        error.status = response.status;
        throw error;
      }

      const data = await response.json();
      const count = Array.isArray(data.jobs) ? data.jobs.length : 0;
      logger.info({ jobCount: count }, 'Ashby API response received');
      return data;
    } catch (err) {
      if (err.name === 'AbortError') {
        const timeoutErr = new Error(`Ashby request timed out after ${config.ashby.apiTimeoutMs}ms`);
        timeoutErr.status = 504;
        throw timeoutErr;
      }
      throw err;
    } finally {
      clearTimeout(timeoutId);
    }
  }

  parseJobs(rawResponse) {
    return parseAshbyResponse(rawResponse, this.companyName);
  }

  normalizeJob(rawJob) {
    return normalizeAshbyJob(rawJob, this.companyName);
  }
}
