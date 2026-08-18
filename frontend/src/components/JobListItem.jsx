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
      className="group bg-white border border-gray-200/90 hover:border-gray-400 hover:shadow-md rounded-2xl p-4.5 sm:p-5 transition-all duration-200 cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-4"
    >
      {/* Left: Avatar + Title/Company */}
      <div className="flex items-center gap-4 min-w-0">
        {/* Brand Icon Avatar */}
        <div
          className={`w-12 h-12 rounded-2xl ${avatarClass} font-black text-lg flex items-center justify-center shrink-0 shadow-sm`}
        >
          {initialLetter}
        </div>

        <div className="min-w-0 flex flex-col gap-0.5">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
              {job.company}
            </span>
            <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 border border-gray-200">
              {job.source?.name || 'ATS'}
            </span>
          </div>
          <h3 className="text-base font-bold text-gray-900 group-hover:text-violet-600 transition truncate">
            {job.title}
          </h3>
        </div>
      </div>

      {/* Right: Work Type, Date, Arrow */}
      <div className="flex items-center justify-between sm:justify-end gap-6 text-xs text-gray-500 shrink-0 border-t sm:border-t-0 pt-2 sm:pt-0 border-gray-100">
        <div className="flex flex-col sm:items-end gap-0.5">
          <span className="font-semibold text-gray-700">{locationTag}</span>
          <span className="text-gray-400 font-medium">{postedDate}</span>
        </div>

        <div className="w-8 h-8 rounded-full bg-gray-50 group-hover:bg-black group-hover:text-white text-gray-400 flex items-center justify-center transition-colors">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </div>
      </div>
    </div>
  );
}
