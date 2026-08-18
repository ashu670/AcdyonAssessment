import { useState, useEffect } from 'react';
import {
  setSandboxOverride,
  removeSandboxOverride,
  fetchSandboxOverrides,
  resetTestState,
  fetchGovernanceTelemetry,
} from '../services/api.js';
import SourceHealthBadge from './SourceHealthBadge.jsx';

const SOURCES = [
  { key: 'greenhouse', name: 'Greenhouse', defaultBoard: 'stripe' },
  { key: 'lever', name: 'Lever', defaultBoard: 'spotify' },
  { key: 'ashby', name: 'Ashby', defaultBoard: 'linear' },
  { key: 'arbeitnow', name: 'Arbeitnow', defaultBoard: 'api feed' },
];

const SCENARIOS = [
  { group: 'FAILURE SIMULATIONS', label: 'None (Healthy)', type: 'none' },
  { group: 'FAILURE SIMULATIONS', label: 'HTTP 429 Rate Limited', type: '429', status: 429 },
  { group: 'FAILURE SIMULATIONS', label: 'HTTP 500 Server Error', type: '500', status: 500 },
  { group: 'FAILURE SIMULATIONS', label: 'Request Timeout (504)', type: 'timeout' },
  { group: 'FAILURE SIMULATIONS', label: 'Connection Refused (503)', type: 'connection_refused' },
  { group: 'FAILURE SIMULATIONS', label: 'Schema Drift / Malformed JSON', type: 'schema_drift' },

  { group: 'DETECTION SIGNALS', label: 'High Request Frequency', type: 'high_frequency' },
  { group: 'DETECTION SIGNALS', label: 'Header Anomaly (Missing UA)', type: 'header_anomaly' },
  { group: 'DETECTION SIGNALS', label: 'Session Inconsistency', type: 'session_inconsistent' },
  { group: 'DETECTION SIGNALS', label: 'HTTP 403 / Restricted Access', type: 'restricted', status: 403 },
  { group: 'DETECTION SIGNALS', label: 'CAPTCHA Challenge Page', type: 'captcha', status: 403 },
];

