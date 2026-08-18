export default function EmptyState({ hasFilters, onClear }) {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <div className="w-16 h-16 rounded-2xl bg-gray-900 border border-gray-800 flex items-center justify-center mb-4">
        <svg className="w-8 h-8 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      </div>
      <h3 className="text-base font-semibold text-gray-300 mb-1">
        {hasFilters ? 'No jobs matched your search' : 'No jobs yet'}
      </h3>
      <p className="text-sm text-gray-600 max-w-xs">
        {hasFilters
          ? 'Try adjusting your search or location filter.'
          : 'Click "Run Ingestion" above to fetch live jobs from Greenhouse.'}
      </p>
      {hasFilters && (
        <button
          onClick={onClear}
          className="mt-4 text-sm text-violet-400 hover:text-violet-300 transition"
        >
          Clear filters
        </button>
      )}
    </div>
  );
}
