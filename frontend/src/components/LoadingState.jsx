export default function LoadingState() {
  return (
    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {Array.from({ length: 9 }).map((_, i) => (
        <div key={i} className="bg-gray-900 border border-gray-800 rounded-2xl p-5 flex flex-col gap-4 animate-pulse">
          <div className="flex justify-between gap-3">
            <div className="flex flex-col gap-2 flex-1">
              <div className="h-4 bg-gray-800 rounded-lg w-3/4" />
              <div className="h-3 bg-gray-800 rounded-lg w-1/2" />
            </div>
            <div className="h-6 w-20 bg-gray-800 rounded-full shrink-0" />
          </div>
          <div className="flex gap-4">
            <div className="h-3 bg-gray-800 rounded w-24" />
            <div className="h-3 bg-gray-800 rounded w-20" />
          </div>
          <div className="space-y-2">
            <div className="h-3 bg-gray-800 rounded w-full" />
            <div className="h-3 bg-gray-800 rounded w-5/6" />
          </div>
        </div>
      ))}
    </div>
  );
}
