export default function ErrorState({ message, onRetry }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <div className="w-14 h-14 rounded-2xl bg-red-100 border border-red-200 flex items-center justify-center mb-4 shadow-sm">
        <svg className="w-7 h-7 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
        </svg>
      </div>
      <h3 className="text-base font-extrabold text-gray-900 mb-1">Backend Connection Error</h3>
      <p className="text-xs text-red-700 font-medium max-w-md bg-red-50 border border-red-200 rounded-xl px-4 py-3 mt-2 shadow-sm leading-relaxed break-words break-all max-w-full min-w-0">
        {message || 'Failed to connect to the backend API server.'}
      </p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="mt-4 px-4 py-2 text-xs font-bold text-violet-700 hover:text-violet-900 bg-violet-50 hover:bg-violet-100 border border-violet-200 rounded-xl transition"
        >
          Try Again
        </button>
      )}
    </div>
  );
}
