export default function PrivacyPolicyModal({ isOpen, onClose }) {
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
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <div>
              <h2 className="text-base font-extrabold text-gray-900 leading-snug">Privacy Policy</h2>
              <p className="text-xs text-gray-500 font-medium">JobPulse Data Management & External Source Principles</p>
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
            <h3 className="text-sm font-bold text-gray-900">1. Information We Collect</h3>
            <p>
              JobPulse is a public job listings aggregator. We collect public career board data (job titles, descriptions, locations, and original application URLs) directly from official ATS APIs (Greenhouse, Lever, Ashby, Arbeitnow). We do not collect or request user personal credentials or passwords.
            </p>
          </section>

          <section className="space-y-1.5">
            <h3 className="text-sm font-bold text-gray-900">2. Use of Ingested Job Data</h3>
            <p>
              Ingested job records are normalized and stored in PostgreSQL solely to power search, filtering, deduplication, and resilience testing on the JobPulse platform.
            </p>
          </section>

          <section className="space-y-1.5">
            <h3 className="text-sm font-bold text-gray-900">3. External Links & Applications</h3>
            <p>
              JobPulse provides direct links to official employer career portals. Clicking &quot;Apply on Official Board&quot; redirects you directly to the verified employer listing page. JobPulse has no control over third-party career portals.
            </p>
          </section>

          <section className="space-y-1.5">
            <h3 className="text-sm font-bold text-gray-900">4. Data Retention & Cleanup</h3>
            <p>
              Job listings are updated automatically via normalized content hash comparisons. Stale or closed job listings are flagged or updated during scheduled ingestion runs.
            </p>
          </section>

          <section className="space-y-1.5">
            <h3 className="text-sm font-bold text-gray-900">5. Contact Information</h3>
            <p>
              For queries regarding job listings or technical integrations, contact <a href="mailto:admin@jobpulse.dev" className="text-violet-600 hover:underline font-mono font-medium">admin@jobpulse.dev</a>.
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
