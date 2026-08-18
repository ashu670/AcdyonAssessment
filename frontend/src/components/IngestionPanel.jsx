import { useState, useEffect, useCallback } from 'react';
import { triggerOrchestratedRun, fetchSourceHealth } from '../services/api.js';
import SourceHealthBadge from './SourceHealthBadge.jsx';
import IngestionRunTable from './IngestionRunTable.jsx';

export default function IngestionPanel({ onIngestionComplete }) {
  const [running, setRunning] = useState(false);
  const [error, setError] = useState(null);
  const [lastRun, setLastRun] = useState(null);
  const [sourceHealth, setSourceHealth] = useState([]);

  const loadHealth = useCallback(async () => {
    try {
      const res = await fetchSourceHealth();
      setSourceHealth(res.data || []);
    } catch {
      // Ignored
    }
  }, []);

  useEffect(() => {
    loadHealth();
  }, [loadHealth]);

  async function handleRun() {
    setRunning(true);
    setError(null);
    try {
      const result = await triggerOrchestratedRun();
      setLastRun(result);
      await loadHealth();
      onIngestionComplete(result);
    } catch (err) {
      setError(err.message);
    } finally {
      setRunning(false);
    }
  }

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
      {/* Top Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base font-bold text-white">Resilient Multi-Source Ingestion Engine</h3>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-violet-950 text-violet-300 border border-violet-800">
              Orchestration Active
            </span>
          </div>
          <p className="text-xs text-gray-400 mt-1">
            Priority sequence: Greenhouse (Stripe) → Lever (Spotify) → Ashby (Linear)
          </p>
        </div>

        <button
          id="run-ingestion-btn"
          onClick={handleRun}
          disabled={running}
          className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 disabled:opacity-60 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-xl transition shadow-lg shadow-violet-600/20 focus:outline-none focus:ring-2 focus:ring-violet-500"
        >
          {running ? (
            <>
              <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
              </svg>
              Orchestrating Ingestion…
            </>
          ) : (
            <>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              Run Ingestion
            </>
          )}
        </button>
      </div>

      {/* Source Health Grid */}
      {sourceHealth.length > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-800/80">
          <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider block mb-2">
            Real-Time Source Operational Health & Circuit Breakers
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {sourceHealth.map((sh) => (
              <div key={sh.sourceId} className="bg-gray-950/70 border border-gray-800 rounded-xl p-3 flex justify-between items-center">
                <div>
                  <span className="text-xs font-bold text-gray-200 block">{sh.name}</span>
                  <span className="text-[10px] text-gray-500 font-mono">
                    {sh.failureCount > 0 ? `${sh.failureCount} fail(s)` : '0 failures'}
                  </span>
                </div>
                <SourceHealthBadge status={sh.status} />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Error message if any */}
      {error && (
        <div className="mt-4 p-3 rounded-xl bg-red-950/50 border border-red-800 text-sm text-red-400">
          ⚠ {error}
        </div>
      )}

      {/* Ingestion Run Results Table */}
      {lastRun && <IngestionRunTable run={lastRun} />}
    </div>
  );
}
