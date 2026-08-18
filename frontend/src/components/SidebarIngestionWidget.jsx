import { useState } from 'react';
import SourceHealthBadge from './SourceHealthBadge.jsx';
import { resetTestState } from '../services/api.js';

export default function SidebarIngestionWidget({
  onRunIngestion,
  onOpenSandbox,
  sourceHealth = [],
  running = false,
  onRefreshHealth,
}) {
  const [resetting, setResetting] = useState(false);

  const handleResetTestState = async () => {
    setResetting(true);
    try {
      await resetTestState();
      if (onRefreshHealth) {
        await onRefreshHealth();
      }
    } catch (err) {
      alert(`Failed to reset test state: ${err.message}`);
    } finally {
      setResetting(false);
    }
  };

  return (
    <div className="bg-gray-100/80 border border-gray-200/80 rounded-2xl p-6 shadow-sm flex flex-col justify-between gap-5">
      <div>
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-extrabold text-gray-900 tracking-tight">
            Resilient Ingestion Engine
          </h3>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-violet-100 text-violet-700">
            Multi-Source
          </span>
        </div>

        <p className="mt-2 text-xs text-gray-600 leading-relaxed">
          Ingests live listings from Greenhouse, Lever, Ashby, and Arbeitnow with circuit-breaker protection & failover.
        </p>

        {/* Health status list */}
        {sourceHealth.length > 0 && (
          <div className="mt-4 pt-3 border-t border-gray-200/80 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                Source Health & Cooldowns
              </span>
              <button
                onClick={handleResetTestState}
                disabled={resetting}
                className="text-[10px] font-bold text-violet-700 hover:text-violet-900 transition underline flex items-center gap-1"
                title="Clears test overrides, resets cooldowns & circuit breakers to HEALTHY"
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                <span>{resetting ? 'Resetting…' : 'Reset Test State'}</span>
              </button>
            </div>

            <div className="space-y-2">
              {sourceHealth.map((sh) => (
                <div
                  key={sh.sourceId}
                  className="flex flex-col xs:flex-row xs:items-center justify-between gap-1 sm:gap-2 text-xs py-1.5 border-b border-gray-200/40 last:border-0 min-w-0"
                >
                  <div className="min-w-0 flex-1">
                    <span className="font-bold text-gray-900 block leading-snug truncate">
                      {sh.name}
                    </span>
                    <div className="text-[10px] text-gray-500 font-mono flex items-center gap-1.5 mt-0.5 flex-wrap">
                      <span>
                        Real:{' '}
                        <strong className="text-gray-700">
                          {sh.realStatus || sh.status}
                        </strong>
                      </span>
                      <span>•</span>
                      <span>
                        Sim:{' '}
                        <strong className="text-violet-600">
                          {sh.simulationOverride || 'NONE'}
                        </strong>
                      </span>
                    </div>
                  </div>
                  <div className="shrink-0 pt-0.5 xs:pt-0">
                    <SourceHealthBadge
                      status={sh.status}
                      cooldownRemainingSec={sh.cooldownRemainingSec}
                      simulationOverride={sh.simulationOverride}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="space-y-2">
        <button
          onClick={onRunIngestion}
          disabled={running}
          className="w-full py-3 bg-black hover:bg-gray-800 disabled:opacity-50 text-white text-xs font-bold rounded-xl transition shadow-md flex items-center justify-center gap-2 active:scale-95"
        >
          {running ? (
            <>
              <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
              </svg>
              <span>Orchestrating…</span>
            </>
          ) : (
            <>
              <span>Run Ingestion Now</span>
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </>
          )}
        </button>

        <button
          onClick={onOpenSandbox}
          className="w-full py-2 text-[11px] font-semibold text-indigo-700 hover:text-indigo-900 transition text-center flex items-center justify-center gap-1.5"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
          </svg>
          <span>Open Failure Simulation Sandbox</span>
        </button>
      </div>
    </div>
  );
}
