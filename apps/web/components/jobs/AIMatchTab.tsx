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
  CheckCheck,
  Trophy,
  Calendar,
  Trash2,
  CheckCircle2,
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

  // Bulk action state
  const [bulkActionInProgress, setBulkActionInProgress] = React.useState(false);
  const [bulkActionProgress, setBulkActionProgress] = React.useState({ current: 0, total: 0 });
  const [bulkActionSuccess, setBulkActionSuccess] = React.useState<number | null>(null);

  // Smart selection state (must be before any early returns)
  const [showSelectMenu, setShowSelectMenu] = React.useState(false);
  const selectMenuRef = React.useRef<HTMLDivElement>(null);

  // Close menu on click outside
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        selectMenuRef.current &&
        !selectMenuRef.current.contains(event.target as Node)
      ) {
        setShowSelectMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

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
    const total = selectedCandidates.length;

    setBulkActionInProgress(true);
    setBulkActionProgress({ current: 0, total });
    setBulkActionSuccess(null);

    let successCount = 0;

    for (let i = 0; i < selectedCandidates.length; i++) {
      const candidate = selectedCandidates[i];
      setBulkActionProgress({ current: i + 1, total });

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

        if (response.ok) {
          successCount++;
          // Remove from list after adding
          setCandidates((prev) => prev.filter((c) => c.id !== candidate.id));
          setSelectedIds((prev) => {
            const next = new Set(prev);
            next.delete(candidate.id);
            return next;
          });
        }
      } catch (err) {
        console.error("Failed to add to shortlist:", err);
      }
    }

    setBulkActionInProgress(false);
    setBulkActionSuccess(successCount);

    // Clear success message after 3 seconds
    setTimeout(() => {
      setBulkActionSuccess(null);
    }, 3000);
  };

  const handleBulkReject = () => {
    const selectedCandidateIds = Array.from(selectedIds);
    setCandidates((prev) => prev.filter((c) => !selectedIds.has(c.id)));
    setSelectedIds(new Set());
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
        {/* Hero Section */}
        <div className="text-center py-6">
          <div className="inline-flex items-center justify-center size-16 rounded-full bg-gradient-to-br from-gold-100 to-gold-200 mb-4">
            <Sparkles className="size-8 text-gold-600" />
          </div>
          <h2 className="text-xl font-semibold text-navy-900 mb-2">
            Find Your Perfect Candidates
          </h2>
          <p className="text-gray-600 max-w-md mx-auto">
            Our AI analyzes your job requirements and matches them against
            candidate profiles, qualifications, and experience.
          </p>
        </div>

        {/* Source Selection Cards */}
        <div>
          <h3 className="text-sm font-medium text-gray-700 mb-3">
            Search Sources
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Internal Database Card */}
            <button
              onClick={() => setSearchInternal(!searchInternal)}
              className={cn(
                "relative flex flex-col p-4 rounded-xl border-2 text-left transition-all",
                searchInternal
                  ? "border-navy-500 bg-navy-50 ring-2 ring-navy-500/20"
                  : "border-gray-200 bg-white hover:border-gray-300"
              )}
            >
              <div className="flex items-center gap-3 mb-2">
                <div
                  className={cn(
                    "flex items-center justify-center size-10 rounded-lg",
                    searchInternal ? "bg-navy-100" : "bg-gray-100"
                  )}
                >
                  <Database
                    className={cn(
                      "size-5",
                      searchInternal ? "text-navy-600" : "text-gray-500"
                    )}
                  />
                </div>
                <div>
                  <h4 className="font-medium text-navy-900">Internal Database</h4>
                  <p className="text-xs text-gray-500">Your registered candidates</p>
                </div>
                <div
                  className={cn(
                    "absolute top-4 right-4 size-5 rounded-full border-2 flex items-center justify-center",
                    searchInternal
                      ? "border-navy-500 bg-navy-500"
                      : "border-gray-300"
                  )}
                >
                  {searchInternal && <Check className="size-3 text-white" />}
                </div>
              </div>
              <p className="text-sm text-gray-600">
                Search through candidates already in your system with full profile
                access.
              </p>
            </button>

            {/* YotSpot Card */}
            <button
              onClick={() => setSearchYotSpot(!searchYotSpot)}
              className={cn(
                "relative flex flex-col p-4 rounded-xl border-2 text-left transition-all",
                searchYotSpot
                  ? "border-purple-500 bg-purple-50 ring-2 ring-purple-500/20"
                  : "border-gray-200 bg-white hover:border-gray-300"
              )}
            >
              <div className="flex items-center gap-3 mb-2">
                <div
                  className={cn(
                    "flex items-center justify-center size-10 rounded-lg",
                    searchYotSpot ? "bg-purple-100" : "bg-gray-100"
                  )}
                >
                  <Globe2
                    className={cn(
                      "size-5",
                      searchYotSpot ? "text-purple-600" : "text-gray-500"
                    )}
                  />
                </div>
                <div>
                  <h4 className="font-medium text-navy-900">YotSpot</h4>
                  <p className="text-xs text-gray-500">External talent pool</p>
                </div>
                <div
                  className={cn(
                    "absolute top-4 right-4 size-5 rounded-full border-2 flex items-center justify-center",
                    searchYotSpot
                      ? "border-purple-500 bg-purple-500"
                      : "border-gray-300"
                  )}
                >
                  {searchYotSpot && <Check className="size-3 text-white" />}
                </div>
              </div>
              <p className="text-sm text-gray-600 mb-2">
                Discover candidates from YotSpot&apos;s yacht crew network.
              </p>
              <span className="inline-flex items-center gap-1 text-xs font-medium text-purple-700 bg-purple-100 rounded-full px-2 py-0.5 w-fit">
                <Sparkles className="size-3" />
                Great for hard-to-fill positions
              </span>
            </button>
          </div>
        </div>

        {/* Filters */}
        <FiltersPanel
          filters={filters}
          onChange={setFilters}
          isOpen={showFilters}
          onToggle={() => setShowFilters(!showFilters)}
        />

        {/* CTA */}
        <div className="flex flex-col items-center gap-2 pt-2">
          <Button
            variant="primary"
            size="lg"
            onClick={runMatch}
            disabled={!searchInternal && !searchYotSpot}
            leftIcon={<Sparkles className="size-5" />}
          >
            Run AI Match
          </Button>
          <p className="text-xs text-gray-500">Typically finds 15-30 matches</p>
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

  // Smart selection handlers
  const selectBySource = (source: "internal" | "yotspot") => {
    const ids = candidates
      .filter((c) => c.source === source)
      .map((c) => c.id);
    setSelectedIds(new Set(ids));
    setShowSelectMenu(false);
  };

  const selectTopByScore = (count: number) => {
    const sorted = [...candidates].sort((a, b) => b.overallScore - a.overallScore);
    const ids = sorted.slice(0, count).map((c) => c.id);
    setSelectedIds(new Set(ids));
    setShowSelectMenu(false);
  };

  const selectAvailable = () => {
    const ids = candidates
      .filter((c) => c.availability === "available")
      .map((c) => c.id);
    setSelectedIds(new Set(ids));
    setShowSelectMenu(false);
  };

  const internalCount = candidates.filter((c) => c.source === "internal").length;
  const yotspotCount = candidates.filter((c) => c.source === "yotspot").length;
  const availableCount = candidates.filter((c) => c.availability === "available").length;

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center justify-between rounded-lg border border-gray-200 bg-white p-3">
        <div className="flex items-center gap-4">
          {/* Candidate count with selection badge */}
          <div className="flex items-center gap-2">
            <Users className="size-5 text-navy-600" />
            <span className="font-medium text-navy-900">
              {candidates.length} candidates
            </span>
            {selectedIds.size > 0 && (
              <span className="flex items-center gap-1 rounded-full bg-gold-100 px-2 py-0.5 text-xs font-semibold text-gold-700">
                <Check className="size-3" />
                {selectedIds.size} selected
              </span>
            )}
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
          {/* Smart Select Dropdown */}
          <div className="relative" ref={selectMenuRef}>
            <button
              onClick={() => setShowSelectMenu(!showSelectMenu)}
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
              Select
              <ChevronDown className="size-3" />
            </button>

            {/* Dropdown Menu */}
            {showSelectMenu && (
              <div className="absolute right-0 top-full z-20 mt-1 w-56 rounded-lg border border-gray-200 bg-white py-1 shadow-lg">
                <button
                  onClick={() => {
                    selectAll();
                    setShowSelectMenu(false);
                  }}
                  className="flex w-full items-center gap-3 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                >
                  <CheckCheck className="size-4 text-gray-500" />
                  <span>Select All ({candidates.length})</span>
                </button>
                <button
                  onClick={() => {
                    setSelectedIds(new Set());
                    setShowSelectMenu(false);
                  }}
                  className="flex w-full items-center gap-3 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                >
                  <X className="size-4 text-gray-500" />
                  <span>Clear Selection</span>
                </button>

                <div className="my-1 border-t border-gray-100" />

                <div className="px-3 py-1">
                  <span className="text-xs font-medium uppercase tracking-wide text-gray-400">
                    Smart Select
                  </span>
                </div>

                <button
                  onClick={() => selectTopByScore(5)}
                  className="flex w-full items-center gap-3 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                >
                  <Trophy className="size-4 text-gold-500" />
                  <span>Top 5 by Score</span>
                </button>
                <button
                  onClick={() => selectTopByScore(10)}
                  className="flex w-full items-center gap-3 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                >
                  <Trophy className="size-4 text-gold-500" />
                  <span>Top 10 by Score</span>
                </button>

                {availableCount > 0 && (
                  <button
                    onClick={selectAvailable}
                    className="flex w-full items-center gap-3 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                  >
                    <Calendar className="size-4 text-success-500" />
                    <span>Available Now ({availableCount})</span>
                  </button>
                )}

                {internalCount > 0 && yotspotCount > 0 && (
                  <>
                    <div className="my-1 border-t border-gray-100" />
                    <div className="px-3 py-1">
                      <span className="text-xs font-medium uppercase tracking-wide text-gray-400">
                        By Source
                      </span>
                    </div>
                  </>
                )}

                {internalCount > 0 && (
                  <button
                    onClick={() => selectBySource("internal")}
                    className="flex w-full items-center gap-3 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                  >
                    <Database className="size-4 text-navy-500" />
                    <span>Internal Only ({internalCount})</span>
                  </button>
                )}

                {yotspotCount > 0 && (
                  <button
                    onClick={() => selectBySource("yotspot")}
                    className="flex w-full items-center gap-3 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                  >
                    <Globe2 className="size-4 text-purple-500" />
                    <span>YotSpot Only ({yotspotCount})</span>
                  </button>
                )}
              </div>
            )}
          </div>

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

      {/* Floating Action Bar */}
      {(selectedIds.size > 0 || bulkActionSuccess !== null) && (
        <div className="fixed bottom-6 left-1/2 z-30 -translate-x-1/2">
          <div
            className={cn(
              "flex items-center gap-4 rounded-2xl border px-5 py-3 shadow-xl transition-all",
              bulkActionSuccess !== null
                ? "border-success-200 bg-success-50"
                : "border-gray-200 bg-white"
            )}
          >
            {/* Success State */}
            {bulkActionSuccess !== null && (
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center size-8 rounded-full bg-success-100">
                  <CheckCircle2 className="size-5 text-success-600" />
                </div>
                <span className="text-sm font-medium text-success-700">
                  {bulkActionSuccess} candidate{bulkActionSuccess !== 1 ? "s" : ""} added to shortlist
                </span>
              </div>
            )}

            {/* Loading State */}
            {bulkActionInProgress && (
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center size-8 rounded-full bg-gold-100">
                  <Loader2 className="size-5 text-gold-600 animate-spin" />
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-medium text-navy-900">
                    Adding to shortlist...
                  </span>
                  <span className="text-xs text-gray-500">
                    {bulkActionProgress.current} of {bulkActionProgress.total}
                  </span>
                </div>
                {/* Progress bar */}
                <div className="w-24 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gold-500 transition-all duration-300"
                    style={{
                      width: `${(bulkActionProgress.current / bulkActionProgress.total) * 100}%`,
                    }}
                  />
                </div>
              </div>
            )}

            {/* Selection State */}
            {!bulkActionInProgress && bulkActionSuccess === null && selectedIds.size > 0 && (
              <>
                {/* Selected count */}
                <div className="flex items-center gap-2">
                  <div className="flex items-center justify-center size-8 rounded-full bg-gold-100">
                    <span className="text-sm font-bold text-gold-700">
                      {selectedIds.size}
                    </span>
                  </div>
                  <span className="text-sm text-gray-600">
                    selected
                  </span>
                </div>

                <div className="h-6 w-px bg-gray-200" />

                {/* Actions */}
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleBulkReject}
                    className="text-gray-500 hover:text-error-600 hover:bg-error-50"
                  >
                    <Trash2 className="size-4" />
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    leftIcon={<Download className="size-4" />}
                  >
                    Export
                  </Button>
                  <Button
                    variant="primary"
                    size="sm"
                    leftIcon={<Star className="size-4" />}
                    onClick={handleBulkAddToShortlist}
                  >
                    Add to Shortlist
                  </Button>
                </div>

                <div className="h-6 w-px bg-gray-200" />

                {/* Clear */}
                <button
                  onClick={() => setSelectedIds(new Set())}
                  className="flex items-center justify-center size-7 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
                >
                  <X className="size-4" />
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
