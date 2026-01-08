"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { MatchQualityBadge } from "@/components/match/MatchQualityBadge";
import {
  Loader2,
  Users,
  ArrowRight,
  Globe,
  Briefcase,
  Languages,
  Shield,
  Sparkles,
} from "lucide-react";
import { LeadCaptureForm } from "@/components/match/LeadCaptureForm";
import { analytics } from "@/lib/analytics/seo-tracking";

interface AnonymizedCandidate {
  id: string;
  display_name: string;
  avatar_url: string | null;
  position: string;
  experience_years: number;
  rich_bio: string;
  career_highlights: string[];
  experience_summary: string;
  languages: string[];
  nationality: string;
  availability: string;
  match_score: number;
  key_strengths: string[];
  qualifications: string[];
  notable_employers: string[];
  why_good_fit: string;
  employee_qualities: string[];
  longevity_assessment: string;
}

interface MatchPreviewProps {
  position: string;
  location: string; // e.g., "Sydney, New South Wales, Australia"
  positionSlug?: string;
  locationSlug?: string;
}

export function MatchPreview({
  position,
  location,
  positionSlug,
  locationSlug,
}: MatchPreviewProps) {
  const router = useRouter();
  const [candidates, setCandidates] = useState<AnonymizedCandidate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalMatches, setTotalMatches] = useState<number | null>(null);
  const [showLeadCapture, setShowLeadCapture] = useState(false);

  // Generate pre-filled query
  const matchQuery = `Hire a ${position} in ${location}`;

  useEffect(() => {
    const fetchMatches = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch("/api/public/brief-match/", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            query: matchQuery,
            preview_mode: true, // Request limited results for preview
            limit: 3, // Show top 3 candidates
          }),
        });

        if (!response.ok) {
          throw new Error("Failed to fetch matches");
        }

        const data = await response.json();
        const candidates = data.candidates || [];
        const totalMatches = data.total_matches || data.total_found || candidates.length || 0;
        setCandidates(candidates);
        setTotalMatches(totalMatches);

        // Track match preview viewed
        if (candidates.length > 0) {
          analytics.trackMatchPreviewViewed(position, location, totalMatches);
        }
      } catch (err) {
        console.error("Match preview error:", err);
        setError("Unable to load candidate preview");
      } finally {
        setIsLoading(false);
      }
    };

    fetchMatches();
  }, [matchQuery, position, location]);

  const handleViewMore = () => {
    // Track event
    analytics.trackMatchPreviewViewMore(position, location);
    // Navigate to match page with pre-filled query
    const params = new URLSearchParams();
    params.set("query", matchQuery);
    router.push(`/match?${params.toString()}`);
  };

  const handleGetFullProfiles = () => {
    // Track event
    analytics.trackMatchPreviewGetProfiles(position, location);
    analytics.trackConversionStarted('match_preview_get_profiles', position, location, 'lead_capture');
    setShowLeadCapture(true);
  };

  const handleCandidateClick = (candidateId: string) => {
    analytics.trackMatchPreviewCandidateClick(position, location, candidateId);
  };

  if (isLoading) {
    return (
      <div className="rounded-2xl border border-gray-200 bg-white p-8 text-center">
        <div className="mx-auto mb-4 h-12 w-12">
          <div className="relative h-12 w-12">
            <div className="absolute inset-0 rounded-full bg-gold-500/10 animate-pulse"></div>
            <div className="absolute inset-2 rounded-full border-4 border-gray-100"></div>
            <div className="absolute inset-2 animate-spin rounded-full border-4 border-transparent border-t-gold-500 border-r-gold-300"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <Sparkles className="h-6 w-6 text-gold-500" />
            </div>
          </div>
        </div>
        <p className="text-sm text-gray-600">Finding matching candidates...</p>
      </div>
    );
  }

  if (error || candidates.length === 0) {
    return (
      <div className="rounded-2xl border border-gray-200 bg-gradient-to-br from-navy-50 to-navy-100 p-8 text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gold-100">
          <Users className="h-8 w-8 text-gold-600" />
        </div>
        <h3 className="mb-2 text-lg font-semibold text-navy-900">
          Find Your Perfect {position}
        </h3>
        <p className="mb-6 text-sm text-gray-600">
          Our team specializes in finding exceptional candidates for unique
          requirements. Get in touch to see matching professionals.
        </p>
        <Button onClick={handleGetFullProfiles} size="lg">
          Get Candidate Shortlist
          <ArrowRight className="ml-2 h-5 w-5" />
        </Button>
      </div>
    );
  }

  return (
    <>
      <div className="rounded-2xl border border-gray-200 bg-white shadow-lg">
        {/* Header */}
        <div className="border-b border-gray-200 bg-gradient-to-r from-navy-900 via-navy-800 to-navy-900 px-6 py-5">
          <div className="flex items-center justify-between">
            <div>
              <div className="mb-1 flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-gold-400" />
                <h3 className="text-lg font-semibold text-white">
                  Matching Candidates
                </h3>
              </div>
              <p className="text-sm text-gray-300">
                Preview of candidates matching your requirements
              </p>
            </div>
            {totalMatches !== null && totalMatches > candidates.length && (
              <div className="text-right">
                <div className="text-2xl font-bold text-white">
                  {totalMatches}
                </div>
                <div className="text-xs text-gray-300">Total matches</div>
              </div>
            )}
          </div>
        </div>

        {/* Candidate Cards */}
        <div className="divide-y divide-gray-200">
          {candidates.map((candidate, index) => (
            <div
              key={candidate.id}
              className="p-6 transition-colors hover:bg-gray-50 cursor-pointer"
              onClick={() => handleCandidateClick(candidate.id)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  handleCandidateClick(candidate.id);
                }
              }}
            >
              <div className="flex gap-4">
                {/* Avatar */}
                <div className="relative flex-shrink-0">
                  {candidate.avatar_url ? (
                    <div className="relative h-16 w-16 rounded-xl overflow-hidden ring-2 ring-gold-500/30">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={candidate.avatar_url}
                        alt=""
                        className="h-full w-full object-cover blur-[2px] scale-105"
                      />
                      <div className="absolute inset-0 bg-gradient-to-br from-navy-800/20 to-navy-900/30" />
                    </div>
                  ) : (
                    <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-gradient-to-br from-gold-400 to-gold-600 text-white text-xl font-bold ring-2 ring-gold-500/30">
                      {candidate.display_name?.charAt(0) ||
                        String.fromCharCode(65 + index)}
                    </div>
                  )}
                  <div className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 ring-2 ring-white shadow-lg">
                    <Shield className="h-3 w-3 text-white" />
                  </div>
                </div>

                {/* Candidate Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-4 mb-2">
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-navy-900 truncate">
                        {candidate.display_name}
                      </h4>
                      <p className="text-sm text-gold-600 font-medium">
                        {candidate.position}
                      </p>
                    </div>
                    <MatchQualityBadge
                      score={Math.round(candidate.match_score * 100)}
                      size="sm"
                    />
                  </div>

                  {/* Key Metrics */}
                  <div className="flex flex-wrap items-center gap-4 mb-3 text-sm text-gray-600">
                    <div className="flex items-center gap-1.5">
                      <Briefcase className="h-4 w-4 text-gold-600" />
                      <span>{candidate.experience_years}+ years</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Globe className="h-4 w-4 text-gold-600" />
                      <span>{candidate.nationality}</span>
                    </div>
                    {candidate.languages.length > 0 && (
                      <div className="flex items-center gap-1.5">
                        <Languages className="h-4 w-4 text-gold-600" />
                        <span>{candidate.languages.slice(0, 2).join(", ")}</span>
                        {candidate.languages.length > 2 && (
                          <span className="text-gray-400">
                            +{candidate.languages.length - 2}
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Why Good Fit */}
                  {candidate.why_good_fit && (
                    <p className="text-sm text-gray-700 line-clamp-2 mb-3">
                      {candidate.why_good_fit}
                    </p>
                  )}

                  {/* Key Strengths */}
                  {candidate.key_strengths && candidate.key_strengths.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {candidate.key_strengths.slice(0, 3).map((strength, i) => (
                        <span
                          key={i}
                          className="inline-flex items-center rounded-full bg-gold-50 px-2.5 py-1 text-xs font-medium text-gold-700 border border-gold-200"
                        >
                          {strength}
                        </span>
                      ))}
                      {candidate.key_strengths.length > 3 && (
                        <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-600">
                          +{candidate.key_strengths.length - 3} more
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* CTA Footer */}
        <div className="border-t border-gray-200 bg-gray-50 px-6 py-5">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-center sm:text-left">
              <p className="text-sm font-medium text-navy-900">
                {totalMatches !== null && totalMatches > candidates.length
                  ? `View ${totalMatches - candidates.length} more candidates`
                  : "Get full candidate profiles"}
              </p>
              <p className="text-xs text-gray-600 mt-1">
                Full CVs, references, and contact details available
              </p>
            </div>
            <div className="flex gap-3">
              {totalMatches !== null && totalMatches > candidates.length && (
                <Button
                  variant="secondary"
                  onClick={handleViewMore}
                  className="whitespace-nowrap"
                >
                  View All Matches
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              )}
              <Button onClick={handleGetFullProfiles} size="lg">
                Get Full Profiles
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Lead Capture Modal */}
      {showLeadCapture && (
        <LeadCaptureForm
          initialQuery={matchQuery}
          matchedCount={totalMatches || candidates.length}
          onClose={() => setShowLeadCapture(false)}
          variant="modal"
        />
      )}
    </>
  );
}

