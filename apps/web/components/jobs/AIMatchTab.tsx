"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  Sparkles,
  RefreshCw,
  Check,
  AlertTriangle,
  XCircle,
  Eye,
  Star,
  X,
  Download,
  Clock,
  Users,
  Loader2,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Database,
  Globe2,
  Filter,
  Settings2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  VerificationBadge,
  type VerificationTier,
} from "@/components/ui/verification-badge";
import {
  AvailabilityBadge,
  type AvailabilityStatus,
} from "@/components/ui/availability-badge";
import { ScoreBreakdown } from "@/components/ui/score-breakdown";
import { cn } from "@/lib/utils";

// =============================================================================
// Types
// =============================================================================

interface ScoreComponent {
  id: string;
  label: string;
  value: number;
  maxValue: number;
  color: string;
}

interface AIInsight {
  type: "strength" | "concern" | "red_flag";
  text: string;
}

interface MatchedCandidate {
  id: string;
  photo?: string;
  name: string;
  position: string;
  location: string;
  countryCode: string;
  availability: AvailabilityStatus;
  verificationTier: VerificationTier;
  overallScore: number;
  scoreBreakdown: ScoreComponent[];
  aiInsights: AIInsight[];
  aiSummary: string;
  noticePeriodDays?: number;
  source: "internal" | "yotspot";
  yotspotUrl?: string;
}

interface HardFilters {
  requireSTCW: boolean;
  requireENG1: boolean;
  visasRequired: string[];
  minExperience: number | null;
  availableBy: string | null;
}

interface AIMatchTabProps {
  jobId: string;
  jobTitle: string;
}

// =============================================================================
// Transform Helpers
// =============================================================================

function transformMatchResult(match: {
  candidateId: string;
  candidate: {
    id: string;
    first_name: string;
    last_name: string;
    photo_url?: string;
    primary_position?: string;
    nationality?: string;
    availability_status: string;
    available_from?: string;
    verification_tier: string;
  };
  score: number;
  breakdown: {
    qualifications: number;
    experience: number;
    availability: number;
    preferences: number;
    verification: number;
    aiAssessment: number;
  };
  strengths: string[];
  concerns: string[];
  aiSummary: string;
}): MatchedCandidate {
  const c = match.candidate;

  const availabilityMap: Record<string, AvailabilityStatus> = {
    available: "available",
    looking: "available",
    employed: "on_contract",
    unavailable: "not_looking",
    notice_period: "notice_period",
  };

  const verificationMap: Record<string, VerificationTier> = {
    basic: "basic",
    identity: "identity",
    verified: "verified",
    premium: "premium",
  };

  const scoreBreakdown: ScoreComponent[] = [
    {
      id: "qual",
      label: "Qualifications",
      value: match.breakdown.qualifications,
      maxValue: 25,
      color: "#3B82F6",
    },
    {
      id: "exp",
      label: "Experience",
      value: match.breakdown.experience,
      maxValue: 25,
      color: "#1D9A6C",
    },
    {
      id: "avail",
      label: "Availability",
      value: match.breakdown.availability,
      maxValue: 15,
      color: "#14B8A6",
    },
    {
      id: "pref",
      label: "Preferences",
      value: match.breakdown.preferences,
      maxValue: 15,
      color: "#8B5CF6",
    },
    {
      id: "verify",
      label: "Verification",
      value: match.breakdown.verification,
      maxValue: 10,
      color: "#B49A5E",
    },
    {
      id: "ai",
      label: "AI Assessment",
      value: match.breakdown.aiAssessment,
      maxValue: 10,
      color: "#1C2840",
    },
  ];

  const aiInsights: AIInsight[] = [
    ...match.strengths.map((text) => ({ type: "strength" as const, text })),
    ...match.concerns.map((text) => {
      const isRedFlag = /conflict|fired|terminated|expired|issue|problem/i.test(
        text
      );
      return {
        type: isRedFlag ? ("red_flag" as const) : ("concern" as const),
        text,
      };
    }),
  ];

  const nationalityToCode: Record<string, string> = {
    French: "FR",
    British: "GB",
    American: "US",
    Australian: "AU",
    South_African: "ZA",
    Spanish: "ES",
    Italian: "IT",
    German: "DE",
    Dutch: "NL",
    Polish: "PL",
  };
  const countryCode = nationalityToCode[c.nationality || ""] || "UN";

  return {
    id: c.id,
    photo: c.photo_url,
    name: `${c.first_name} ${c.last_name}`,
    position: c.primary_position || "Crew",
    location: c.nationality || "Unknown",
    countryCode,
    availability: availabilityMap[c.availability_status] || "not_looking",
    verificationTier: verificationMap[c.verification_tier] || "basic",
    overallScore: match.score,
    scoreBreakdown,
    aiInsights,
    aiSummary: match.aiSummary,
    source: "internal",
  };
}

