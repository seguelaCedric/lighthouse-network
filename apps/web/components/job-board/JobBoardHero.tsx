"use client";

import { Search, Sparkles, CheckCircle, Briefcase, Ship, Globe, Home } from "lucide-react";

interface JobBoardHeroProps {
  jobCount: number;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onSearchSubmit: () => void;
}

export function JobBoardHero({
  jobCount,
  searchQuery,
  onSearchChange,
  onSearchSubmit,
}: JobBoardHeroProps) {
  return (
    <section className="relative overflow-hidden pt-28 pb-16">
      {/* Rich navy gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-navy-800 via-navy-900 to-[#0c1525]" />

      {/* Warm champagne ambient light from top */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_0%,rgba(195,165,120,0.15),transparent_60%)]" />

      {/* Subtle side accents for depth */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_50%_80%_at_0%_50%,rgba(195,165,120,0.06),transparent_50%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_50%_80%_at_100%_50%,rgba(195,165,120,0.06),transparent_50%)]" />

      {/* Art Deco sunburst pattern */}
      <div className="absolute inset-0 opacity-[0.15]">
        <svg
          className="h-full w-full"
          xmlns="http://www.w3.org/2000/svg"
          preserveAspectRatio="xMidYMid slice"
        >
          <defs>
            <radialGradient id="sunburst-fade-jobs" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#C3A578" stopOpacity="1" />
              <stop offset="100%" stopColor="#C3A578" stopOpacity="0.3" />
            </radialGradient>
          </defs>
          <g stroke="url(#sunburst-fade-jobs)" strokeWidth="0.5" fill="none">
            {/* Radiating lines from center */}
            {[...Array(36)].map((_, i) => {
              const angle = i * 10 * (Math.PI / 180);
              const x2 = Math.round((50 + 70 * Math.cos(angle)) * 100) / 100;
              const y2 = Math.round((50 + 70 * Math.sin(angle)) * 100) / 100;
              return (
                <line key={i} x1="50%" y1="50%" x2={`${x2}%`} y2={`${y2}%`} />
              );
            })}
          </g>
          {/* Concentric arcs */}
          <circle
            cx="50%"
            cy="50%"
            r="15%"
            fill="none"
            stroke="#C3A578"
            strokeWidth="0.3"
            opacity="0.5"
          />
          <circle
            cx="50%"
            cy="50%"
            r="30%"
            fill="none"
            stroke="#C3A578"
            strokeWidth="0.3"
            opacity="0.4"
          />
          <circle
            cx="50%"
            cy="50%"
            r="45%"
            fill="none"
            stroke="#C3A578"
            strokeWidth="0.3"
            opacity="0.3"
          />
        </svg>
      </div>

      <div className="container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        <div className="max-w-3xl mx-auto text-center">
          {/* Elegant badge */}
          <div className="inline-flex items-center gap-2 rounded-full border border-gold-500/30 bg-gold-500/10 px-5 py-2.5 text-sm font-medium text-gold-300 mb-8 backdrop-blur-sm">
            <Sparkles className="h-4 w-4" />
            {jobCount > 0 ? `${jobCount} Open Positions` : "Luxury Staff Jobs"}
          </div>

          <h1 className="font-cormorant text-5xl sm:text-6xl lg:text-7xl font-semibold tracking-tight text-white mb-6">
            Find Your Next
            <span className="block text-gradient-gold">Elite Position</span>
          </h1>

          <p className="mx-auto max-w-2xl text-lg text-white/90 sm:text-xl mb-10">
            Browse opportunities from top recruitment agencies worldwide.
            Yacht crew, private household staff, estate managers - your next career awaits.
          </p>

          {/* Search Bar */}
          <div className="max-w-2xl mx-auto">
            <div className="relative">
              <Search className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && onSearchSubmit()}
                placeholder="Search by position, location, or employer type..."
                className="w-full rounded-2xl border-0 bg-white py-4 pl-14 pr-32 text-navy-800 placeholder-gray-400 shadow-2xl focus:outline-none focus:ring-2 focus:ring-gold-500 text-base"
              />
              <button
                onClick={onSearchSubmit}
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded-xl bg-gradient-to-r from-gold-500 to-gold-600 px-6 py-2.5 font-medium text-white hover:from-gold-600 hover:to-gold-700 transition-all shadow-lg"
              >
                Search
              </button>
            </div>
          </div>

          {/* Trust indicators */}
          <div className="mt-10 flex flex-wrap items-center justify-center gap-6 text-sm text-gray-400">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-gold-400" />
              <span>Verified Employers</span>
            </div>
            <div className="flex items-center gap-2">
              <Ship className="h-4 w-4 text-gold-400" />
              <span>Yacht Positions</span>
            </div>
            <div className="flex items-center gap-2">
              <Home className="h-4 w-4 text-gold-400" />
              <span>Private Estates</span>
            </div>
            <div className="flex items-center gap-2">
              <Globe className="h-4 w-4 text-gold-400" />
              <span>Global Opportunities</span>
            </div>
            <div className="flex items-center gap-2">
              <Briefcase className="h-4 w-4 text-gold-400" />
              <span>Direct Apply</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
