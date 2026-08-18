import { useState } from 'react';

/**
 * Search + filter bar.
 * Calls onSearch(filters) when the user submits or clears.
 */
export default function SearchBar({ onSearch, initialValues = {} }) {
  const [search, setSearch] = useState(initialValues.search || '');
  const [location, setLocation] = useState(initialValues.location || '');

  function handleSubmit(e) {
    e.preventDefault();
    onSearch({ search: search.trim(), location: location.trim() });
  }

  function handleClear() {
    setSearch('');
    setLocation('');
    onSearch({ search: '', location: '' });
  }

  const hasFilters = search || location;

  return (
    <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3">
      {/* Keyword search */}
      <div className="relative flex-1">
        <span className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-gray-500">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </span>
        <input
          id="search-input"
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by title, company, or keyword…"
          className="w-full bg-gray-900 border border-gray-700 rounded-xl pl-10 pr-4 py-2.5 text-sm text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition"
        />
      </div>

      {/* Location filter */}
      <div className="relative sm:w-52">
        <span className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-gray-500">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </span>
        <input
          id="location-input"
          type="text"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          placeholder="Location…"
          className="w-full bg-gray-900 border border-gray-700 rounded-xl pl-10 pr-4 py-2.5 text-sm text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition"
        />
      </div>

      <button
        id="search-btn"
        type="submit"
        className="px-5 py-2.5 bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium rounded-xl transition focus:outline-none focus:ring-2 focus:ring-violet-500 focus:ring-offset-2 focus:ring-offset-gray-950"
      >
        Search
      </button>

      {hasFilters && (
        <button
          id="clear-btn"
          type="button"
          onClick={handleClear}
          className="px-4 py-2.5 bg-gray-800 hover:bg-gray-700 text-gray-300 text-sm font-medium rounded-xl transition focus:outline-none focus:ring-2 focus:ring-gray-500"
        >
          Clear
        </button>
      )}
    </form>
  );
}
