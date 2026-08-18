export default function JobListItem({ job, onClick }) {
  const postedDate = job.postedAt
    ? new Date(job.postedAt).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
    : 'Recently';

  // Generate a distinct avatar background color per company
  const companyKey = (job.company || 'JobPulse').toLowerCase();
  const avatarColors = {
    stripe: 'bg-indigo-600 text-white',
    spotify: 'bg-emerald-600 text-white',
    linear: 'bg-violet-600 text-white',
    dontechi: 'bg-purple-600 text-white',
    betatech: 'bg-rose-600 text-white',
  };
  const avatarClass =
    Object.keys(avatarColors).find((k) => companyKey.includes(k))
      ? avatarColors[Object.keys(avatarColors).find((k) => companyKey.includes(k))]
      : 'bg-black text-white';

  const initialLetter = (job.company || 'J').charAt(0).toUpperCase();

  // Location / Remote tag
  const locationTag = job.location ? job.location : 'Remote';

  return (
    <div
      onClick={onClick}
      className="group bg-white border border-gray-200/90 hover:border-gray-400 hover:shadow-md rounded-2xl p-3.5 sm:p-5 transition-all duration-200 cursor-pointer flex flex-row items-center justify-between gap-3 w-full max-w-full min-w-0 overflow-hidden"
    >
      {/* Left: Avatar + Title/Company */}
      <div className="flex items-center gap-3 min-w-0 flex-1">
        {/* Brand Icon Avatar */}
        <div
          className={`w-10 h-10 sm:w-12 sm:h-12 rounded-2xl ${avatarClass} font-black text-sm sm:text-lg flex items-center justify-center shrink-0 shadow-sm`}
        >
          {initialLetter}
        </div>

        <div className="min-w-0 flex-1 flex flex-col gap-1">
          <div className="flex items-center justify-between gap-2 min-w-0">
            <div className="flex items-center gap-1.5 min-w-0 flex-wrap">
              <span className="text-[11px] sm:text-xs font-bold text-gray-900 uppercase tracking-wide truncate max-w-[130px] sm:max-w-none">
                {job.company}
              </span>
              <span className="text-[9px] sm:text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-600 border border-gray-200 shrink-0">
                {job.source?.name || 'ATS'}
              </span>
            </div>
          </div>

          <h3 className="text-xs sm:text-base font-extrabold text-gray-900 group-hover:text-violet-600 transition leading-snug break-words max-w-full" style={{ overflowWrap: 'anywhere', wordBreak: 'break-word' }}>
            {job.title}
          </h3>

          <div className="flex items-center gap-1.5 text-[10px] sm:text-xs text-gray-400 font-medium pt-0.5">
            <span className="truncate">{locationTag}</span>
            <span>•</span>
            <span className="shrink-0">{postedDate}</span>
          </div>
        </div>
      </div>

      {/* Right: Chevron Arrow */}
      <div className="flex items-center justify-center shrink-0">
        <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-gray-50 group-hover:bg-black group-hover:text-white text-gray-400 flex items-center justify-center transition-colors shrink-0">
          <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </div>
      </div>
    </div>
  );
}
