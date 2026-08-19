export default function Footer({
  onCategoryClick,
  onOpenPrivacy,
  onOpenTerms,
  onOpenArchitectureDocs,
}) {
  const categoryCol1 = [
    { label: 'Software Engineer Jobs', query: 'Software Engineer' },
    { label: 'Marketing Jobs', query: 'Marketing' },
    { label: 'Design & UX Jobs', query: 'Design' },
    { label: 'UI / UX Jobs', query: 'UI' },
  ];

  const categoryCol2 = [
    { label: 'Sales Jobs', query: 'Sales' },
    { label: 'Product Manager Jobs', query: 'Product' },
    { label: 'Customer Support Jobs', query: 'Support' },
    { label: 'Developer Jobs', query: 'Developer' },
  ];

  return (
    <footer className="bg-[#0b0c10] text-white pt-10 sm:pt-16 pb-20 sm:pb-12 border-t border-gray-900 w-full max-w-full overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 lg:gap-12 pb-8 sm:pb-12 border-b border-gray-800/60">
          {/* Logo & Tagline */}
          <div className="space-y-4 md:col-span-1">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-white text-black flex items-center justify-center font-black text-base shadow-sm">
                ✕
              </div>
              <span className="text-xl font-extrabold tracking-tight text-white">
                Acdyon
              </span>
            </div>
            <p className="text-xs text-gray-400 leading-relaxed">
              Resilient multi-source job discovery engine with live ATS ingestion, rate limit backoff, and circuit breaker fallbacks.
            </p>
          </div>

          {/* Links Col 1: Categories */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-gray-300 uppercase tracking-wider">
              Popular Categories
            </h4>
            <ul className="space-y-2 text-xs text-gray-400">
              {categoryCol1.map((item) => (
                <li key={item.label}>
                  <button
                    onClick={() => onCategoryClick(item.query, item.label)}
                    className="hover:text-white transition text-left"
                  >
                    {item.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Links Col 2: Roles */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-gray-300 uppercase tracking-wider">
              More Roles
            </h4>
            <ul className="space-y-2 text-xs text-gray-400">
              {categoryCol2.map((item) => (
                <li key={item.label}>
                  <button
                    onClick={() => onCategoryClick(item.query, item.label)}
                    className="hover:text-white transition text-left"
                  >
                    {item.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Resources Column */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-gray-300 uppercase tracking-wider">
              Platform Resources
            </h4>
            <ul className="space-y-2.5 text-xs text-gray-400">
              <li>
                <button
                  onClick={onOpenArchitectureDocs}
                  className="hover:text-violet-300 transition text-left flex items-center gap-1.5 font-medium text-violet-400"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                  </svg>
                  <span>Architecture & ATS Docs</span>
                </button>
              </li>
              <li>
                <button
                  onClick={onOpenPrivacy}
                  className="hover:text-white transition text-left"
                >
                  Privacy Policy
                </button>
              </li>
              <li>
                <button
                  onClick={onOpenTerms}
                  className="hover:text-white transition text-left"
                >
                  Terms of Service
                </button>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom copyright */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between text-xs text-gray-500 gap-4">
          <p>© {new Date().getFullYear()} Acdyon Engineering Assessment. Resilient Multi-Source Ingestion System.</p>
          <div className="flex items-center gap-6 text-gray-400">
            <button onClick={onOpenPrivacy} className="hover:text-white transition">Privacy Policy</button>
            <button onClick={onOpenTerms} className="hover:text-white transition">Terms of Service</button>
            <button onClick={onOpenArchitectureDocs} className="hover:text-violet-300 text-violet-400 transition">ATS Docs</button>
          </div>
        </div>
      </div>
    </footer>
  );
}