function getCountryFlag(countryCode: string): string {
  if (countryCode === "UN") return "";
  const codePoints = countryCode
    .toUpperCase()
    .split("")
    .map((char) => 127397 + char.charCodeAt(0));
  return String.fromCodePoint(...codePoints);
}

// =============================================================================
// Candidate Card Component
// =============================================================================

function CandidateCard({
  candidate,
  selected,
  expanded,
  onSelect,
  onToggleExpand,
  onViewProfile,
  onAddToShortlist,
  onReject,
  isAddingToShortlist,
}: {
  candidate: MatchedCandidate;
  selected: boolean;
  expanded: boolean;
  onSelect: () => void;
  onToggleExpand: () => void;
  onViewProfile: () => void;
  onAddToShortlist: () => void;
  onReject: () => void;
  isAddingToShortlist?: boolean;
}) {
  const initials = candidate.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase();

  const strengths = candidate.aiInsights.filter((i) => i.type === "strength");
  const concerns = candidate.aiInsights.filter((i) => i.type === "concern");
  const redFlags = candidate.aiInsights.filter((i) => i.type === "red_flag");

  const getScoreColor = (score: number) => {
    if (score >= 80)
      return "text-success-600 bg-success-50 border-success-200";
    if (score >= 60) return "text-gold-700 bg-gold-50 border-gold-200";
    return "text-warning-600 bg-warning-50 border-warning-200";
  };

  return (
    <div
      className={cn(
        "rounded-xl border bg-white transition-all",
        selected
          ? "border-gold-400 ring-2 ring-gold-400/20"
          : "border-gray-200",
        expanded && "shadow-md"
      )}
    >
      {/* Main Card Content */}
      <div className="p-4">
        <div className="flex items-start gap-4">
          {/* Checkbox */}
          <button
            onClick={onSelect}
            className={cn(
              "mt-1 flex size-5 shrink-0 items-center justify-center rounded border transition-colors",
              selected
                ? "border-gold-500 bg-gold-500 text-white"
                : "border-gray-300 bg-white hover:border-gray-400"
            )}
          >
            {selected && <Check className="size-3" />}
          </button>

          {/* Photo */}
          <div className="relative shrink-0">
            {candidate.photo ? (
              <img
                src={candidate.photo}
                alt={candidate.name}
                className="size-12 rounded-full object-cover ring-2 ring-gray-100"
              />
            ) : (
              <div className="flex size-12 items-center justify-center rounded-full bg-gradient-to-br from-navy-100 to-navy-200 text-sm font-semibold text-navy-600 ring-2 ring-gray-100">
                {initials}
              </div>
            )}
            <div className="absolute -bottom-1 -right-1">
              <VerificationBadge tier={candidate.verificationTier} size="sm" />
            </div>
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-navy-900">
                    {candidate.name}
                  </h3>
                  {/* Source badge */}
                  <span
                    className={cn(
                      "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium",
                      candidate.source === "internal"
                        ? "bg-navy-100 text-navy-700"
                        : "bg-purple-100 text-purple-700"
                    )}
                  >
                    {candidate.source === "internal" ? (
                      <>
                        <Database className="size-3" />
                        Internal
                      </>
                    ) : (
                      <>
                        <Globe2 className="size-3" />
                        YotSpot
                      </>
                    )}
                  </span>
                </div>
                <p className="text-sm text-gray-600">{candidate.position}</p>
                <div className="mt-1 flex flex-wrap items-center gap-3">
                  <span className="flex items-center gap-1 text-sm text-gray-500">
                    <span className="text-base">
                      {getCountryFlag(candidate.countryCode)}
                    </span>
                    {candidate.location}
                  </span>
                  <AvailabilityBadge
                    status={candidate.availability}
                    noticePeriodDays={candidate.noticePeriodDays}
                  />
                </div>
              </div>

              {/* Score */}
              <div
                className={cn(
                  "flex flex-col items-center rounded-lg border px-4 py-2",
                  getScoreColor(candidate.overallScore)
                )}
              >
                <span className="text-2xl font-bold">
                  {candidate.overallScore}
                </span>
                <span className="text-xs font-medium opacity-80">/100</span>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mt-4 flex items-center justify-between">
          <button
            onClick={onToggleExpand}
            className="flex items-center gap-1 text-sm font-medium text-navy-600 hover:text-navy-800"
          >
            {expanded ? (
              <>
                <ChevronUp className="size-4" />
                Hide Details
              </>
            ) : (
              <>
                <ChevronDown className="size-4" />
                View Details
              </>
            )}
          </button>
          <div className="flex items-center gap-2">
            {candidate.source === "yotspot" && candidate.yotspotUrl && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => window.open(candidate.yotspotUrl, "_blank")}
              >
                <ExternalLink className="size-4 mr-1" />
                YotSpot
              </Button>
            )}
            <Button variant="ghost" size="sm" onClick={onViewProfile}>
              <Eye className="size-4 mr-1" />
              Profile
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={onAddToShortlist}
              disabled={isAddingToShortlist}
            >
              {isAddingToShortlist ? (
                <Loader2 className="size-4 mr-1 animate-spin" />
              ) : (
                <Star className="size-4 mr-1" />
              )}
              Shortlist
            </Button>
            <button
              onClick={onReject}
              className="px-2 py-1 text-sm text-gray-500 hover:text-error-600 transition-colors"
            >
              Reject
            </button>
          </div>
        </div>
      </div>

      {/* Expanded Content */}
      {expanded && (
        <div className="border-t border-gray-100 bg-gray-50/50 p-4">
          {/* Score Breakdown */}
          <div className="mb-6">
            <h4 className="mb-3 text-sm font-semibold text-navy-900">
              Score Breakdown
            </h4>
            <ScoreBreakdown
              segments={candidate.scoreBreakdown}
              totalScore={candidate.overallScore}
              maxScore={100}
              size="sm"
            />
          </div>

          {/* AI Summary */}
          {candidate.aiSummary && (
            <div className="mb-6">
              <h4 className="mb-2 flex items-center gap-2 text-sm font-semibold text-navy-900">
                <Sparkles className="size-4 text-gold-500" />
                AI Summary
              </h4>
              <p className="text-sm text-gray-700 leading-relaxed">
                {candidate.aiSummary}
              </p>
            </div>
          )}

          {/* AI Insights */}
          <div>
            <h4 className="mb-3 flex items-center gap-2 text-sm font-semibold text-navy-900">
              <Sparkles className="size-4 text-gold-500" />
              AI Insights
            </h4>

            <div className="space-y-3">
              {/* Strengths */}
              {strengths.length > 0 && (
                <div>
                  <p className="mb-1.5 text-xs font-medium uppercase tracking-wide text-success-600">
                    Strengths
                  </p>
                  <ul className="space-y-1">
                    {strengths.map((insight, i) => (
                      <li
                        key={i}
                        className="flex items-start gap-2 text-sm text-gray-700"
                      >
                        <Check className="mt-0.5 size-4 shrink-0 text-success-500" />
                        {insight.text}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Concerns */}
              {concerns.length > 0 && (
                <div>
                  <p className="mb-1.5 text-xs font-medium uppercase tracking-wide text-warning-600">
                    Concerns
                  </p>
                  <ul className="space-y-1">
                    {concerns.map((insight, i) => (
                      <li
                        key={i}
                        className="flex items-start gap-2 text-sm text-gray-700"
                      >
                        <AlertTriangle className="mt-0.5 size-4 shrink-0 text-warning-500" />
                        {insight.text}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Red Flags */}
              {redFlags.length > 0 && (
                <div>
                  <p className="mb-1.5 text-xs font-medium uppercase tracking-wide text-error-600">
                    Red Flags
                  </p>
                  <ul className="space-y-1">
                    {redFlags.map((insight, i) => (
                      <li
                        key={i}
                        className="flex items-start gap-2 text-sm text-gray-700"
                      >
                        <XCircle className="mt-0.5 size-4 shrink-0 text-error-500" />
                        {insight.text}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// =============================================================================
// Filters Panel Component
// =============================================================================

function FiltersPanel({
  filters,
  onChange,
  isOpen,
  onToggle,
}: {
  filters: HardFilters;
  onChange: (filters: HardFilters) => void;
  isOpen: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white">
      <button
        onClick={onToggle}
        className="flex w-full items-center justify-between px-4 py-3 text-left"
      >
        <div className="flex items-center gap-2">
          <Filter className="size-4 text-gray-500" />
          <span className="font-medium text-navy-900">Hard Filters</span>
          <span className="text-xs text-gray-500">
            (candidates must match these)
          </span>
        </div>
        {isOpen ? (
          <ChevronUp className="size-4 text-gray-500" />
        ) : (
          <ChevronDown className="size-4 text-gray-500" />
        )}
      </button>

      {isOpen && (
        <div className="border-t border-gray-100 p-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {/* STCW */}
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={filters.requireSTCW}
                onChange={(e) =>
                  onChange({ ...filters, requireSTCW: e.target.checked })
                }
                className="rounded border-gray-300 text-gold-500 focus:ring-gold-500"
              />
              <span className="text-sm text-gray-700">Require STCW</span>
            </label>

            {/* ENG1 */}
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={filters.requireENG1}
                onChange={(e) =>
                  onChange({ ...filters, requireENG1: e.target.checked })
                }
                className="rounded border-gray-300 text-gold-500 focus:ring-gold-500"
              />
              <span className="text-sm text-gray-700">Require ENG1</span>
            </label>

            {/* Min Experience */}
            <div>
              <label className="block text-xs text-gray-500 mb-1">
                Min Experience
              </label>
              <select
                value={filters.minExperience ?? ""}
                onChange={(e) =>
                  onChange({
                    ...filters,
                    minExperience: e.target.value
                      ? parseInt(e.target.value)
                      : null,
                  })
                }
                className="w-full rounded-md border-gray-300 text-sm"
              >
                <option value="">Any</option>
                <option value="1">1+ years</option>
                <option value="2">2+ years</option>
                <option value="3">3+ years</option>
                <option value="5">5+ years</option>
                <option value="10">10+ years</option>
              </select>
            </div>

            {/* Available By */}
            <div>
              <label className="block text-xs text-gray-500 mb-1">
                Available By
              </label>
              <input
                type="date"
                value={filters.availableBy ?? ""}
                onChange={(e) =>
                  onChange({
                    ...filters,
                    availableBy: e.target.value || null,
                  })
                }
                className="w-full rounded-md border-gray-300 text-sm"
              />
            </div>
          </div>

          {/* Visas */}
          <div className="mt-4">
            <label className="block text-xs text-gray-500 mb-2">
              Required Visas
            </label>
            <div className="flex flex-wrap gap-2">
              {["Schengen", "B1/B2", "C1/D"].map((visa) => (
                <label
                  key={visa}
                  className={cn(
                    "flex items-center gap-1.5 rounded-full px-3 py-1 text-sm cursor-pointer border transition-colors",
                    filters.visasRequired.includes(visa)
                      ? "border-gold-400 bg-gold-50 text-gold-700"
                      : "border-gray-200 bg-white text-gray-700 hover:border-gray-300"
                  )}
                >
                  <input
                    type="checkbox"
                    checked={filters.visasRequired.includes(visa)}
                    onChange={(e) => {
                      const newVisas = e.target.checked
                        ? [...filters.visasRequired, visa]
                        : filters.visasRequired.filter((v) => v !== visa);
                      onChange({ ...filters, visasRequired: newVisas });
                    }}
                    className="sr-only"
                  />
                  {visa}
                </label>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// =============================================================================
// Main Component
// =============================================================================

export function AIMatchTab({ jobId, jobTitle }: AIMatchTabProps) {
  const router = useRouter();

  // State
  const [candidates, setCandidates] = React.useState<MatchedCandidate[]>([]);
  const [selectedIds, setSelectedIds] = React.useState<Set<string>>(new Set());
  const [expandedIds, setExpandedIds] = React.useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = React.useState(false);
  const [isRefreshing, setIsRefreshing] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [hasSearched, setHasSearched] = React.useState(false);

  // Search sources
  const [searchInternal, setSearchInternal] = React.useState(true);
  const [searchYotSpot, setSearchYotSpot] = React.useState(false);

  // Filters
  const [showFilters, setShowFilters] = React.useState(false);
  const [filters, setFilters] = React.useState<HardFilters>({
    requireSTCW: false,
    requireENG1: false,
    visasRequired: [],
    minExperience: null,
    availableBy: null,
  });

  // Stats
  const [stats, setStats] = React.useState({
    internalMatched: 0,
    yotspotMatched: 0,
    searchTimeMs: 0,
  });

  // Adding to shortlist state
  const [addingToShortlist, setAddingToShortlist] = React.useState<Set<string>>(
    new Set()
  );

  // Run AI match
  const runMatch = React.useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/jobs/${jobId}/match`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          limit: 30,
          sources: [
            ...(searchInternal ? ["internal"] : []),
            ...(searchYotSpot ? ["yotspot"] : []),
          ],
          hardFilters: {
            requireSTCW: filters.requireSTCW,
            requireENG1: filters.requireENG1,
            visasRequired:
              filters.visasRequired.length > 0
                ? filters.visasRequired
                : undefined,
            minExperience: filters.minExperience || undefined,
            availableBy: filters.availableBy || undefined,
          },
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to run match");
      }

      const data = await response.json();

      // Transform internal results
      const internalResults = (data.internal || data.matches || []).map(
        transformMatchResult
      );

      // Transform YotSpot results (preview format)
      const yotspotResults: MatchedCandidate[] = (data.yotspot || []).map(
        (preview: {
          yotspotProfileUrl: string;
          yotspotId: string;
          name: string;
          position: string;
          yearsExperience: number;
          availability: string;
          nationality: string;
          photoUrl: string;
          hasSTCW: boolean;
          hasENG1: boolean;
          matchScore: number;
          matchReasoning: string;
        }) => ({
          id: `yotspot-${preview.yotspotId || preview.yotspotProfileUrl}`,
          photo: preview.photoUrl,
          name: preview.name,
          position: preview.position || "Crew",
          location: preview.nationality || "Unknown",
          countryCode: "UN",
          availability: preview.availability?.includes("available")
            ? ("available" as AvailabilityStatus)
            : ("not_looking" as AvailabilityStatus),
          verificationTier: "basic" as VerificationTier,
          overallScore: preview.matchScore || 0,
          scoreBreakdown: [],
          aiInsights: preview.matchReasoning
            ? [{ type: "strength" as const, text: preview.matchReasoning }]
            : [],
          aiSummary: preview.matchReasoning || "",
          source: "yotspot" as const,
          yotspotUrl: preview.yotspotProfileUrl,
        })
      );

      // Combine and sort by score
      const allCandidates = [...internalResults, ...yotspotResults].sort(
        (a, b) => b.overallScore - a.overallScore
      );

      setCandidates(allCandidates);
      setHasSearched(true);

      // Expand first candidate
      if (allCandidates.length > 0) {
        setExpandedIds(new Set([allCandidates[0].id]));
      }

      setStats({
        internalMatched: internalResults.length,
        yotspotMatched: yotspotResults.length,
        searchTimeMs: data.search_time_ms || 0,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [jobId, searchInternal, searchYotSpot, filters]);

  // Handlers
  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const toggleExpand = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const selectAll = () => {
    if (selectedIds.size === candidates.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(candidates.map((c) => c.id)));
    }
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    runMatch();
  };

  const handleAddToShortlist = async (candidate: MatchedCandidate) => {
    setAddingToShortlist((prev) => new Set(prev).add(candidate.id));

    try {
      const response = await fetch(`/api/jobs/${jobId}/shortlist`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          candidates: [
            {
              candidateId:
                candidate.source === "internal"
                  ? candidate.id
                  : candidate.id.replace("yotspot-", ""),
              source: candidate.source,
              yotspotUrl: candidate.yotspotUrl,
              matchScore: candidate.overallScore,
              matchReasoning: candidate.aiSummary,
            },
          ],
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to add to shortlist");
      }

      // Remove from list after adding
      setCandidates((prev) => prev.filter((c) => c.id !== candidate.id));
      setSelectedIds((prev) => {
        const next = new Set(prev);
        next.delete(candidate.id);
        return next;
      });
    } catch (err) {
      console.error("Failed to add to shortlist:", err);
    } finally {
      setAddingToShortlist((prev) => {
        const next = new Set(prev);
        next.delete(candidate.id);
        return next;
      });
    }
  };

  const handleBulkAddToShortlist = async () => {
    const selectedCandidates = candidates.filter((c) => selectedIds.has(c.id));

    for (const candidate of selectedCandidates) {
      await handleAddToShortlist(candidate);
    }
  };

  const handleViewProfile = (candidate: MatchedCandidate) => {
    if (candidate.source === "internal") {
      router.push(`/candidates/${candidate.id}`);
    } else if (candidate.yotspotUrl) {
      window.open(candidate.yotspotUrl, "_blank");
    }
  };

  const handleReject = (candidateId: string) => {
    setCandidates((prev) => prev.filter((c) => c.id !== candidateId));
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.delete(candidateId);
      return next;
    });
  };

  // Initial state - not searched yet
  if (!hasSearched && !isLoading) {
    return (
      <div className="space-y-6">
        {/* Search Sources */}
        <div className="rounded-lg border border-gray-200 bg-white p-4">
          <h3 className="font-medium text-navy-900 mb-4">Search Sources</h3>
          <div className="flex items-center gap-6">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={searchInternal}
                onChange={(e) => setSearchInternal(e.target.checked)}
                className="rounded border-gray-300 text-gold-500 focus:ring-gold-500"
              />
              <Database className="size-4 text-navy-600" />
              <span className="text-sm text-gray-700">Internal Database</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={searchYotSpot}
                onChange={(e) => setSearchYotSpot(e.target.checked)}
                className="rounded border-gray-300 text-gold-500 focus:ring-gold-500"
              />
              <Globe2 className="size-4 text-purple-600" />
              <span className="text-sm text-gray-700">YotSpot</span>
              <span className="text-xs text-gray-400">(preview only)</span>
            </label>
          </div>
        </div>

        {/* Filters */}
        <FiltersPanel
          filters={filters}
          onChange={setFilters}
          isOpen={showFilters}
          onToggle={() => setShowFilters(!showFilters)}
        />

        {/* Run Match Button */}
        <div className="flex justify-center">
          <Button
            variant="primary"
            size="lg"
            onClick={runMatch}
            disabled={!searchInternal && !searchYotSpot}
            leftIcon={<Sparkles className="size-5" />}
          >
            Run AI Match
          </Button>
        </div>
      </div>
    );
  }

  // Loading state
  if (isLoading && !isRefreshing) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <div className="relative">
          <Loader2 className="size-12 animate-spin text-navy-600" />
          <Sparkles className="absolute -right-1 -top-1 size-5 text-gold-500 animate-pulse" />
        </div>
        <div className="text-center mt-4">
          <h3 className="text-lg font-semibold text-navy-900">
            Running AI Match...
          </h3>
          <p className="text-sm text-gray-600">
            Analyzing candidates and scoring matches
          </p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <XCircle className="size-12 text-error-500 mb-4" />
        <h3 className="text-lg font-semibold text-navy-900">Match Failed</h3>
        <p className="text-sm text-gray-600 mb-4">{error}</p>
        <Button variant="primary" onClick={runMatch}>
          Try Again
        </Button>
      </div>
    );
  }

  const allSelected =
    candidates.length > 0 && selectedIds.size === candidates.length;
  const someSelected = selectedIds.size > 0 && !allSelected;

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center justify-between rounded-lg border border-gray-200 bg-white p-3">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Users className="size-5 text-navy-600" />
            <span className="font-medium text-navy-900">
              {candidates.length} candidates
            </span>
          </div>

          {stats.internalMatched > 0 && (
            <span className="flex items-center gap-1 text-sm text-gray-600">
              <Database className="size-4" />
              {stats.internalMatched} internal
            </span>
          )}

          {stats.yotspotMatched > 0 && (
            <span className="flex items-center gap-1 text-sm text-purple-600">
              <Globe2 className="size-4" />
              {stats.yotspotMatched} YotSpot
            </span>
          )}

          {stats.searchTimeMs > 0 && (
            <span className="flex items-center gap-1 text-sm text-gray-500">
              <Clock className="size-4" />
              {(stats.searchTimeMs / 1000).toFixed(1)}s
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={selectAll}
            className={cn(
              "flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
              allSelected || someSelected
                ? "bg-gold-100 text-gold-800"
                : "text-gray-600 hover:bg-gray-100"
            )}
          >
            <span
              className={cn(
                "flex size-4 items-center justify-center rounded border",
                allSelected
                  ? "border-gold-500 bg-gold-500 text-white"
                  : someSelected
                    ? "border-gold-500 bg-gold-100"
                    : "border-gray-300"
              )}
            >
              {allSelected && <Check className="size-3" />}
              {someSelected && (
                <div className="size-1.5 rounded-sm bg-gold-500" />
              )}
            </span>
            Select All
          </button>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
            leftIcon={<Settings2 className="size-4" />}
          >
            Filters
          </Button>

          <Button
            variant="secondary"
            size="sm"
            onClick={handleRefresh}
            loading={isRefreshing}
            leftIcon={
              <RefreshCw
                className={cn("size-4", isRefreshing && "animate-spin")}
              />
            }
          >
            Refresh
          </Button>
        </div>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <FiltersPanel
          filters={filters}
          onChange={setFilters}
          isOpen={true}
          onToggle={() => setShowFilters(false)}
        />
      )}

      {/* Candidates List */}
      {candidates.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center rounded-lg border border-dashed border-gray-300 bg-white">
          <Users className="size-12 text-gray-300 mb-4" />
          <h3 className="text-lg font-semibold text-navy-900">
            No matches found
          </h3>
          <p className="text-sm text-gray-600 mt-1">
            Try adjusting the filters or search criteria
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {candidates.map((candidate) => (
            <CandidateCard
              key={candidate.id}
              candidate={candidate}
              selected={selectedIds.has(candidate.id)}
              expanded={expandedIds.has(candidate.id)}
              onSelect={() => toggleSelect(candidate.id)}
              onToggleExpand={() => toggleExpand(candidate.id)}
              onViewProfile={() => handleViewProfile(candidate)}
              onAddToShortlist={() => handleAddToShortlist(candidate)}
              onReject={() => handleReject(candidate.id)}
              isAddingToShortlist={addingToShortlist.has(candidate.id)}
            />
          ))}
        </div>
      )}

      {/* Bulk Actions */}
      {selectedIds.size > 0 && (
        <div className="sticky bottom-0 bg-white border-t border-gray-200 p-4 -mx-4 -mb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-600">
                <span className="font-semibold text-navy-900">
                  {selectedIds.size}
                </span>{" "}
                candidate{selectedIds.size !== 1 ? "s" : ""} selected
              </span>
              <button
                onClick={() => setSelectedIds(new Set())}
                className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
              >
                <X className="size-4" />
                Clear
              </button>
            </div>
            <div className="flex items-center gap-3">
              <Button variant="secondary" leftIcon={<Download className="size-4" />}>
                Export
              </Button>
              <Button
                variant="primary"
                leftIcon={<Star className="size-4" />}
                onClick={handleBulkAddToShortlist}
              >
                Add to Shortlist ({selectedIds.size})
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
