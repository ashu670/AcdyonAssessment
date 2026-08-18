import { runGreenhouseIngestion, getLastIngestionStatus } from '../services/ingestion.service.js';
import {
  runOrchestratedIngestion,
  getIngestionRunHistory,
  getIngestionRunById,
} from '../services/orchestrator.service.js';
import { circuitBreakerService } from '../services/circuit-breaker.service.js';
import { logger } from '../config/logger.js';

// POST /api/ingestion/run - Triggers multi-source ingestion run
export async function triggerOrchestratedRun(_req, res, next) {
  try {
    const result = await runOrchestratedIngestion();
    return res.status(200).json(result);
  } catch (err) {
    logger.error({ err }, 'Orchestrated ingestion run failed');
    return res.status(500).json({
      status: 'all_failed',
      error: err.message,
      ranAt: new Date().toISOString(),
    });
  }
}

// GET /api/ingestion/runs - Fetches paginated ingestion history
export async function getIngestionHistory(req, res, next) {
  try {
    const page = req.query.page ? parseInt(req.query.page, 10) : 1;
    const limit = req.query.limit ? parseInt(req.query.limit, 10) : 10;
    const history = await getIngestionRunHistory({ page, limit });
    return res.status(200).json(history);
  } catch (err) {
    next(err);
  }
}

// GET /api/ingestion/runs/:id - Fetches single run details by ID
export async function getIngestionRun(req, res, next) {
  try {
    const run = await getIngestionRunById(req.params.id);
    if (!run) {
      return res.status(404).json({ error: { message: 'Ingestion run not found' } });
    }
    return res.status(200).json(run);
  } catch (err) {
    next(err);
  }
}

// GET /api/ingestion/health - Fetches health summary for all sources
export async function getSourceHealth(_req, res, next) {
  try {
    const health = await circuitBreakerService.getHealthSummary();
    return res.status(200).json({ data: health });
  } catch (err) {
    next(err);
  }
}

// POST /api/ingestion/greenhouse - Single-source Greenhouse trigger
export async function triggerGreenhouseIngestion(req, res, next) {
  try {
    const result = await runGreenhouseIngestion();
    return res.status(200).json(result);
  } catch (err) {
    logger.error({ err }, 'Greenhouse ingestion failed');
    const isUpstreamError =
      err.message.includes('timed out') ||
      err.message.includes('Network error') ||
      err.message.includes('HTTP 4') ||
      err.message.includes('HTTP 5');

    const statusCode = isUpstreamError ? 502 : 500;
    return res.status(statusCode).json({
      source: 'Greenhouse',
      status: 'error',
      error: err.message,
      ranAt: new Date().toISOString(),
    });
  }
}

// GET /api/ingestion/status - Returns last run status
export function getIngestionStatus(req, res) {
  const status = getLastIngestionStatus();
  if (!status) {
    return res.status(200).json({
      status: 'no_run',
      message: 'No ingestion has run yet.',
    });
  }
  return res.status(200).json(status);
}
