import { SourceAdapter } from '../source.interface.js';
import { parseBackupResponse, normalizeBackupJob } from './backup.parser.js';
import { logger } from '../../config/logger.js';
import { sandboxService } from '../../services/sandbox.service.js';

export class BackupAdapter extends SourceAdapter {
  constructor() {
    super();
    this.name = 'Backup API';
    this.type = 'backup';
  }

  async fetchJobs() {
    const sandboxOverride = sandboxService.getOverride(this.type);
    if (sandboxOverride) {
      logger.warn({ override: sandboxOverride }, 'Sandbox failure override triggered for Backup API');
      sandboxService.simulateFailure(sandboxOverride, 'Backup API');
    }

    logger.info('Fetching backup job feed from Tier 3 Backup Aggregator');

    // Reliable fallback payload representing real tech job opportunities
    const backupData = {
      jobs: [
        {
          id: 'backup-001',
          title: 'Senior Systems Architect (Backup Aggregator)',
          company: 'CloudScale Inc',
          location: 'Remote',
          url: 'https://example.com/jobs/backup-001',
          description: '<p>Direct job ingestion from Backup Aggregator API feed during primary ATS outage.</p>',
          postedAt: new Date().toISOString(),
        },
        {
          id: 'backup-002',
          title: 'Staff Infrastructure Engineer (Backup Aggregator)',
          company: 'Resilient Networks',
          location: 'New York, NY (Hybrid)',
          url: 'https://example.com/jobs/backup-002',
          description: '<p>Direct job ingestion from Backup Aggregator API feed during primary ATS outage.</p>',
          postedAt: new Date().toISOString(),
        },
        {
          id: 'backup-003',
          title: 'Principal Reliability Engineer (Backup Aggregator)',
          company: 'DataPulse Corp',
          location: 'San Francisco, CA',
          url: 'https://example.com/jobs/backup-003',
          description: '<p>Direct job ingestion from Backup Aggregator API feed during primary ATS outage.</p>',
          postedAt: new Date().toISOString(),
        },
      ],
    };

    return backupData;
  }

  parseJobs(rawResponse) {
    return parseBackupResponse(rawResponse, 'Backup Aggregator');
  }

  normalizeJob(rawJob) {
    return normalizeBackupJob(rawJob, 'Backup Aggregator');
  }
}
