/**
 * Pagination controls.
 */
export default function Pagination({ page, limit, total, onPageChange }) {
  const totalPages = Math.ceil(total / limit);
  if (totalPages <= 1) return null;

  const from = (page - 1) * limit + 1;
  const to = Math.min(page * limit, total);

  return (
    <div className="flex items-center justify-between">
      <p className="text-sm text-gray-500">
        Showing <span className="text-gray-300 font-medium">{from}–{to}</span> of{' '}
        <span className="text-gray-300 font-medium">{total}</span> jobs
      </p>

      <div className="flex items-center gap-2">
        <button
          id="prev-page-btn"
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          className="px-3 py-1.5 text-sm rounded-lg bg-gray-800 text-gray-300 hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed transition"
        >
          ← Prev
        </button>

        <span className="text-sm text-gray-400 tabular-nums">
          {page} / {totalPages}
        </span>

        <button
          id="next-page-btn"
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
          className="px-3 py-1.5 text-sm rounded-lg bg-gray-800 text-gray-300 hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed transition"
        >
          Next →
        </button>
      </div>
    </div>
  );
}