export default function SandboxPanel({ onOverrideChange, sourceHealth = [], onClose, onRunIngestion }) {
  const [activeOverrides, setActiveOverrides] = useState({});
  const [governanceData, setGovernanceData] = useState({});
  const [sessionsData, setSessionsData] = useState({});
  const [loading, setLoading] = useState(false);

  const loadData = async () => {
    try {
      const [overridesRes, telemetryRes] = await Promise.all([
        fetchSandboxOverrides(),
        fetchGovernanceTelemetry(),
      ]);
      setActiveOverrides(overridesRes.activeOverrides || {});
      setGovernanceData(telemetryRes.governance || {});
      setSessionsData(telemetryRes.sessions || {});
    } catch {
      // Ignored
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSelectChange = async (sourceKey, selectedType) => {
    const opt = SCENARIOS.find((s) => s.type === selectedType);
    if (!opt) return;

    setLoading(true);
    try {
      if (opt.type === 'none') {
        await removeSandboxOverride(sourceKey);
      } else {
        await setSandboxOverride({
          sourceType: sourceKey,
          failureType: opt.type,
          status: opt.status,
        });
      }
      await loadData();
      if (onOverrideChange) onOverrideChange();
    } catch (err) {
      alert(`Failed to set override: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleResetTestState = async () => {
    setLoading(true);
    try {
      await resetTestState();
      await loadData();
      if (onOverrideChange) onOverrideChange();
    } catch (err) {
      alert(`Failed to reset test state: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const activeCount = Object.keys(activeOverrides).length;

  return (
    <div className="bg-white border border-gray-200 rounded-3xl p-4 sm:p-6 shadow-2xl text-gray-900 space-y-5 sm:space-y-6">
      {/* Header Banner */}
      <div className="flex items-center justify-between gap-3 border-b border-gray-100 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
            </svg>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-extrabold text-gray-900 tracking-tight">
                Failure & AntiBot Lab
              </h3>
              <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-violet-100 text-violet-800 border border-violet-200 uppercase tracking-wider">
                CONTROLLED TEST ENVIRONMENT
              </span>
              {activeCount > 0 && (
                <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-200">
                  {activeCount} Override{activeCount > 1 ? 's' : ''} Active
                </span>
              )}
            </div>
            <p className="text-xs text-gray-500 mt-0.5 font-medium">
              This environment simulates source behavior and detection signals. It does not bypass or interact with restricted commercial platforms.
            </p>
          </div>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 hover:text-gray-900 transition flex items-center justify-center text-sm font-bold"
          >
            ✕
          </button>
        )}
      </div>

      {/* Grid of Source Simulation Cards */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {SOURCES.map((source) => {
          const healthRecord = sourceHealth.find(
            (sh) => sh.type === source.key || sh.name?.toLowerCase() === source.name.toLowerCase()
          ) || {};

          const currentOverride = activeOverrides[source.key] || activeOverrides['backup'];
          const selectedType = currentOverride ? currentOverride.type || 'none' : 'none';
          const gov = governanceData[source.key] || {};
          const sess = sessionsData[source.key] || {};

          return (
            <div key={source.key} className="bg-gray-50/80 border border-gray-200/90 rounded-2xl p-4 space-y-3">
              <div className="flex justify-between items-center pb-2 border-b border-gray-200/60">
                <span className="text-xs font-bold text-gray-900">{source.name}</span>
                <span className="text-[10px] text-gray-400 font-mono">({source.defaultBoard})</span>
              </div>

              {/* Health Indicator */}
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                  Real DB Health
                </span>
                <SourceHealthBadge
                  status={healthRecord.status || 'HEALTHY'}
                  cooldownRemainingSec={healthRecord.cooldownRemainingSec}
                />
              </div>

              {/* Simulation Selector */}
              <div className="space-y-1.5 pt-1">
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">
                  Simulate Scenario
                </label>
                <select
                  value={selectedType}
                  onChange={(e) => handleSelectChange(source.key, e.target.value)}
                  disabled={loading}
                  className="w-full bg-white border border-gray-300 rounded-xl px-2.5 py-1.5 text-xs text-gray-900 font-medium focus:outline-none focus:ring-1 focus:ring-black shadow-sm"
                >
                  <optgroup label="FAILURE SIMULATIONS">
                    {SCENARIOS.filter((s) => s.group === 'FAILURE SIMULATIONS').map((opt) => (
                      <option key={opt.type} value={opt.type}>
                        {opt.label}
                      </option>
                    ))}
                  </optgroup>
                  <optgroup label="DETECTION SIGNALS">
                    {SCENARIOS.filter((s) => s.group === 'DETECTION SIGNALS').map((opt) => (
                      <option key={opt.type} value={opt.type}>
                        {opt.label}
                      </option>
                    ))}
                  </optgroup>
                </select>
              </div>

              {/* Request Governance Mini Telemetry */}
              <div className="pt-2 border-t border-gray-200/60 text-[10px] text-gray-500 space-y-1 font-mono">
                <div className="flex justify-between">
                  <span>Budget:</span>
                  <strong className="text-gray-800">{gov.requestsMade || 0} / {gov.requestsAllowed || 100}</strong>
                </div>
                <div className="flex justify-between">
                  <span>Interval:</span>
                  <strong className="text-gray-800">{gov.minIntervalMs || 200}ms</strong>
                </div>
                <div className="flex justify-between">
                  <span>Session:</span>
                  <strong className={sess.state === 'ACTIVE' ? 'text-emerald-700' : 'text-amber-700'}>
                    {sess.state || 'ACTIVE'}
                  </strong>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Detection Surface & Request Governance Telemetry Panel */}
      <div className="grid md:grid-cols-2 gap-4 pt-2">
        {/* Detection Surface Panel */}
        <div className="bg-gray-50 p-4 rounded-2xl border border-gray-200 space-y-2 text-xs">
          <span className="text-[10px] font-extrabold text-gray-500 uppercase tracking-wider block border-b border-gray-200 pb-1.5">
            Detection Surface Telemetry
          </span>
          <div className="grid grid-cols-2 gap-2 text-[11px] pt-1">
            <div>
              <span className="text-gray-400 block">Request Timing</span>
              <strong className="text-gray-800 font-semibold">Controlled Pacing</strong>
            </div>
            <div>
              <span className="text-gray-400 block">Request Frequency</span>
              <strong className="text-emerald-700 font-semibold">Within Budget</strong>
            </div>
            <div>
              <span className="text-gray-400 block">User-Agent Header</span>
              <strong className="text-violet-700 font-semibold font-mono text-[10px]">JobPulse/1.0 (Truthful)</strong>
            </div>
            <div>
              <span className="text-gray-400 block">Session Context</span>
              <strong className="text-gray-800 font-semibold">Stable Application Context</strong>
            </div>
          </div>
        </div>

        {/* Request Governance Panel */}
        <div className="bg-gray-50 p-4 rounded-2xl border border-gray-200 space-y-2 text-xs">
          <span className="text-[10px] font-extrabold text-gray-500 uppercase tracking-wider block border-b border-gray-200 pb-1.5">
            Proactive Request Governance
          </span>
          <div className="grid grid-cols-2 gap-2 text-[11px] pt-1">
            <div>
              <span className="text-gray-400 block">Min Request Interval</span>
              <strong className="font-mono text-gray-800">200ms</strong>
            </div>
            <div>
              <span className="text-gray-400 block">Max Concurrency</span>
              <strong className="font-mono text-gray-800">1 Request / Source</strong>
            </div>
            <div>
              <span className="text-gray-400 block">Window Rate Limit</span>
              <strong className="font-mono text-gray-800">100 Req / Minute</strong>
            </div>
            <div>
              <span className="text-gray-400 block">Fingerprint Policy</span>
              <strong className="text-gray-700">No Evasion / No Spoofing</strong>
            </div>
          </div>
        </div>
      </div>

      {/* Control Actions */}
      <div className="flex items-center justify-between pt-3 border-t border-gray-100 flex-wrap gap-3">
        <button
          onClick={handleResetTestState}
          disabled={loading}
          className="px-4 py-2.5 bg-violet-50 hover:bg-violet-100 text-violet-700 text-xs font-semibold rounded-xl border border-violet-200 transition flex items-center gap-1.5 shadow-sm"
          title="Clears test overrides, resets budgets, cooldowns & circuit breakers to HEALTHY"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          <span>Reset Test State</span>
        </button>

        <div className="flex items-center gap-3">
          {onRunIngestion && (
            <button
              onClick={() => {
                if (onClose) onClose();
                onRunIngestion();
              }}
              className="px-5 py-2.5 bg-black hover:bg-gray-800 text-white text-xs font-bold rounded-xl transition shadow-md flex items-center gap-1.5"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              <span>Run Scenario Test</span>
            </button>
          )}

          {onClose && (
            <button
              onClick={onClose}
              className="px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-semibold rounded-xl border border-gray-200 transition"
            >
              Apply Overrides
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
