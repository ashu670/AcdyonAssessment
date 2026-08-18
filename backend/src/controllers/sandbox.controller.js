import { sandboxService } from '../services/sandbox.service.js';
import { circuitBreakerService } from '../services/circuit-breaker.service.js';
import { requestGovernanceService } from '../services/request-governance.service.js';
import { sourceSessionService } from '../services/source-session.service.js';

/**
 * POST /api/sandbox/override
 */
export function setSandboxOverride(req, res) {
  const { sourceType, failureType, status, retryAfter } = req.body;

  if (!sourceType || !failureType) {
    return res.status(400).json({ error: { message: 'sourceType and failureType are required' } });
  }

  sandboxService.setOverride(sourceType, {
    type: failureType,
    status: status ? parseInt(status, 10) : undefined,
    retryAfter: retryAfter ? parseInt(retryAfter, 10) : 30,
  });

  return res.status(200).json({
    message: `AntiBot Lab override active for ${sourceType}`,
    activeOverrides: sandboxService.getAllOverrides(),
  });
}

/**
 * POST /api/sandbox/reset
 * Clears overrides, resets test health, request budgets & sessions.
 */
export async function resetTestState(_req, res, next) {
  try {
    requestGovernanceService.resetGovernance();
    const healthSummary = await circuitBreakerService.resetTestHealth();
    return res.status(200).json({
      message: 'Test state, request budgets, and source health reset to HEALTHY',
      data: healthSummary,
      governance: requestGovernanceService.getGovernanceSummary(),
      sessions: sourceSessionService.getAllSessions(),
    });
  } catch (err) {
    next(err);
  }
}

/**
 * DELETE /api/sandbox/override/:sourceType
 */
export function removeSandboxOverride(req, res) {
  const { sourceType } = req.params;
  sandboxService.removeOverride(sourceType);

  return res.status(200).json({
    message: `AntiBot Lab override removed for ${sourceType}`,
    activeOverrides: sandboxService.getAllOverrides(),
  });
}

/**
 * DELETE /api/sandbox/overrides
 */
export function clearAllSandboxOverrides(_req, res) {
  sandboxService.clearOverrides();

  return res.status(200).json({
    message: 'All AntiBot Lab overrides cleared',
    activeOverrides: sandboxService.getAllOverrides(),
  });
}

/**
 * GET /api/sandbox/overrides
 */
export function getSandboxOverrides(_req, res) {
  return res.status(200).json({
    activeOverrides: sandboxService.getAllOverrides(),
    governance: requestGovernanceService.getGovernanceSummary(),
    sessions: sourceSessionService.getAllSessions(),
  });
}

/**
 * GET /api/sandbox/governance
 */
export function getGovernanceTelemetry(_req, res) {
  return res.status(200).json({
    governance: requestGovernanceService.getGovernanceSummary(),
    sessions: sourceSessionService.getAllSessions(),
  });
}
