import { useEffect } from 'react';

export default function JobDetailModal({ job, onClose }) {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!job) return null;

  const postedDate = job.postedAt
    ? new Date(job.postedAt).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : 'Recently';

  const rawDescription = job.description || 'No detailed description available.';
  const cleanDescription = rawDescription
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="bg-white border border-gray-200 rounded-3xl max-w-2xl w-full max-h-[85vh] flex flex-col shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="p-6 border-b border-gray-100 flex items-start justify-between gap-4 bg-gray-50/50">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl bg-black text-white font-black text-xl flex items-center justify-center shrink-0 shadow-md">
              {(job.company || 'J').charAt(0).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-gray-500 uppercase tracking-wide">
                  {job.company}
                </span>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-violet-100 text-violet-700 border border-violet-200">
                  {job.source?.name || 'ATS'}
                </span>
              </div>
              <h2 className="text-xl font-extrabold text-gray-900 mt-1 leading-tight">
                {job.title}
              </h2>
              <div className="flex items-center gap-4 mt-2 text-xs text-gray-500 font-medium">
                {job.location && (
                  <span className="flex items-center gap-1">
                    <svg className="w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <span>{job.location}</span>
                  </span>
                )}
                <span className="flex items-center gap-1">
                  <svg className="w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span>{postedDate}</span>
                </span>
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 hover:text-gray-900 flex items-center justify-center transition shrink-0"
          >
            ✕
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-4 text-sm text-gray-700 leading-relaxed font-normal">
          <div
            className="prose prose-sm max-w-none text-gray-700 [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_h1]:text-lg [&_h1]:font-bold [&_h2]:text-base [&_h2]:font-bold [&_h3]:text-sm [&_h3]:font-bold [&_p]:mb-3"
            dangerouslySetInnerHTML={{ __html: cleanDescription }}
          />
        </div>

        {/* Modal Footer */}
        <div className="p-5 border-t border-gray-100 bg-gray-50 flex items-center justify-between gap-4">
          <button
            onClick={onClose}
            className="px-4 py-2.5 bg-gray-200 hover:bg-gray-300 text-gray-800 text-xs font-semibold rounded-xl transition"
          >
            Close
          </button>

          <a
            href={job.url}
            target="_blank"
            rel="noopener noreferrer"
            className="px-6 py-2.5 bg-black hover:bg-gray-800 text-white text-xs font-bold rounded-xl transition shadow-md flex items-center gap-2"
          >
            <span>Apply on Official Board</span>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </a>
        </div>
      </div>
    </div>
  );
}
