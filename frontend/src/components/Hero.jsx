export default function Hero({ onPrimaryCTA }) {
  return (
    <section className="py-10 sm:py-16 text-center max-w-4xl mx-auto px-4">
      {/* Main Framer Heading */}
      <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold text-gray-900 tracking-tight leading-[1.15] break-words">
        Live Job Ingestion & Aggregation Platform
      </h1>

      {/* Subtitle */}
      <p className="mt-4 sm:mt-5 text-xs sm:text-base text-gray-600 max-w-2xl mx-auto leading-relaxed font-normal">
        Engineering assessment project for Acdyon. Ingests, normalizes, and aggregates live tech job postings directly from ATS endpoints (Greenhouse, Lever, and Ashby) with automatic circuit breakers, rate-limiting backoff, and developer failure simulation.
      </p>

      {/* Centered Black Pill CTA Button */}
      <div className="mt-6 sm:mt-8 flex justify-center">
        <button
          onClick={onPrimaryCTA}
          className="px-5 sm:px-6 py-3 sm:py-3.5 bg-black hover:bg-gray-800 text-white text-xs sm:text-sm font-bold rounded-xl transition shadow-lg shadow-black/10 active:scale-95 flex items-center gap-2 whitespace-nowrap shrink-0"
        >
          <span>Trigger Ingestion</span>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        </button>
      </div>
    </section>
  );
}
