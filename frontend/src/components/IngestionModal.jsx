import { useState } from 'react';
import { triggerOrchestratedRun } from '../services/api.js';
import IngestionRunTable from './IngestionRunTable.jsx';

export default function IngestionModal({ onClose, onIngestionSuccess }) {
  const [running, setRunning] = useState(false);
  const [lastRun, setLastRun] = useState(null);
  const [error, setError] = useState(null);

  async function handleRun() {
    setRunning(true);
    setError(null);
    try {
      const result = await triggerOrchestratedRun();
      setLastRun(result);
      if (onIngestionSuccess) onIngestionSuccess(result);
    } catch (err) {
      setError(err.message);
    } finally {
      setRunning(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="bg-white border border-gray-200 rounded-3xl max-w-2xl w-[calc(100vw-24px)] max-h-[calc(100vh-24px)] flex flex-col shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
          <div>
            <h2 className="text-lg font-bold text-gray-900">
              Trigger Multi-Source Ingestion
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">
              Priority sequence: Greenhouse (Stripe) → Lever (Spotify) → Ashby (Linear)
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 hover:text-gray-900 flex items-center justify-center transition"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-4">
          <div className="bg-gray-50 border border-gray-200/80 rounded-2xl p-5 text-center">
            <h3 className="text-sm font-bold text-gray-900 mb-1">
              Ready to execute multi-source ingestion
            </h3>
            <p className="text-xs text-gray-500 max-w-md mx-auto mb-4">
              The orchestrator will attempt the primary source first. If it encounters a rate limit, timeout, or failure, it automatically falls back to secondary sources.
            </p>

            <button
              onClick={handleRun}
              disabled={running}
              className="px-6 py-3 bg-black hover:bg-gray-800 disabled:opacity-50 text-white text-xs font-bold rounded-xl transition shadow-md inline-flex items-center gap-2 active:scale-95"
            >
              {running ? (
                <>
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                  </svg>
                  <span>Orchestrating Ingestion…</span>
                </>
              ) : (
                <>
                  <span>Start Ingestion Sequence</span>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </>
              )}
            </button>
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 font-semibold">
              ⚠ Ingestion Error: {error}
            </div>
          )}

          {lastRun && (
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                Run Output Details
              </h4>
              <IngestionRunTable run={lastRun} />
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-100 bg-gray-50 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 text-xs font-semibold rounded-xl transition"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
