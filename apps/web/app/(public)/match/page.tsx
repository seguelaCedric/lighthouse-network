"use client";

import { Suspense } from "react";
import { Loader2, Sparkles, CheckCircle } from "lucide-react";
import { PublicHeader } from "@/components/pricing/PublicHeader";
import { PublicFooter } from "@/components/pricing/PublicFooter";
import { MatchFunnel } from "@/components/match";

function MatchPageContent() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 via-white to-gray-50">
      <PublicHeader />

      {/* Hero Section - Luxury Styled */}
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
              <radialGradient id="sunburst-fade" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#C3A578" stopOpacity="1" />
                <stop offset="100%" stopColor="#C3A578" stopOpacity="0.3" />
              </radialGradient>
            </defs>
            <g stroke="url(#sunburst-fade)" strokeWidth="0.5" fill="none">
              {/* Radiating lines from center */}
              {[...Array(36)].map((_, i) => {
                const angle = i * 10 * (Math.PI / 180);
                const x2 =
                  Math.round((50 + 70 * Math.cos(angle)) * 100) / 100;
                const y2 =
                  Math.round((50 + 70 * Math.sin(angle)) * 100) / 100;
                return (
                  <line
                    key={i}
                    x1="50%"
                    y1="50%"
                    x2={`${x2}%`}
                    y2={`${y2}%`}
                  />
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
              AI-Powered Candidate Search
            </div>
            <h1 className="font-cormorant text-5xl sm:text-6xl lg:text-7xl font-semibold tracking-tight text-white mb-6">
              Find Your Perfect
              <span className="block text-gradient-gold">Crew & Staff</span>
            </h1>
            <p className="mx-auto max-w-2xl text-lg text-white/90 sm:text-xl">
              Tell us what you need. Our AI instantly searches 5,000+ vetted
              yacht crew and private staff professionals.
            </p>
            {/* Trust indicators */}
            <div className="mt-8 flex flex-wrap items-center justify-center gap-6 text-sm text-gray-400">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-gold-400" />
                <span>Lead Captured First</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-gold-400" />
                <span>Consultant Follow-Up</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-gold-400" />
                <span>AI Preview Bonus</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content - New Funnel */}
      <section className="py-12 bg-gray-50">
        <div className="container max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
          <MatchFunnel />
        </div>
      </section>

      <PublicFooter />
    </div>
  );
}

export default function MatchPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-gold-500" />
        </div>
      }
    >
      <MatchPageContent />
    </Suspense>
  );
}
