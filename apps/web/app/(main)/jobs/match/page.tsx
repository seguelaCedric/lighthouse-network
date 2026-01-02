"use client";

import * as React from "react";
import { Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
  Settings,
  RefreshCw,
  ChevronLeft,
  Check,
  AlertTriangle,
  XCircle,
  Eye,
  Star,
  X,
  Download,
  Clock,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Users,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { VerificationBadge, type VerificationTier } from "@/components/ui/verification-badge";
import { AvailabilityBadge, type AvailabilityStatus } from "@/components/ui/availability-badge";
import { ScoreBreakdown } from "@/components/ui/score-breakdown";
import { cn } from "@/lib/utils";

// Types matching the API response
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
}

interface JobDetails {
  id: string;
  title: string;
  vessel_name?: string;
  vessel_type?: string;
  vessel_size_meters?: number;
}

interface MatchResponse {
  matches: Array<{
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
  }>;
  total_candidates_matched: number;
  search_time_ms: number;
}

// Transform API response to component format
function transformMatchResult(match: MatchResponse["matches"][0]): MatchedCandidate {
  const c = match.candidate;

  // Map availability status
  const availabilityMap: Record<string, AvailabilityStatus> = {
    available: "available",
    looking: "available",
    employed: "on_contract",
    unavailable: "not_looking",
    notice_period: "notice_period",
  };

  // Map verification tier
  const verificationMap: Record<string, VerificationTier> = {
    basic: "basic",
    identity: "identity",
    verified: "verified",
    premium: "premium",
  };

  // Create score breakdown segments
  const scoreBreakdown: ScoreComponent[] = [
    { id: "qual", label: "Qualifications", value: match.breakdown.qualifications, maxValue: 25, color: "#3B82F6" },
    { id: "exp", label: "Experience", value: match.breakdown.experience, maxValue: 25, color: "#1D9A6C" },
    { id: "avail", label: "Availability", value: match.breakdown.availability, maxValue: 15, color: "#14B8A6" },
    { id: "pref", label: "Preferences", value: match.breakdown.preferences, maxValue: 15, color: "#8B5CF6" },
    { id: "verify", label: "Verification", value: match.breakdown.verification, maxValue: 10, color: "#B49A5E" },
    { id: "ai", label: "AI Assessment", value: match.breakdown.aiAssessment, maxValue: 10, color: "#1C2840" },
  ];

  // Create AI insights from strengths and concerns
  const aiInsights: AIInsight[] = [
    ...match.strengths.map((text) => ({ type: "strength" as const, text })),
    ...match.concerns.map((text) => {
      // Categorize as red_flag if it contains certain keywords
      const isRedFlag = /conflict|fired|terminated|expired|issue|problem/i.test(text);
      return { type: isRedFlag ? "red_flag" as const : "concern" as const, text };
    }),
  ];

  // Get country code from nationality (simplified)
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
    Portuguese: "PT",
    Greek: "GR",
    Croatian: "HR",
    New_Zealander: "NZ",
    Canadian: "CA",
    Irish: "IE",
    Swedish: "SE",
    Norwegian: "NO",
    Danish: "DK",
    Filipino: "PH",
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
  };
}

// Country flag emoji helper
function getCountryFlag(countryCode: string): string {
  if (countryCode === "UN") return "🌍";
  const codePoints = countryCode
    .toUpperCase()
    .split("")
    .map((char) => 127397 + char.charCodeAt(0));
  return String.fromCodePoint(...codePoints);
}

