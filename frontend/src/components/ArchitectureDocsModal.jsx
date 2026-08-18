export default function ArchitectureDocsModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div
        className="bg-white border border-gray-200 rounded-3xl max-w-3xl w-full max-h-[85vh] flex flex-col shadow-2xl text-gray-900 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/80">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-violet-100 text-violet-700 flex items-center justify-center font-bold text-sm">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
              </svg>
            </div>
            <div>
              <h2 className="text-base font-extrabold text-gray-900 leading-snug">Architecture & ATS Integration Docs</h2>
              <p className="text-xs text-gray-500 font-medium">Multi-Source Resilient Ingestion & SourceAdapter Contract</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 hover:text-gray-900 transition flex items-center justify-center text-sm font-bold"
          >
            ✕
          </button>
        </div>

        {/* Body Content */}
        <div className="p-6 overflow-y-auto space-y-5 text-xs leading-relaxed text-gray-600">
          {/* Visual Architecture Flow */}
          <section className="bg-gray-50 p-4 rounded-2xl border border-gray-200 space-y-3">
            <h3 className="text-xs font-bold text-violet-800 uppercase tracking-wider">Ingestion Pipeline Architecture</h3>
            <div className="font-mono text-[11px] text-gray-800 bg-white p-3.5 rounded-xl border border-gray-200/90 overflow-x-auto leading-relaxed shadow-sm">
{`Priority Orchestrator (Greenhouse ➔ Lever ➔ Ashby ➔ Arbeitnow)
                       │
       ┌───────────────┼───────────────┐
       ▼               ▼               ▼
GreenhouseAdapter  LeverAdapter   AshbyAdapter / Arbeitnow
       │               │               │
       └───────────────┼───────────────┘
                       ▼
            parseJobs() & normalizeJob()
                       ▼
            URL & Schema Validation
                       ▼
            Content Hash Deduplication
                       ▼
             PostgreSQL Storage (Prisma)`}
            </div>
          </section>

          {/* SourceAdapter Contract */}
          <section className="space-y-2">
            <h3 className="text-sm font-bold text-gray-900">1. The SourceAdapter Contract</h3>
            <p>
              Every ATS source adapter extends the base <code className="text-violet-700 font-mono font-semibold">SourceAdapter</code> class and implements three core methods:
            </p>
            <ul className="list-disc pl-5 space-y-1 font-mono text-[11px] text-gray-700">
              <li><strong className="text-gray-900">fetchJobs()</strong>: Makes HTTP requests to the public provider API.</li>
              <li><strong className="text-gray-900">parseJobs(rawResponse)</strong>: Maps provider-specific data payloads into normalized jobs.</li>
              <li><strong className="text-gray-900">normalizeJob(raw)</strong>: Validates job titles, companies, locations, and reachable URLs.</li>
            </ul>
          </section>

          {/* Supported Adapters */}
          <section className="space-y-2">
            <h3 className="text-sm font-bold text-gray-900">2. Supported ATS Sources</h3>
            <div className="grid sm:grid-cols-2 gap-3">
              <div className="bg-gray-50 p-3 rounded-xl border border-gray-200 space-y-1">
                <span className="font-bold text-gray-900 block">Greenhouse ATS</span>
                <p className="text-[11px] text-gray-500">Target: Stripe boards API (<code className="text-violet-700 font-semibold">boards-api.greenhouse.io</code>)</p>
              </div>
              <div className="bg-gray-50 p-3 rounded-xl border border-gray-200 space-y-1">
                <span className="font-bold text-gray-900 block">Lever ATS</span>
                <p className="text-[11px] text-gray-500">Target: Spotify postings API (<code className="text-violet-700 font-semibold">api.lever.co</code>)</p>
              </div>
              <div className="bg-gray-50 p-3 rounded-xl border border-gray-200 space-y-1">
                <span className="font-bold text-gray-900 block">Ashby ATS</span>
                <p className="text-[11px] text-gray-500">Target: Linear posting API (<code className="text-violet-700 font-semibold">api.ashbyhq.com</code>)</p>
              </div>
              <div className="bg-gray-50 p-3 rounded-xl border border-gray-200 space-y-1">
                <span className="font-bold text-gray-900 block">Arbeitnow Real Backup</span>
                <p className="text-[11px] text-gray-500">Target: Arbeitnow public job feed (<code className="text-violet-700 font-semibold">arbeitnow.com</code>)</p>
              </div>
            </div>
          </section>

          {/* Circuit Breaker & Fallback System */}
          <section className="space-y-2">
            <h3 className="text-sm font-bold text-gray-900">3. Circuit Breaker & Failover Mechanics</h3>
            <p>
              The Orchestrator evaluates real-time source health before making requests. If a source encounters HTTP 429 rate limits, it parses <code className="text-violet-700 font-mono font-semibold">Retry-After</code> headers or applies bounded exponential backoff. 3 consecutive failures transition the source circuit to <code className="text-amber-800 font-mono font-semibold">OPEN</code>, causing future runs to skip it during cooldown and failover instantly to the next available source.
            </p>
          </section>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-gray-100 bg-gray-50/80 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-semibold rounded-xl border border-gray-200 transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
