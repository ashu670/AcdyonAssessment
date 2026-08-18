import { Router } from 'express';
import {
  setSandboxOverride,
  resetTestState,
  removeSandboxOverride,
  clearAllSandboxOverrides,
  getSandboxOverrides,
  getGovernanceTelemetry,
} from '../controllers/sandbox.controller.js';

const router = Router();

router.get('/overrides', getSandboxOverrides);
router.get('/governance', getGovernanceTelemetry);
router.post('/override', setSandboxOverride);
router.post('/reset', resetTestState);
router.delete('/override/:sourceType', removeSandboxOverride);
router.delete('/overrides', clearAllSandboxOverrides);

export default router;