// Candidate Card Component
function CandidateCard({
  candidate,
  selected,
  expanded,
  onSelect,
  onToggleExpand,
  onViewProfile,
  onAddToShortlist,
  onReject,
}: {
  candidate: MatchedCandidate;
  selected: boolean;
  expanded: boolean;
  onSelect: () => void;
  onToggleExpand: () => void;
  onViewProfile: () => void;
  onAddToShortlist: () => void;
  onReject: () => void;
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
    if (score >= 80) return "text-success-600 bg-success-50 border-success-200";
    if (score >= 60) return "text-gold-700 bg-gold-50 border-gold-200";
    return "text-warning-600 bg-warning-50 border-warning-200";
  };

  return (
    <div
      className={cn(
        "rounded-xl border bg-white transition-all",
        selected ? "border-gold-400 ring-2 ring-gold-400/20" : "border-gray-200",
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
                <h3 className="font-semibold text-navy-900">{candidate.name}</h3>
                <p className="text-sm text-gray-600">{candidate.position}</p>
                <div className="mt-1 flex flex-wrap items-center gap-3">
                  <span className="flex items-center gap-1 text-sm text-gray-500">
                    <span className="text-base">{getCountryFlag(candidate.countryCode)}</span>
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
                <span className="text-2xl font-bold">{candidate.overallScore}</span>
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
            <Button variant="ghost" size="sm" onClick={onViewProfile}>
              <Eye className="size-4 mr-1" />
              Profile
            </Button>
            <Button variant="primary" size="sm" onClick={onAddToShortlist}>
              <Star className="size-4 mr-1" />
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
            <h4 className="mb-3 text-sm font-semibold text-navy-900">Score Breakdown</h4>
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
              <p className="text-sm text-gray-700 leading-relaxed">{candidate.aiSummary}</p>
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
                      <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
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
                      <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
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
                      <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
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

// Loading Skeleton
function LoadingSkeleton() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center bg-gray-50">
      <div className="flex flex-col items-center gap-4">
        <div className="relative">
          <Loader2 className="size-12 animate-spin text-navy-600" />
          <Sparkles className="absolute -right-1 -top-1 size-5 text-gold-500 animate-pulse" />
        </div>
        <div className="text-center">
          <h2 className="text-lg font-semibold text-navy-900">Running AI Match...</h2>
          <p className="text-sm text-gray-600">Analyzing candidates and scoring matches</p>
        </div>
      </div>
    </div>
  );
}

// Error State
function ErrorState({ error, onRetry }: { error: string; onRetry: () => void }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center bg-gray-50">
      <div className="flex flex-col items-center gap-4 text-center">
        <XCircle className="size-12 text-error-500" />
        <div>
          <h2 className="text-lg font-semibold text-navy-900">Match Failed</h2>
          <p className="text-sm text-gray-600">{error}</p>
        </div>
        <Button variant="primary" onClick={onRetry}>
          Try Again
        </Button>
      </div>
    </div>
  );
}

// Loading Skeleton for Suspense fallback
function JobMatchSkeleton() {
  return (
    <div className="flex min-h-[400px] items-center justify-center">
      <div className="text-center">
        <Loader2 className="mx-auto size-10 animate-spin text-gold-500" />
        <p className="mt-3 text-gray-500">Loading AI Match...</p>
      </div>
    </div>
  );
}

// Main Component with useSearchParams
function JobMatchContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const jobId = searchParams.get("jobId");

  // State
  const [job, setJob] = React.useState<JobDetails | null>(null);
  const [candidates, setCandidates] = React.useState<MatchedCandidate[]>([]);
  const [selectedIds, setSelectedIds] = React.useState<Set<string>>(new Set());
  const [expandedIds, setExpandedIds] = React.useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = React.useState(true);
  const [isRefreshing, setIsRefreshing] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [stats, setStats] = React.useState({
    totalSearched: 0,
    totalMatched: 0,
    searchTimeSeconds: 0,
  });
  const [isAddingToShortlist, setIsAddingToShortlist] = React.useState(false);

  // Fetch job details
  const fetchJob = React.useCallback(async (id: string) => {
    const response = await fetch(`/api/jobs/${id}`);
    if (!response.ok) {
      throw new Error("Failed to fetch job details");
    }
    const data = await response.json();
    return data.data as JobDetails;
  }, []);

  // Run AI match
  const runMatch = React.useCallback(async (id: string) => {
    const response = await fetch(`/api/jobs/${id}/match`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ limit: 20 }),
    });
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Failed to run match");
    }
    return (await response.json()) as MatchResponse;
  }, []);

  // Load data on mount
  React.useEffect(() => {
    if (!jobId) {
      setError("No job ID provided");
      setIsLoading(false);
      return;
    }

    const loadData = async () => {
      setIsLoading(true);
      setError(null);

      try {
        // Fetch job details first
        const jobData = await fetchJob(jobId);
        setJob(jobData);

        // Run AI match
        const matchData = await runMatch(jobId);

        // Transform and set candidates
        const transformed = matchData.matches.map(transformMatchResult);
        setCandidates(transformed);

        // Expand first candidate by default
        if (transformed.length > 0) {
          setExpandedIds(new Set([transformed[0].id]));
        }

        // Set stats
        setStats({
          totalSearched: matchData.total_candidates_matched * 10, // Estimate
          totalMatched: matchData.total_candidates_matched,
          searchTimeSeconds: matchData.search_time_ms / 1000,
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [jobId, fetchJob, runMatch]);

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

  const handleRefresh = async () => {
    if (!jobId) return;
    setIsRefreshing(true);
    try {
      const matchData = await runMatch(jobId);
      const transformed = matchData.matches.map(transformMatchResult);
      setCandidates(transformed);
      setStats({
        totalSearched: matchData.total_candidates_matched * 10,
        totalMatched: matchData.total_candidates_matched,
        searchTimeSeconds: matchData.search_time_ms / 1000,
      });
      setSelectedIds(new Set());
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleAddToShortlist = async (candidateId: string) => {
    if (!jobId) return;
    try {
      const response = await fetch(`/api/jobs/${jobId}/applications`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          candidate_id: candidateId,
          stage: "shortlisted",
          source: "ai_match",
        }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to add to shortlist");
      }
      // Remove from list after adding
      setCandidates((prev) => prev.filter((c) => c.id !== candidateId));
      setSelectedIds((prev) => {
        const next = new Set(prev);
        next.delete(candidateId);
        return next;
      });
    } catch (err) {
      console.error("Failed to add to shortlist:", err);
      // Could show a toast here
    }
  };

  const handleBulkAddToShortlist = async () => {
    if (!jobId || selectedIds.size === 0) return;
    setIsAddingToShortlist(true);

    const selectedCandidates = Array.from(selectedIds);
    const results = await Promise.allSettled(
      selectedCandidates.map((candidateId) =>
        fetch(`/api/jobs/${jobId}/applications`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            candidate_id: candidateId,
            stage: "shortlisted",
            source: "ai_match",
          }),
        })
      )
    );

    // Remove successfully added candidates
    const successfulIds = selectedCandidates.filter(
      (_, i) => results[i].status === "fulfilled"
    );
    setCandidates((prev) => prev.filter((c) => !successfulIds.includes(c.id)));
    setSelectedIds(new Set());
    setIsAddingToShortlist(false);
  };

  const handleViewProfile = (candidateId: string) => {
    router.push(`/candidates/${candidateId}`);
  };

  const handleReject = (candidateId: string) => {
    // Remove from list (could also call an API to mark as rejected)
    setCandidates((prev) => prev.filter((c) => c.id !== candidateId));
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.delete(candidateId);
      return next;
    });
  };

  // Loading state
  if (isLoading) {
    return <LoadingSkeleton />;
  }

  // Error state
  if (error) {
    return (
      <ErrorState
        error={error}
        onRetry={() => {
          if (jobId) {
            setIsLoading(true);
            setError(null);
            fetchJob(jobId)
              .then((jobData) => {
                setJob(jobData);
                return runMatch(jobId);
              })
              .then((matchData) => {
                const transformed = matchData.matches.map(transformMatchResult);
                setCandidates(transformed);
                if (transformed.length > 0) {
                  setExpandedIds(new Set([transformed[0].id]));
                }
                setStats({
                  totalSearched: matchData.total_candidates_matched * 10,
                  totalMatched: matchData.total_candidates_matched,
                  searchTimeSeconds: matchData.search_time_ms / 1000,
                });
              })
              .catch((err) => setError(err instanceof Error ? err.message : "An error occurred"))
              .finally(() => setIsLoading(false));
          }
        }}
      />
    );
  }

  const allSelected = candidates.length > 0 && selectedIds.size === candidates.length;
  const someSelected = selectedIds.size > 0 && !allSelected;

  return (
    <div className="flex flex-1 flex-col bg-gray-50">
      {/* Header */}
      <header className="border-b border-gray-200 bg-white">
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              leftIcon={<ChevronLeft className="size-4" />}
              onClick={() => router.push(jobId ? `/jobs/${jobId}` : "/jobs")}
            >
              Back to Job
            </Button>
            <div className="h-6 w-px bg-gray-200" />
            <div>
              <h1 className="text-4xl font-serif font-semibold text-navy-800">
                {job?.title || "Loading..."}
              </h1>
              <p className="text-sm text-gray-600">
                {job?.vessel_name || ""}
                {job?.vessel_name && job?.vessel_type && " • "}
                {job?.vessel_type || ""}
                {job?.vessel_size_meters && ` • ${job.vessel_size_meters}m`}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" leftIcon={<Settings className="size-4" />}>
              Match Settings
            </Button>
            <Button
              variant="secondary"
              size="sm"
              leftIcon={<RefreshCw className={cn("size-4", isRefreshing && "animate-spin")} />}
              onClick={handleRefresh}
              loading={isRefreshing}
            >
              Run New Match
            </Button>
          </div>
        </div>

        {/* Match Summary Bar */}
        <div className="flex items-center justify-between border-t border-gray-100 bg-gray-50/50 px-6 py-3">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <Users className="size-5 text-navy-600" />
              <span className="font-semibold text-navy-900">
                {stats.totalMatched} candidates matched
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-sm text-gray-600">
              <Sparkles className="size-4" />
              Searched {stats.totalSearched} candidates
            </div>
            <div className="flex items-center gap-1.5 text-sm text-gray-500">
              <Clock className="size-4" />
              {stats.searchTimeSeconds.toFixed(1)}s
            </div>
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
                {someSelected && <div className="size-1.5 rounded-sm bg-gold-500" />}
              </span>
              Select All
            </button>
          </div>
        </div>
      </header>

      {/* Candidate List */}
      <main className="flex-1 overflow-y-auto p-6">
        <div className="mx-auto max-w-4xl space-y-4">
          {candidates.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Users className="size-12 text-gray-300 mb-4" />
              <h3 className="text-lg font-semibold text-navy-900">No matches found</h3>
              <p className="text-sm text-gray-600 mt-1">
                Try adjusting the job requirements or running a new match
              </p>
            </div>
          ) : (
            candidates.map((candidate) => (
              <CandidateCard
                key={candidate.id}
                candidate={candidate}
                selected={selectedIds.has(candidate.id)}
                expanded={expandedIds.has(candidate.id)}
                onSelect={() => toggleSelect(candidate.id)}
                onToggleExpand={() => toggleExpand(candidate.id)}
                onViewProfile={() => handleViewProfile(candidate.id)}
                onAddToShortlist={() => handleAddToShortlist(candidate.id)}
                onReject={() => handleReject(candidate.id)}
              />
            ))
          )}
        </div>
      </main>

      {/* Bottom Toolbar - Bulk Actions */}
      {selectedIds.size > 0 && (
        <div className="border-t border-gray-200 bg-white px-6 py-4">
          <div className="mx-auto flex max-w-4xl items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-600">
                <span className="font-semibold text-navy-900">{selectedIds.size}</span>{" "}
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
                Export List
              </Button>
              <Button
                variant="primary"
                leftIcon={<Star className="size-4" />}
                onClick={handleBulkAddToShortlist}
                loading={isAddingToShortlist}
              >
                Add Selected to Shortlist ({selectedIds.size})
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Page export with Suspense boundary
export default function JobMatchPage() {
  return (
    <Suspense fallback={<JobMatchSkeleton />}>
      <JobMatchContent />
    </Suspense>
  );
}
