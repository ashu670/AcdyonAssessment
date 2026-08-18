export default function ErrorState({ message, onRetry }) {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <div className="w-16 h-16 rounded-2xl bg-red-950/40 border border-red-900 flex items-center justify-center mb-4">
        <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
        </svg>
      </div>
      <h3 className="text-base font-semibold text-gray-300 mb-1">Something went wrong</h3>
      <p className="text-sm text-red-400 max-w-sm font-mono bg-red-950/30 border border-red-900/50 rounded-lg px-4 py-2 mt-2">
        {message || 'Failed to connect to the backend.'}
      </p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="mt-4 text-sm text-violet-400 hover:text-violet-300 transition"
        >
          Try again
        </button>
      )}
    </div>
  );
}
