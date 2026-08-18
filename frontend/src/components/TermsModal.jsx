export default function TermsModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div
        className="bg-white border border-gray-200 rounded-3xl max-w-2xl w-full max-h-[85vh] flex flex-col shadow-2xl text-gray-900 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/80">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-violet-100 text-violet-700 flex items-center justify-center font-bold text-sm">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div>
              <h2 className="text-base font-extrabold text-gray-900 leading-snug">Terms of Service</h2>
              <p className="text-xs text-gray-500 font-medium">JobPulse Usage Principles & API Service Terms</p>
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
        <div className="p-6 overflow-y-auto space-y-4 text-xs leading-relaxed text-gray-600">
          <section className="space-y-1.5">
            <h3 className="text-sm font-bold text-gray-900">1. Platform Scope</h3>
            <p>
              JobPulse is a multi-source job listing discovery engine built with circuit breaker resilience, rate-limit handling, and priority source fallbacks.
            </p>
          </section>

          <section className="space-y-1.5">
            <h3 className="text-sm font-bold text-gray-900">2. Accuracy of Job Listings</h3>
            <p>
              JobPulse ingests job postings directly from verified company ATS feeds (Greenhouse, Lever, Ashby, Arbeitnow). While we normalize and validate external URLs, job availability and application requirements are managed exclusively by hiring companies.
            </p>
          </section>

          <section className="space-y-1.5">
            <h3 className="text-sm font-bold text-gray-900">3. Permitted Usage</h3>
            <p>
              Users may search, filter, and view open job listings. System rate limits and circuit breaker policies are enforced on API ingestion endpoints to ensure platform availability.
            </p>
          </section>

          <section className="space-y-1.5">
            <h3 className="text-sm font-bold text-gray-900">4. Modifications to Service</h3>
            <p>
              JobPulse reserves the right to modify source adapters, priority fallback orders, and circuit breaker thresholds as necessary to maintain high availability.
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
