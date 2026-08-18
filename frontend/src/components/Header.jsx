import { useState, useEffect, useRef } from 'react';

// Main header navigation component with search, category filtering, and ingestion triggers
export default function Header({
  onSearch,
  onCategorySelect,
  onOpenIngestionModal,
  onOpenSandboxModal,
  onResetFilters,
  sandboxActiveCount = 0,
}) {
  const [headerSearch, setHeaderSearch] = useState('');
  const [categoryDropdownOpen, setCategoryDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown menu on click outside or escape key
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setCategoryDropdownOpen(false);
      }
    }
    function handleKeyDown(event) {
      if (event.key === 'Escape') {
        setCategoryDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  // Handles header search submission
  function handleSearchSubmit(e) {
    e.preventDefault();
    if (onSearch) {
      onSearch(headerSearch);
    }
  }

  // Resets search and scrolls to top on logo click
  function handleLogoClick(e) {
    e.preventDefault();
    setHeaderSearch('');
    if (onResetFilters) {
      onResetFilters();
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  const categories = [
    { label: 'All Jobs', value: '' },
    { label: 'Engineering', value: 'Engineer' },
    { label: 'Design & UX', value: 'Design' },
    { label: 'Product', value: 'Product' },
    { label: 'Marketing', value: 'Marketing' },
    { label: 'Sales & GTM', value: 'Sales' },
  ];

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-30 shadow-sm w-full overflow-hidden">
      <div className="max-w-7xl mx-auto px-2.5 sm:px-6 lg:px-8 min-h-[4rem] sm:min-h-[4.5rem] py-2 flex items-center justify-between gap-1.5 sm:gap-4 w-full min-w-0">
        {/* Brand logo and title */}
        <div className="flex items-center gap-2 sm:gap-6 shrink-0 min-w-0">
          <button
            onClick={handleLogoClick}
            className="flex items-center gap-1.5 sm:gap-2 group text-left focus:outline-none shrink-0"
            title="Return to top & reset filters"
          >
            <div className="w-7 h-7 sm:w-9 sm:h-9 rounded-xl bg-black text-white flex items-center justify-center font-black text-sm sm:text-lg group-hover:scale-105 transition-transform shadow-md shrink-0">
              ✕
            </div>
            <span className="text-base sm:text-xl font-extrabold tracking-tight text-gray-900 truncate">
              JobPulse
            </span>
          </button>

          {/* Quick search input */}
          <form onSubmit={handleSearchSubmit} className="hidden md:block relative w-56 lg:w-80">
            <span className="absolute inset-y-0 left-3.5 flex items-center pointer-events-none text-gray-400">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </span>
            <input
              type="text"
              value={headerSearch}
              onChange={(e) => setHeaderSearch(e.target.value)}
              placeholder="Search for a job…"
              className="w-full bg-gray-100/80 hover:bg-gray-100 border border-transparent focus:border-gray-300 rounded-xl pl-10 pr-4 py-2 text-xs font-medium text-gray-900 placeholder-gray-500 focus:outline-none transition"
            />
          </form>
        </div>

        {/* Action navigation controls */}
        <div className="flex items-center gap-1.5 sm:gap-4 shrink-0">
          {/* Active sandbox badge indicator */}
          {sandboxActiveCount > 0 && (
            <button
              onClick={onOpenSandboxModal}
              className="inline-flex items-center gap-1 px-2 sm:px-3 py-1 sm:py-1.5 text-[10px] sm:text-[11px] font-bold text-amber-900 bg-amber-100 border border-amber-300 rounded-full transition hover:bg-amber-200"
              title="Click to manage Sandbox Overrides"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-amber-600 animate-ping" />
              <span className="hidden sm:inline">Sandbox Active ({sandboxActiveCount})</span>
              <span className="sm:hidden">Sandbox ({sandboxActiveCount})</span>
            </button>
          )}

          {/* Category dropdown menu */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setCategoryDropdownOpen(!categoryDropdownOpen)}
              className="flex items-center gap-1 px-2 sm:px-3 py-2 text-xs font-semibold text-gray-700 hover:text-black transition focus:outline-none"
            >
              <span className="hidden sm:inline">Browse by Category</span>
              <span className="sm:hidden">Categories</span>
              <svg className={`w-3.5 h-3.5 transition-transform ${categoryDropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {categoryDropdownOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-2xl shadow-xl py-2 z-50 animate-in fade-in duration-150">
                {categories.map((cat) => (
                  <button
                    key={cat.label}
                    onClick={() => {
                      onCategorySelect(cat.value, cat.label);
                      setCategoryDropdownOpen(false);
                    }}
                    className="w-full text-left px-4 py-2 text-xs font-medium text-gray-700 hover:bg-gray-100 hover:text-black transition"
                  >
                    {cat.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* AntiBot Sandbox modal button */}
          <button
            onClick={onOpenSandboxModal}
            className="hidden sm:inline-flex items-center gap-1.5 px-4 py-2.5 text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200/60 rounded-xl transition whitespace-nowrap shrink-0"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
            </svg>
            <span>Sandbox</span>
          </button>

          {/* Trigger ingestion action button */}
          <button
            onClick={onOpenIngestionModal}
            className="inline-flex items-center gap-1.5 px-3 sm:px-5 py-2 sm:py-2.5 bg-black hover:bg-gray-800 text-white text-xs font-bold rounded-xl transition shadow-sm active:scale-95 whitespace-nowrap shrink-0"
          >
            <span className="hidden sm:inline">Run Ingestion</span>
            <span className="sm:hidden">Ingest</span>
          </button>
        </div>
      </div>
    </header>
  );
}
