// Abstract base class defining the contract for external ATS adapters
export class SourceAdapter {
  // Fetches raw job payloads from target provider
  async fetchJobs() {
    throw new Error('SourceAdapter.fetchJobs() must be implemented');
  }

  // Maps raw provider response into normalized job instances
  parseJobs(_rawResponse) {
    throw new Error('SourceAdapter.parseJobs() must be implemented');
  }

  // Normalizes single raw job entry into standard schema
  normalizeJob(_rawJob) {
    throw new Error('SourceAdapter.normalizeJob() must be implemented');
  }
}
