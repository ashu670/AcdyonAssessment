/**
 * Job card — displays one job listing.
 * All data comes directly from the real Greenhouse ingestion.
 */
export default function JobCard({ job }) {
  const postedDate = job.postedAt
    ? new Date(job.postedAt).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      })
    : 'Date unknown';

  // Strip any double-escaped HTML from the description for preview
  const descriptionPreview = job.description
    ? job.description
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&amp;/g, '&')
        .replace(/&quot;/g, '"')
        .replace(/<[^>]+>/g, ' ')  // strip HTML tags
        .replace(/\s+/g, ' ')
        .trim()
        .slice(0, 160)
    : 'No description available.';

  return (
    <article className="group bg-gray-900 border border-gray-800 rounded-2xl p-5 hover:border-violet-500/50 hover:bg-gray-900/80 transition-all duration-200 flex flex-col gap-4">
      {/* Top row: company + source badge */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-col gap-1 min-w-0">
          <h2 className="text-base font-semibold text-white leading-snug group-hover:text-violet-300 transition truncate">
            {job.title}
          </h2>
          <p className="text-sm text-gray-400 font-medium">{job.company}</p>
        </div>
        <span className="shrink-0 text-xs font-medium px-2.5 py-1 rounded-full bg-violet-950 text-violet-300 border border-violet-800">
          {job.source?.name || 'Greenhouse'}
        </span>
      </div>

      {/* Meta row */}
      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500">
        {job.location && (
          <span className="flex items-center gap-1">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            </svg>
            {job.location}
          </span>
        )}
        <span className="flex items-center gap-1">
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          {postedDate}
        </span>
      </div>

      {/* Description preview */}
      <p className="text-sm text-gray-500 leading-relaxed line-clamp-2">
        {descriptionPreview}
        {descriptionPreview.length === 160 && '…'}
      </p>

      {/* Action */}
      <div className="mt-auto pt-1">
        <a
          href={job.url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 text-sm font-medium text-violet-400 hover:text-violet-300 transition group/link"
        >
          View Job
          <svg className="w-4 h-4 group-hover/link:translate-x-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
          </svg>
        </a>
      </div>
    </article>
  );
}
