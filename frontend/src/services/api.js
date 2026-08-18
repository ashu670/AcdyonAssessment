// Base API client configuration
const BASE_URL = 'http://localhost:3001';

// Shared fetch wrapper with error handling
async function apiFetch(path, options = {}) {
  const res = await fetch(`${BASE_URL}${path}`, options);
  const data = await res.json();
  if (!res.ok) {
    const message = data?.error?.message || `HTTP ${res.status}`;
    throw new Error(message);
  }
  return data;
}

// Fetches job listings with page, search, and company filters
export async function fetchJobs(params = {}) {
  const query = new URLSearchParams();
  if (params.page) query.set('page', params.page);
  if (params.limit) query.set('limit', params.limit);
  if (params.search) query.set('search', params.search);
  if (params.location) query.set('location', params.location);
  if (params.company) query.set('company', params.company);

  return apiFetch(`/api/jobs?${query.toString()}`);
}

// Fetches single job record by ID
export async function fetchJob(id) {
  return apiFetch(`/api/jobs/${id}`);
}

// Triggers multi-source ingestion run
export async function triggerOrchestratedRun() {
  return apiFetch('/api/ingestion/run', { method: 'POST' });
}

// Fetches history of ingestion runs
export async function fetchIngestionRuns(params = {}) {
  const query = new URLSearchParams();
  if (params.page) query.set('page', params.page);
  if (params.limit) query.set('limit', params.limit);
  return apiFetch(`/api/ingestion/runs?${query.toString()}`);
}

// Fetches current health status for all job sources
export async function fetchSourceHealth() {
  return apiFetch('/api/ingestion/health');
}

// Sets failure simulation override for target source
export async function setSandboxOverride({ sourceType, failureType, status }) {
  return apiFetch('/api/sandbox/override', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sourceType, failureType, status }),
  });
}

// Removes active override for target source
export async function removeSandboxOverride(sourceType) {
  return apiFetch(`/api/sandbox/override/${sourceType}`, { method: 'DELETE' });
}

// Clears all simulation overrides
export async function clearAllSandboxOverrides() {
  return apiFetch('/api/sandbox/overrides', { method: 'DELETE' });
}

// Fetches active simulation overrides
export async function fetchSandboxOverrides() {
  return apiFetch('/api/sandbox/overrides');
}

// Fetches request governance and session telemetry
export async function fetchGovernanceTelemetry() {
  return apiFetch('/api/sandbox/governance');
}

// Resets source health, cooldowns, and request budgets to HEALTHY
export async function resetTestState() {
  return apiFetch('/api/sandbox/reset', { method: 'POST' });
}

// Legacy single-source trigger
export async function triggerIngestion() {
  return apiFetch('/api/ingestion/greenhouse', { method: 'POST' });
}

export async function fetchIngestionStatus() {
  return apiFetch('/api/ingestion/status');
}

export async function fetchSources() {
  return apiFetch('/api/sources');
}
