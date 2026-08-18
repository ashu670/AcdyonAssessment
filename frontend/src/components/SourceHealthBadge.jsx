export default function SourceHealthBadge({ status, cooldownRemainingSec, simulationOverride }) {
  const normalized = (status || 'HEALTHY').toUpperCase();

  const isRateLimited = normalized.includes('RATE_LIMITED') || normalized.includes('RATE LIMITED');
  const isCircuitOpen = normalized.includes('CIRCUIT_OPEN') || normalized.includes('CIRCUIT OPEN');

  let label = normalized;
  let bg = 'bg-emerald-50 text-emerald-700 border-emerald-200';
  let dotColor = 'bg-emerald-500 animate-pulse';

  if (normalized.includes('HEALTHY')) {
    label = 'HEALTHY';
  } else if (isRateLimited) {
    label = cooldownRemainingSec > 0 ? `RATE LIMITED (${cooldownRemainingSec}s)` : 'RATE LIMITED';
    bg = 'bg-orange-50 text-orange-700 border-orange-200';
    dotColor = 'bg-orange-500';
  } else if (isCircuitOpen) {
    label = cooldownRemainingSec > 0 ? `CIRCUIT OPEN (${cooldownRemainingSec}s)` : 'CIRCUIT OPEN';
    bg = 'bg-red-50 text-red-700 border-red-200';
    dotColor = 'bg-red-500';
  } else if (normalized.includes('DEGRADED')) {
    label = 'DEGRADED';
    bg = 'bg-amber-50 text-amber-700 border-amber-200';
    dotColor = 'bg-amber-500';
  } else if (normalized.includes('UNAVAILABLE')) {
    label = 'UNAVAILABLE';
    bg = 'bg-rose-50 text-rose-700 border-rose-200';
    dotColor = 'bg-rose-500';
  }

  return (
    <div className="flex flex-col items-end gap-0.5">
      <span
        className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${bg}`}
      >
        <span className={`w-1.5 h-1.5 rounded-full ${dotColor}`} />
        {label}
      </span>
      {simulationOverride && simulationOverride !== 'NONE' && (
        <span className="text-[9px] font-bold text-violet-700 bg-violet-50 border border-violet-200 px-1.5 py-0.2 rounded">
          Simulated: {simulationOverride}
        </span>
      )}
    </div>
  );
}
