import { SourceAdapter } from '../source.interface.js';
import { parseGreenhouseJobs, normalizeGreenhouseJob } from './greenhouse.parser.js';
import { config } from '../../config/env.js';
import { logger } from '../../config/logger.js';
import { sandboxService } from '../../services/sandbox.service.js';

// Adapter implementation for public Greenhouse ATS Job Board API
export class GreenhouseAdapter extends SourceAdapter {
  constructor() {
    super();
    this.boardToken = config.greenhouse.boardToken;
    this.timeoutMs = config.greenhouse.apiTimeoutMs;
    this.name = 'Greenhouse';
    this.type = 'greenhouse';
    this.baseUrl = `https://boards-api.greenhouse.io/v1/boards/${this.boardToken}/jobs?content=true`;
  }

  // Fetches public job listings from Greenhouse board
  async fetchJobs() {
    // Check for development sandbox simulation overrides
    const sandboxOverride = sandboxService.getOverride(this.type);
    if (sandboxOverride) {
      logger.warn({ override: sandboxOverride }, 'Sandbox failure override triggered for Greenhouse');
      sandboxService.simulateFailure(sandboxOverride, 'Greenhouse');
    }

    logger.info({ boardToken: this.boardToken, url: this.baseUrl }, 'Fetching jobs from Greenhouse');

    // AbortController manages outbound request timeout
    const controller = new AbortController();
    const timeoutHandle = setTimeout(() => {
      controller.abort();
    }, this.timeoutMs);

    let response;
    try {
      response = await fetch(this.baseUrl, {
        signal: controller.signal,
        headers: {
          Accept: 'application/json',
          'User-Agent': 'JobPulse/1.0 (+https://jobpulse.dev/docs)',
        },
      });
    } catch (err) {
      if (err.name === 'AbortError') {
        throw new Error(
          `Greenhouse API request timed out after ${this.timeoutMs}ms`
        );
      }
      throw new Error(`Network error reaching Greenhouse API: ${err.message}`);
    } finally {
      clearTimeout(timeoutHandle);
    }

    if (!response.ok) {
      const body = await response.text().catch(() => '');
      throw new Error(
        `Greenhouse API returned HTTP ${response.status}: ${body.slice(0, 200)}`
      );
    }

    let data;
    try {
      data = await response.json();
    } catch {
      throw new Error('Greenhouse API returned non-JSON response');
    }

    logger.info(
      { jobCount: data?.jobs?.length ?? '?' },
      'Greenhouse API response received'
    );

    return data;
  }

  // Maps raw Greenhouse JSON response to normalized job instances
  parseJobs(rawResponse) {
    return parseGreenhouseJobs(rawResponse, this.boardToken);
  }

  // Normalizes single Greenhouse job record
  normalizeJob(rawJob) {
    return normalizeGreenhouseJob(rawJob, this.boardToken);
  }
}
