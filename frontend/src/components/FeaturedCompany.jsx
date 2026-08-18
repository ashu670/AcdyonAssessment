export default function FeaturedCompany({ onSelectCompany, selectedCompany }) {
  const companies = [
    { name: 'Stripe', source: 'Greenhouse', color: 'bg-indigo-600', icon: 'S' },
    { name: 'Spotify', source: 'Lever', color: 'bg-emerald-600', icon: 'S' },
    { name: 'Linear', source: 'Ashby', color: 'bg-violet-600', icon: 'L' },
    { name: 'Arbeitnow Jobs', source: 'Arbeitnow API', color: 'bg-rose-600', icon: 'A' },
  ];

  return (
    <div className="bg-white border border-gray-200/80 rounded-2xl p-6 shadow-sm">
      <h3 className="text-sm font-bold text-gray-900 tracking-tight mb-4">
        Featured Sources & Companies
      </h3>

      <div className="space-y-2.5">
        {companies.map((comp) => {
          const isSelected = selectedCompany?.toLowerCase() === comp.name.toLowerCase();
          return (
            <button
              key={comp.name}
              onClick={() => onSelectCompany(isSelected ? '' : comp.name)}
              className={`w-full flex items-center justify-between p-3 rounded-xl transition text-left border ${
                isSelected
                  ? 'bg-black text-white border-black shadow-sm'
                  : 'bg-gray-50/60 hover:bg-gray-100 border-gray-100 text-gray-900'
              }`}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`w-8 h-8 rounded-xl ${comp.color} text-white font-bold text-xs flex items-center justify-center shrink-0`}
                >
                  {comp.icon}
                </div>
                <div>
                  <span className="text-xs font-bold block leading-snug">
                    {comp.name}
                  </span>
                  <span
                    className={`text-[10px] block ${
                      isSelected ? 'text-gray-300' : 'text-gray-500'
                    }`}
                  >
                    via {comp.source}
                  </span>
                </div>
              </div>

              {isSelected && (
                <span className="text-xs font-semibold text-emerald-400">✓ Filtered</span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
