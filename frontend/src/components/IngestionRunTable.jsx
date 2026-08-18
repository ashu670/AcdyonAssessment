export default function IngestionRunTable({ run }) {
  const attempts = run?.attemptedSources || run?.attempts || [];
  const summary = run?.summary || {};

  if (!run || !Array.isArray(attempts) || attempts.length === 0) {
    return null;
  }

  const finalSourceUsed = run.sourceUsed || run.finalSource || null;

  const getStatusBadge = (status, httpStatus) => {
    const s = String(status || '').toLowerCase();
    switch (s) {
      case 'success':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
            ✓ SUCCESS
          </span>
        );
      case 'not_attempted':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-gray-100 text-gray-500 border border-gray-300">
            ⚪ NOT ATTEMPTED
          </span>
        );
      case 'circuit_open':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-red-100 text-red-800 border border-red-300">
            ✕ CIRCUIT OPEN
          </span>
        );
      case 'timeout':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-300">
            ✕ TIMEOUT (504)
          </span>
        );
      case 'rate_limited':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-orange-100 text-orange-800 border border-orange-300">
            ✕ RATE LIMITED (429)
          </span>
        );
      case 'network_error':
      case 'connection_refused':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-800 border border-rose-300">
            ✕ CONNECTION ERROR
          </span>
        );
      case 'schema_error':
      case 'malformed_schema':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-purple-100 text-purple-800 border border-purple-300">
            ✕ SCHEMA ERROR
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-red-100 text-red-800 border border-red-300">
            ✕ {s.toUpperCase()} {httpStatus ? `(${httpStatus})` : ''}
          </span>
        );
    }
  };

  return (
    <div className="bg-gray-50/90 border border-gray-200 rounded-2xl overflow-hidden mt-4 space-y-3 p-3 sm:p-4 text-gray-900 w-full max-w-full min-w-0">
      <div className="flex justify-between items-center flex-wrap gap-2 pb-2 border-b border-gray-200/80">
        <span className="text-xs font-extrabold text-gray-800 uppercase tracking-wider">
          Ingestion Run Timeline & Metrics
        </span>
        {finalSourceUsed ? (
          <span className="text-xs font-bold text-emerald-800 bg-emerald-100/90 border border-emerald-300 px-3 py-1 rounded-full">
            Final Source Used: <strong className="uppercase text-emerald-950">{finalSourceUsed}</strong>
          </span>
        ) : (
          <span className="text-xs font-bold text-red-800 bg-red-100/90 border border-red-300 px-3 py-1 rounded-full">
            Status: {run.reason || 'ALL_SOURCES_UNAVAILABLE'}
          </span>
        )}
      </div>

      {/* Mobile Attempts Cards (< md) */}
      <div className="block md:hidden space-y-2.5">
        {attempts.map((attempt, index) => (
          <div
            key={index}
            className={`p-3 rounded-2xl border text-xs space-y-1.5 ${
              attempt.status === 'success'
                ? 'bg-emerald-50/60 border-emerald-200'
                : 'bg-white border-gray-200'
            }`}
          >
            <div className="flex items-center justify-between gap-2">
              <span className="font-extrabold text-gray-900 capitalize">
                {index + 1}. {attempt.name || attempt.source}
              </span>
              <div>{getStatusBadge(attempt.status, attempt.httpStatus)}</div>
            </div>

            {attempt.error && (
              <p className="text-[10px] text-gray-500 font-mono break-all leading-tight">
                {attempt.error}
              </p>
            )}

            <div className="flex items-center justify-between text-[11px] font-mono text-gray-600 pt-1 border-t border-gray-100">
              <span>Fetched: <strong className="text-gray-900 font-extrabold">{attempt.jobsFetched > 0 ? attempt.jobsFetched : 0}</strong></span>
              <span>Duration: <strong className="text-gray-900 font-extrabold">{attempt.durationMs ? `${(attempt.durationMs / 1000).toFixed(2)}s` : '—'}</strong></span>
            </div>
          </div>
        ))}
      </div>

      {/* Desktop Attempts Sequence Table (>= md) */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-left text-xs text-gray-800">
          <thead className="bg-gray-100/80 text-gray-500 uppercase tracking-wider text-[10px] border-b border-gray-200">
            <tr>
              <th className="px-3 py-2">Attempt</th>
              <th className="px-3 py-2">Source</th>
              <th className="px-3 py-2">Outcome</th>
              <th className="px-3 py-2 text-right">Fetched</th>
              <th className="px-3 py-2 text-right">Duration</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200/60">
            {attempts.map((attempt, index) => (
              <tr key={index} className={attempt.status === 'success' ? 'bg-emerald-50/50' : 'bg-white'}>
                <td className="px-3 py-2.5 text-gray-400 text-[10px] font-bold">{index + 1}.</td>
                <td className="px-3 py-2.5 font-extrabold text-gray-900 capitalize">{attempt.name || attempt.source}</td>
                <td className="px-3 py-2.5">
                  <div className="flex flex-col gap-0.5">
                    {getStatusBadge(attempt.status, attempt.httpStatus)}
                    {attempt.error && (
                      <span className="text-[10px] text-gray-500 truncate max-w-xs font-mono font-medium">
                        {attempt.error}
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-3 py-2.5 text-right font-mono font-bold text-gray-900">
                  {attempt.jobsFetched > 0 ? attempt.jobsFetched : '—'}
                </td>
                <td className="px-3 py-2.5 text-right font-mono text-gray-500">
                  {attempt.durationMs ? `${(attempt.durationMs / 1000).toFixed(2)}s` : '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Distinct Ingestion Metrics Summary */}
      {summary && summary.jobsFetched !== undefined && (
        <div className="pt-3 border-t border-gray-200 bg-white rounded-xl p-3 border border-gray-200/80">
          <span className="text-[10px] font-extrabold text-gray-500 uppercase tracking-wider block mb-2">
            Ingestion Result Summary & Reconciliation Metrics
          </span>
          <div className="grid grid-cols-2 sm:grid-cols-6 gap-2 text-center text-xs">
            <div className="bg-gray-50 p-2 rounded-xl border border-gray-200">
              <span className="text-[10px] text-gray-500 font-bold block">Fetched</span>
              <span className="font-mono font-extrabold text-gray-900">{summary.jobsFetched}</span>
            </div>
            <div className="bg-gray-50 p-2 rounded-xl border border-emerald-200">
              <span className="text-[10px] text-emerald-700 font-bold block">Inserted</span>
              <span className="font-mono font-extrabold text-emerald-800">+{summary.jobsInserted}</span>
            </div>
            <div className="bg-gray-50 p-2 rounded-xl border border-amber-200">
              <span className="text-[10px] text-amber-700 font-bold block">Updated</span>
              <span className="font-mono font-extrabold text-amber-800">{summary.jobsUpdated}</span>
            </div>
            <div className="bg-gray-50 p-2 rounded-xl border border-gray-200">
              <span className="text-[10px] text-gray-500 font-bold block">Skipped</span>
              <span className="font-mono font-extrabold text-gray-700">{summary.jobsSkipped}</span>
            </div>
            <div className="bg-gray-50 p-2 rounded-xl border border-rose-200">
              <span className="text-[10px] text-rose-700 font-bold block">Removed</span>
              <span className="font-mono font-extrabold text-rose-800">-{summary.jobsDeleted || 0}</span>
            </div>
            <div className="bg-violet-50/60 p-2 rounded-xl border border-violet-200 col-span-2 sm:col-span-1">
              <span className="text-[10px] text-violet-700 font-extrabold block">Total Stored</span>
              <span className="font-mono font-extrabold text-violet-900">{summary.totalJobsStored}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
