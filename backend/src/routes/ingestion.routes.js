import { Router } from 'express';
import {
  triggerOrchestratedRun,
  getIngestionHistory,
  getIngestionRun,
  getSourceHealth,
  triggerGreenhouseIngestion,
  getIngestionStatus,
} from '../controllers/ingestion.controller.js';

const router = Router();

// POST /api/ingestion/run — trigger an orchestrated multi-source run
router.post('/run', triggerOrchestratedRun);

// GET /api/ingestion/runs — fetch run history
router.get('/runs', getIngestionHistory);

// GET /api/ingestion/runs/:id — fetch single run details
router.get('/runs/:id', getIngestionRun);

// GET /api/ingestion/health — fetch source operational health
router.get('/health', getSourceHealth);

// Legacy Phase 1 routes (backwards compatibility)
router.post('/greenhouse', triggerGreenhouseIngestion);
router.get('/status', getIngestionStatus);

export default router;
