"use client";

import * as React from "react";
import { Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Search,
  Sparkles,
  SlidersHorizontal,
  Grid3X3,
  List,
  ChevronLeft,
  ChevronRight,
  Check,
  RotateCcw,
  Clock,
  Eye,
  Briefcase,
  MessageSquare,
  BookmarkPlus,
  Loader2,
  Zap,
  Brain,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { VerificationBadge, type VerificationTier } from "@/components/ui/verification-badge";
import { AvailabilityBadge, type AvailabilityStatus } from "@/components/ui/availability-badge";
import { AddToJobModal } from "@/components/candidates/AddToJobModal";
import { useCandidates } from "@/hooks/useCandidates";
import { useV4SearchMutation, type V4SearchResult, type AgenticExplanation, type Verdict } from "@/hooks/useCVSearch";
import { cn } from "@/lib/utils";
import type { Candidate } from "@lighthouse/database";
import { SearchX, CheckCircle, XCircle, Info, AlertCircle } from "lucide-react";

// Position options
const positionOptions = [
  { value: "captain", label: "Captain" },
  { value: "first_officer", label: "First Officer" },
  { value: "second_officer", label: "Second Officer" },
  { value: "chief_engineer", label: "Chief Engineer" },
  { value: "second_engineer", label: "2nd Engineer" },
  { value: "eto", label: "ETO" },
  { value: "bosun", label: "Bosun" },
  { value: "lead_deckhand", label: "Lead Deckhand" },
  { value: "deckhand", label: "Deckhand" },
  { value: "chief_stewardess", label: "Chief Stewardess" },
  { value: "second_stewardess", label: "2nd Stewardess" },
  { value: "third_stewardess", label: "3rd Stewardess" },
  { value: "stewardess", label: "Stewardess" },
  { value: "head_chef", label: "Head Chef" },
  { value: "sous_chef", label: "Sous Chef" },
  { value: "chef", label: "Chef" },
];

// Map availability filter values to API status
const availabilityOptions = [
  { value: "available", label: "Available Now", apiValue: "available" },
  { value: "notice_period", label: "On Notice Period", apiValue: "notice_period" },
  { value: "on_contract", label: "On Contract", apiValue: "on_contract" },
  { value: "not_looking", label: "Not Looking", apiValue: "not_looking" },
];

// Map verification tier to numeric values (0-3)
const verificationOptions = [
  { value: 3, label: "Premium", tier: "premium" as VerificationTier },
  { value: 2, label: "Verified", tier: "verified" as VerificationTier },
  { value: 1, label: "Identity", tier: "identity" as VerificationTier },
  { value: 0, label: "Basic", tier: "basic" as VerificationTier },
];

// ============================================================================
// RELEVANCY BADGE - Human-readable match quality indicator
// ============================================================================
type RelevancyLevel = "excellent" | "strong" | "good" | "possible";

interface RelevancyConfig {
  label: string;
  color: string;
  bgColor: string;
  description: string;
}

const relevancyConfig: Record<RelevancyLevel, RelevancyConfig> = {
  excellent: {
    label: "Excellent Match",
    color: "text-emerald-700",
    bgColor: "bg-emerald-50 border-emerald-200",
    description: "Highly relevant to your search",
  },
  strong: {
    label: "Strong Match",
    color: "text-blue-700",
    bgColor: "bg-blue-50 border-blue-200",
    description: "Very relevant to your search",
  },
  good: {
    label: "Good Match",
    color: "text-amber-700",
    bgColor: "bg-amber-50 border-amber-200",
    description: "Relevant to your search",
  },
  possible: {
    label: "Possible Match",
    color: "text-gray-600",
    bgColor: "bg-gray-50 border-gray-200",
    description: "May be relevant",
  },
};

function getRelevancyLevel(score: number): RelevancyLevel {
  // Score ranges based on Cohere rerank or embedding similarity
  // These thresholds are tuned for semantic search results
  if (score >= 0.8) return "excellent";
  if (score >= 0.6) return "strong";
  if (score >= 0.45) return "good";
  return "possible";
}

function RelevancyBadge({ score }: { score: number }) {
  const level = getRelevancyLevel(score);
  const config = relevancyConfig[level];

  return (
    <div
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium",
        config.bgColor,
        config.color
      )}
      title={config.description}
    >
      <Sparkles className="size-3" />
      {config.label}
    </div>
  );
}

// ============================================================================
// V4 AGENTIC EXPLANATION PANEL - Shows AI reasoning for candidate match
// ============================================================================

const verdictConfig: Record<Verdict, { icon: typeof CheckCircle; color: string; bgColor: string; label: string }> = {
  strong_match: {
    icon: CheckCircle,
    color: "text-emerald-600",
    bgColor: "bg-emerald-50 border-emerald-200",
    label: "Strong Match",
  },
  good_match: {
    icon: CheckCircle,
    color: "text-blue-600",
    bgColor: "bg-blue-50 border-blue-200",
    label: "Good Match",
  },
  partial_match: {
    icon: AlertCircle,
    color: "text-amber-600",
    bgColor: "bg-amber-50 border-amber-200",
    label: "Partial Match",
  },
  weak_match: {
    icon: AlertCircle,
    color: "text-orange-600",
    bgColor: "bg-orange-50 border-orange-200",
    label: "Weak Match",
  },
  no_match: {
    icon: XCircle,
    color: "text-red-600",
    bgColor: "bg-red-50 border-red-200",
    label: "No Match",
  },
};

function AgenticExplanationPanel({ explanation }: { explanation: AgenticExplanation }) {
  const [isExpanded, setIsExpanded] = React.useState(false);
  const config = verdictConfig[explanation.verdict];
  const VerdictIcon = config.icon;

  return (
    <div className={cn("mt-3 rounded-lg border p-3", config.bgColor)}>
      <button
        onClick={(e) => {
          e.stopPropagation();
          setIsExpanded(!isExpanded);
        }}
        className="flex w-full items-center justify-between text-left"
      >
        <div className="flex items-center gap-2">
          <VerdictIcon className={cn("size-4", config.color)} />
          <span className="text-sm font-medium text-gray-900">{explanation.reasoning.summary}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className={cn("rounded-full px-2 py-0.5 text-xs font-semibold", config.bgColor, config.color)}>
            {explanation.fitScore}%
          </span>
          <ChevronRight
            className={cn(
              "size-4 text-gray-400 transition-transform",
              isExpanded && "rotate-90"
            )}
          />
        </div>
      </button>

      {isExpanded && (
        <div className="mt-3 space-y-2">
          {explanation.reasoning.strengths.length > 0 && (
            <div>
              <p className="mb-1 text-xs font-medium text-gray-500">Strengths:</p>
              <ul className="space-y-1">
                {explanation.reasoning.strengths.map((strength, i) => (
                  <li key={i} className="flex items-start gap-1.5 text-xs text-gray-700">
                    <CheckCircle className="size-3 shrink-0 mt-0.5 text-emerald-500" />
                    {strength}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {explanation.reasoning.concerns.length > 0 && (
            <div>
              <p className="mb-1 text-xs font-medium text-gray-500">Concerns:</p>
              <ul className="space-y-1">
                {explanation.reasoning.concerns.map((concern, i) => (
                  <li key={i} className="flex items-start gap-1.5 text-xs text-gray-600">
                    <AlertCircle className="size-3 shrink-0 mt-0.5 text-amber-500" />
                    {concern}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// Helper functions
function getCountryFlag(countryCode: string): string {
  if (!countryCode || countryCode.length !== 2) return "";
  const codePoints = countryCode
    .toUpperCase()
    .split("")
    .map((char) => 127397 + char.charCodeAt(0));
  return String.fromCodePoint(...codePoints);
}

function formatLastActive(date: string | null): string {
  if (!date) return "Unknown";
  const now = new Date();
  const lastActive = new Date(date);
  const diffMs = now.getTime() - lastActive.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;
  return `${Math.floor(diffDays / 7)}w ago`;
}

function mapVerificationTierToLegacy(tier: string): VerificationTier {
  // Tier is already a string type, just validate it's a known value
  const validTiers: VerificationTier[] = ["unverified", "basic", "identity", "references", "verified", "premium"];
  if (validTiers.includes(tier as VerificationTier)) {
    return tier as VerificationTier;
  }
  return "basic";
}

// Debounce hook
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = React.useState<T>(value);

  React.useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

// Filter Checkbox Component
function FilterCheckbox({
  label,
  checked,
  onChange,
  badge,
}: {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  badge?: React.ReactNode;
}) {
  return (
    <label className="flex cursor-pointer items-center justify-between py-1.5">
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => onChange(!checked)}
          className={cn(
            "flex size-4 items-center justify-center rounded border transition-colors",
            checked
              ? "border-gold-500 bg-gold-500 text-white"
              : "border-gray-300 bg-white hover:border-gray-400"
          )}
        >
          {checked && <Check className="size-3" />}
        </button>
        <span className="text-sm text-gray-700">{label}</span>
        {badge}
      </div>
    </label>
  );
}

// Range Slider Component
function RangeSlider({
  label,
  min,
  max,
  value,
  onChange,
  formatValue,
}: {
  label: string;
  min: number;
  max: number;
  value: [number, number];
  onChange: (value: [number, number]) => void;
  formatValue?: (val: number) => string;
}) {
  const format = formatValue || ((v) => v.toString());

  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <span className="text-sm font-medium text-gray-700">{label}</span>
        <span className="text-xs text-gray-500">
          {format(value[0])} - {format(value[1])}
        </span>
      </div>
      <div className="relative h-2">
        <div className="absolute inset-0 rounded-full bg-gray-200" />
        <div
          className="absolute h-full rounded-full bg-gold-500"
          style={{
            left: `${((value[0] - min) / (max - min)) * 100}%`,
            right: `${100 - ((value[1] - min) / (max - min)) * 100}%`,
          }}
        />
        <input
          type="range"
          min={min}
          max={max}
          value={value[0]}
          onChange={(e) => onChange([Number(e.target.value), value[1]])}
          className="absolute inset-0 h-full w-full cursor-pointer appearance-none bg-transparent [&::-webkit-slider-thumb]:size-4 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:shadow-md [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-gold-500"
        />
        <input
          type="range"
          min={min}
          max={max}
          value={value[1]}
          onChange={(e) => onChange([value[0], Number(e.target.value)])}
          className="absolute inset-0 h-full w-full cursor-pointer appearance-none bg-transparent [&::-webkit-slider-thumb]:size-4 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:shadow-md [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-gold-500"
        />
      </div>
    </div>
  );
}

// Extended candidate type with V4 AI search fields
type CandidateWithAI = Candidate & {
  _finalScore?: number;       // V4: Final fit score from agentic judge
  _vectorScore?: number;      // V4: Vector similarity score
  _agenticExplanation?: AgenticExplanation;  // V4: Claude Haiku reasoning
};

// Candidate Card Component
function CandidateCard({
  candidate,
  viewMode,
  onView,
  onAddToJob,
  showRelevancy = false,
}: {
  candidate: CandidateWithAI;
  viewMode: "grid" | "list";
  onView: () => void;
  onAddToJob: () => void;
  showRelevancy?: boolean;
}) {
  const [isHovered, setIsHovered] = React.useState(false);

  const fullName = `${candidate.first_name} ${candidate.last_name}`;
  const initials = `${candidate.first_name?.[0] || ""}${candidate.last_name?.[0] || ""}`.toUpperCase();
  const verificationTier = mapVerificationTierToLegacy(candidate.verification_tier);
  const finalScore = candidate._finalScore;
  const agenticExplanation = candidate._agenticExplanation;

  if (viewMode === "list") {
    return (
      <div
        className="flex items-center gap-4 rounded-lg border border-gray-200 bg-white p-4 transition-all hover:border-gray-300 hover:shadow-sm cursor-pointer"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onClick={onView}
      >
        {/* Photo */}
        <div className="relative shrink-0">
          {candidate.avatar_url ? (
            <img
              src={candidate.avatar_url}
              alt={fullName}
              className="size-12 rounded-full object-cover ring-2 ring-gray-100"
            />
          ) : (
            <div className="flex size-12 items-center justify-center rounded-full bg-gradient-to-br from-navy-100 to-navy-200 text-sm font-semibold text-navy-600 ring-2 ring-gray-100">
              {initials}
            </div>
          )}
          <div className="absolute -bottom-1 -right-1">
            <VerificationBadge tier={verificationTier} size="sm" />
          </div>
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-navy-900">{fullName}</h3>
            <AvailabilityBadge status={candidate.availability_status as AvailabilityStatus} />
            {showRelevancy && agenticExplanation && (
              <div
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium",
                  verdictConfig[agenticExplanation.verdict].bgColor,
                  verdictConfig[agenticExplanation.verdict].color
                )}
              >
                <Brain className="size-3" />
                {agenticExplanation.fitScore}% Fit
              </div>
            )}
          </div>
          <p className="text-sm text-gray-600">{candidate.primary_position || "No position"}</p>
        </div>

        {/* Details */}
        <div className="flex items-center gap-6 text-sm text-gray-500">
          <span>{candidate.years_experience ?? 0} yrs exp</span>
          <span className="flex items-center gap-1">
            {candidate.current_country && (
              <span>{getCountryFlag(candidate.current_country)}</span>
            )}
            {candidate.current_location || "Unknown"}
          </span>
          <span className="flex items-center gap-1">
            <Clock className="size-3.5" />
            {formatLastActive(candidate.last_active_at)}
          </span>
        </div>

        {/* Actions */}
        <div
          className={cn(
            "flex items-center gap-2 transition-opacity",
            isHovered ? "opacity-100" : "opacity-0"
          )}
        >
          <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); onView(); }}>
            <Eye className="size-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); onAddToJob(); }}>
            <Briefcase className="size-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={(e) => e.stopPropagation()}>
            <MessageSquare className="size-4" />
          </Button>
        </div>
      </div>
    );
  }

  // Grid view
  return (
    <div
      className="group relative overflow-hidden rounded-xl border border-gray-200 bg-white p-4 transition-all hover:border-gray-300 hover:shadow-md cursor-pointer"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={onView}
    >
      {/* Hover Actions Overlay */}
      <div
        className={cn(
          "absolute left-4 right-4 bottom-4 z-10 flex items-center justify-center gap-2 bg-white rounded-lg py-2 shadow-md border border-gray-200 transition-all",
          isHovered ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2 pointer-events-none"
        )}
      >
        <Button
          variant="primary"
          size="sm"
          className="size-8 p-0"
          onClick={(e) => { e.stopPropagation(); onAddToJob(); }}
          title="Add to Job"
        >
          <Briefcase className="size-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="size-8 p-0"
          onClick={(e) => e.stopPropagation()}
          title="Message"
        >
          <MessageSquare className="size-4" />
        </Button>
      </div>

      {/* Card Content */}
      <div className="flex flex-col items-center text-center pb-10">
        {/* Photo */}
        <div className="relative mb-3">
          {candidate.avatar_url ? (
            <img
              src={candidate.avatar_url}
              alt={fullName}
              className="size-16 rounded-full object-cover ring-2 ring-gray-100"
            />
          ) : (
            <div className="flex size-16 items-center justify-center rounded-full bg-gradient-to-br from-navy-100 to-navy-200 text-lg font-semibold text-navy-600 ring-2 ring-gray-100">
              {initials}
            </div>
          )}
          <div className="absolute -bottom-1 -right-1">
            <VerificationBadge tier={verificationTier} size="sm" />
          </div>
        </div>

        {/* Name & Position */}
        <h3 className="font-semibold text-navy-900">{fullName}</h3>
        <p className="text-sm text-gray-600">{candidate.primary_position || "No position"}</p>

        {/* V4 Fit Score Badge - AI Search Only */}
        {showRelevancy && agenticExplanation && (
          <div className="mt-2">
            <div
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium",
                verdictConfig[agenticExplanation.verdict].bgColor,
                verdictConfig[agenticExplanation.verdict].color
              )}
            >
              <Brain className="size-3" />
              {verdictConfig[agenticExplanation.verdict].label} ({agenticExplanation.fitScore}%)
            </div>
          </div>
        )}

        {/* Experience */}
        <p className="mt-1 text-sm font-medium text-navy-700">
          {candidate.years_experience ?? 0} years experience
        </p>

        {/* Location */}
        <p className="mt-2 flex items-center gap-1 text-sm text-gray-500">
          {candidate.current_country && (
            <span>{getCountryFlag(candidate.current_country)}</span>
          )}
          {candidate.current_location || "Unknown location"}
        </p>

        {/* Availability */}
        <div className="mt-3">
          <AvailabilityBadge status={candidate.availability_status as AvailabilityStatus} />
        </div>

        {/* Last Active */}
        <p className="mt-3 flex items-center gap-1 text-xs text-gray-400">
          <Clock className="size-3" />
          Last active: {formatLastActive(candidate.last_active_at)}
        </p>

        {/* V4 Agentic Explanation - AI Search Only */}
        {showRelevancy && agenticExplanation && (
          <AgenticExplanationPanel explanation={agenticExplanation} />
        )}
      </div>
    </div>
  );
}

// Main Component
function CandidateSearchPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Parse URL params
  const urlSearch = searchParams.get("q") || "";
  const urlPosition = searchParams.get("position") || "";
  const urlAvailability = searchParams.get("availability")?.split(",").filter(Boolean) || [];
  const urlVerification = searchParams.get("verification")?.split(",").map(Number).filter(n => !isNaN(n)) || [];
  const urlMinExp = searchParams.get("minExp") ? Number(searchParams.get("minExp")) : 0;
  const urlMaxExp = searchParams.get("maxExp") ? Number(searchParams.get("maxExp")) : 20;
  const urlPage = searchParams.get("page") ? Number(searchParams.get("page")) : 1;
  const urlLimit = searchParams.get("limit") ? Number(searchParams.get("limit")) : 25;
  const urlSort = searchParams.get("sort") || "created_at";
  const urlOrder = (searchParams.get("order") || "desc") as "asc" | "desc";
  const urlView = (searchParams.get("view") || "list") as "grid" | "list";

  // Local state
  const [searchQuery, setSearchQuery] = React.useState(urlSearch);
  const [sidebarOpen, setSidebarOpen] = React.useState(true);
  const [viewMode, setViewMode] = React.useState<"grid" | "list">(urlView);
  const [sortBy, setSortBy] = React.useState(urlSort);
  const [sortOrder, setSortOrder] = React.useState<"asc" | "desc">(urlOrder);
  const [currentPage, setCurrentPage] = React.useState(urlPage);
  const [pageSize, setPageSize] = React.useState(urlLimit);

  // Filter states
  const [selectedPosition, setSelectedPosition] = React.useState(urlPosition);
  const [selectedAvailability, setSelectedAvailability] = React.useState<string[]>(urlAvailability);
  const [selectedVerification, setSelectedVerification] = React.useState<number[]>(urlVerification);
  const [experienceRange, setExperienceRange] = React.useState<[number, number]>([urlMinExp, urlMaxExp]);

  // Modal state
  const [addToJobModal, setAddToJobModal] = React.useState<{
    open: boolean;
    candidateId: string;
    candidateName: string;
  }>({ open: false, candidateId: "", candidateName: "" });

  // AI Search state (V4 Agentic Search)
  const [useAISearch, setUseAISearch] = React.useState(false);
  const aiSearchMutation = useV4SearchMutation();

  // Debounce search
  const debouncedSearch = useDebounce(searchQuery, 300);

  // Trigger V4 Agentic AI search when enabled and query changes
  // V4 extracts all filters from natural language - no manual filters needed
  React.useEffect(() => {
    if (useAISearch && debouncedSearch && debouncedSearch.length >= 2) {
      console.log('[V4 Search] Triggering search for:', debouncedSearch);
      aiSearchMutation.mutate({
        query: debouncedSearch,
        limit: pageSize,
      });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [useAISearch, debouncedSearch, pageSize]);

  // Update URL when filters change
  const updateUrl = React.useCallback(
    (updates: Record<string, string | number | string[] | number[] | undefined>) => {
      const params = new URLSearchParams(searchParams.toString());

      Object.entries(updates).forEach(([key, value]) => {
        if (value === undefined || value === "" || (Array.isArray(value) && value.length === 0)) {
          params.delete(key);
        } else if (Array.isArray(value)) {
          params.set(key, value.join(","));
        } else {
          params.set(key, String(value));
        }
      });

      // Remove default values
      if (params.get("page") === "1") params.delete("page");
      if (params.get("limit") === "25") params.delete("limit");
      if (params.get("sort") === "created_at") params.delete("sort");
      if (params.get("order") === "desc") params.delete("order");
      if (params.get("view") === "grid") params.delete("view");
      if (params.get("minExp") === "0") params.delete("minExp");
      if (params.get("maxExp") === "20") params.delete("maxExp");

      const newUrl = params.toString() ? `?${params.toString()}` : "";
      router.replace(`/candidates/search${newUrl}`, { scroll: false });
    },
    [router, searchParams]
  );

  // Update URL on filter changes
  React.useEffect(() => {
    updateUrl({
      q: debouncedSearch || undefined,
      position: selectedPosition || undefined,
      availability: selectedAvailability.length > 0 ? selectedAvailability : undefined,
      verification: selectedVerification.length > 0 ? selectedVerification : undefined,
      minExp: experienceRange[0] > 0 ? experienceRange[0] : undefined,
      maxExp: experienceRange[1] < 20 ? experienceRange[1] : undefined,
      page: currentPage > 1 ? currentPage : undefined,
      limit: pageSize !== 25 ? pageSize : undefined,
      sort: sortBy !== "created_at" ? sortBy : undefined,
      order: sortOrder !== "desc" ? sortOrder : undefined,
      view: viewMode !== "grid" ? viewMode : undefined,
    });
  }, [
    debouncedSearch,
    selectedPosition,
    selectedAvailability,
    selectedVerification,
    experienceRange,
    currentPage,
    pageSize,
    sortBy,
    sortOrder,
    viewMode,
    updateUrl,
  ]);

  // Reset page when filters change
  React.useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearch, selectedPosition, selectedAvailability, selectedVerification, experienceRange]);

  // Fetch candidates
  // Standard database search (used when AI search is off)
  const {
    data: candidatesData,
    isLoading: isLoadingStandard,
    isFetching: isFetchingStandard,
  } = useCandidates({
    search: !useAISearch ? debouncedSearch : undefined,
    position: selectedPosition || undefined,
    availability: selectedAvailability.length === 1 ? selectedAvailability[0] : undefined,
    verification: selectedVerification.length === 1 ? selectedVerification[0] : undefined,
    minExperience: experienceRange[0] > 0 ? experienceRange[0] : undefined,
    page: currentPage,
    limit: pageSize,
    sortBy,
    sortOrder,
  });

  // Determine which results to show based on search mode
  const isLoading = useAISearch ? aiSearchMutation.isPending : isLoadingStandard;
  const isFetching = useAISearch ? aiSearchMutation.isPending : isFetchingStandard;

  // Convert V4 AI search results to CandidateWithAI format for display
  const aiCandidates: CandidateWithAI[] = React.useMemo(() => {
    if (!useAISearch || !aiSearchMutation.data?.results) return [];
    return aiSearchMutation.data.results.map((r) => ({
      id: r.candidate_id,
      first_name: r.first_name,
      last_name: r.last_name,
      primary_position: r.primary_position,
      years_experience: r.years_experience,
      nationality: r.nationality,
      verification_tier: r.verification_tier,
      availability_status: r.availability_status,
      avatar_url: r.avatar_url,
      // Additional fields needed by CandidateCard
      current_country: null,
      current_location: r.current_location,
      last_active_at: null,
      // V4 Agentic Search fields
      _finalScore: r.finalScore,
      _vectorScore: r.vectorScore,
      _agenticExplanation: r.agenticExplanation,
    })) as unknown as CandidateWithAI[];
  }, [useAISearch, aiSearchMutation.data]);

  const candidates = useAISearch ? aiCandidates : (candidatesData?.data ?? []);
  const totalResults = useAISearch
    ? (aiSearchMutation.data?.total_count ?? 0)
    : (candidatesData?.total ?? 0);
  const totalPages = useAISearch
    ? Math.ceil((aiSearchMutation.data?.total_count ?? 0) / pageSize)
    : (candidatesData?.total_pages ?? 1);

  // Active filter count
  const activeFilterCount =
    (selectedPosition ? 1 : 0) +
    selectedAvailability.length +
    selectedVerification.length +
    (experienceRange[0] > 0 || experienceRange[1] < 20 ? 1 : 0);

  const clearAllFilters = () => {
    setSelectedPosition("");
    setSelectedAvailability([]);
    setSelectedVerification([]);
    setExperienceRange([0, 20]);
  };

  const handleViewCandidate = (candidateId: string) => {
    router.push(`/candidates/${candidateId}`);
  };

  const handleAddToJob = (candidate: Candidate) => {
    setAddToJobModal({
      open: true,
      candidateId: candidate.id,
      candidateName: `${candidate.first_name} ${candidate.last_name}`,
    });
  };

  // Generate pagination buttons
  const paginationButtons = React.useMemo(() => {
    const buttons: (number | "ellipsis")[] = [];
    const maxButtons = 5;

    if (totalPages <= maxButtons) {
      for (let i = 1; i <= totalPages; i++) buttons.push(i);
    } else {
      buttons.push(1);
      if (currentPage > 3) buttons.push("ellipsis");

      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);

      for (let i = start; i <= end; i++) buttons.push(i);

      if (currentPage < totalPages - 2) buttons.push("ellipsis");
      buttons.push(totalPages);
    }

    return buttons;
  }, [currentPage, totalPages]);

  return (
    <div className="min-h-screen bg-gray-50/50">
      <div className="p-6">
        <div className="mx-auto max-w-7xl space-y-6">
          {/* Page Header */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-4xl font-serif font-semibold text-navy-800">
                Find Candidates
              </h1>
              <p className="mt-1 text-gray-600">
                Search and filter your candidate database with AI-powered semantic search
              </p>
            </div>
          </div>

          {/* Search Card */}
          <div className="rounded-xl border border-gray-200 bg-white p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-medium text-navy-800">Search</h2>
              {/* AI Search Toggle */}
              <button
                onClick={() => setUseAISearch(!useAISearch)}
                className={cn(
                  "flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-all",
                  useAISearch
                    ? "bg-gradient-to-r from-gold-400 to-gold-500 text-navy-900 shadow-sm"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                )}
              >
                {aiSearchMutation.isPending ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    Searching...
                  </>
                ) : (
                  <>
                    <Brain className="size-4" />
                    {useAISearch ? "AI Search Active" : "Enable AI Search"}
                  </>
                )}
              </button>
            </div>

            {/* Search Input */}
            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
                {aiSearchMutation.isPending ? (
                  <Loader2 className="size-5 animate-spin text-gold-500" />
                ) : (
                  <Search className="size-5 text-gray-400" />
                )}
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={useAISearch
                  ? "Try natural language: 'experienced bosun with STCW' or 'chief stew for motor yacht'"
                  : "Search by name, position, skills..."}
                className={cn(
                  "h-14 w-full rounded-xl border bg-gray-50 pl-12 pr-4 text-base placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:bg-white transition-colors",
                  useAISearch
                    ? "border-gold-300 focus:border-gold-500 focus:ring-gold-500/20"
                    : "border-gray-200 focus:border-gold-500 focus:ring-gold-500/20"
                )}
              />
            </div>

            {/* AI Search Results Summary */}
            {useAISearch && aiSearchMutation.data && (
              <div className="mt-4 rounded-lg bg-gradient-to-r from-gold-50 to-amber-50 border border-gold-200 p-4">
                <div className="flex flex-wrap items-center gap-3">
                  <div className="flex items-center gap-2 text-sm font-medium text-navy-900">
                    <Zap className="size-4 text-gold-600" />
                    Found <span className="text-gold-700">{aiSearchMutation.data.total_count}</span> matches
                    in <span className="text-gray-500">{aiSearchMutation.data.processing_time_ms}ms</span>
                  </div>

                  {/* Pipeline Stats */}
                  {aiSearchMutation.data.pipelineStats && (
                    <div className="flex flex-wrap items-center gap-2 text-xs">
                      <span className="rounded-full bg-white/80 border border-gray-200 px-2.5 py-1 font-medium text-gray-600">
                        {aiSearchMutation.data.pipelineStats.afterHardFilters} filtered
                      </span>
                      <span className="rounded-full bg-blue-100/80 border border-blue-200 px-2.5 py-1 font-medium text-blue-700">
                        {aiSearchMutation.data.pipelineStats.afterVectorSearch} matched
                      </span>
                      <span className="rounded-full bg-purple-100/80 border border-purple-200 px-2.5 py-1 font-medium text-purple-700">
                        {aiSearchMutation.data.pipelineStats.afterAgenticJudge} AI approved
                      </span>
                    </div>
                  )}
                </div>

                {/* Extracted Query Filters */}
                {aiSearchMutation.data.parsedQuery?.hardFilters && (
                  <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
                    <span className="text-gray-500">AI extracted:</span>
                    {(aiSearchMutation.data.parsedQuery.hardFilters.positions?.length ?? 0) > 0 && (
                      <span className="rounded-full bg-navy-100 border border-navy-200 px-2.5 py-1 font-medium text-navy-700">
                        {aiSearchMutation.data.parsedQuery.hardFilters.positions?.join(', ')}
                      </span>
                    )}
                    {aiSearchMutation.data.parsedQuery.hardFilters.min_experience && (
                      <span className="rounded-full bg-emerald-100 border border-emerald-200 px-2.5 py-1 font-medium text-emerald-700">
                        {aiSearchMutation.data.parsedQuery.hardFilters.min_experience}+ years exp
                      </span>
                    )}
                    {aiSearchMutation.data.parsedQuery.hardFilters.require_stcw && (
                      <span className="rounded-full bg-amber-100 border border-amber-200 px-2.5 py-1 font-medium text-amber-700">
                        STCW Required
                      </span>
                    )}
                    {aiSearchMutation.data.parsedQuery.hardFilters.require_eng1 && (
                      <span className="rounded-full bg-amber-100 border border-amber-200 px-2.5 py-1 font-medium text-amber-700">
                        ENG1 Required
                      </span>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
            {/* Filters Sidebar */}
            <div className={cn("lg:col-span-1", !sidebarOpen && "hidden lg:hidden")}>
              <div className="rounded-xl border border-gray-200 bg-white">
                {/* Sidebar Header */}
                <div className="flex items-center justify-between border-b border-gray-100 p-4">
                  <div className="flex items-center gap-2">
                    <SlidersHorizontal className="size-4 text-gray-500" />
                    <span className="font-semibold text-navy-900">Filters</span>
                    {activeFilterCount > 0 && (
                      <span className="rounded-full bg-gold-500 px-2 py-0.5 text-xs font-semibold text-navy-900">
                        {activeFilterCount}
                      </span>
                    )}
                  </div>
                  {activeFilterCount > 0 && (
                    <button
                      onClick={clearAllFilters}
                      className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700"
                    >
                      <RotateCcw className="size-3" />
                      Clear
                    </button>
                  )}
                </div>

                {/* Scrollable Filters */}
                <div className="p-4">
                  <div className="space-y-6">
                    {/* Position */}
                    <div>
                      <label className="mb-2 block text-sm font-medium text-gray-700">
                        Position
                      </label>
                      <select
                        value={selectedPosition}
                        onChange={(e) => setSelectedPosition(e.target.value)}
                        className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm focus:border-gold-500 focus:outline-none focus:ring-1 focus:ring-gold-500 focus:bg-white"
                      >
                        <option value="">All Positions</option>
                        {positionOptions.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Availability */}
                    <div>
                      <label className="mb-2 block text-sm font-medium text-gray-700">
                        Availability
                      </label>
                      <div className="space-y-1">
                        {availabilityOptions.map((option) => (
                          <FilterCheckbox
                            key={option.value}
                            label={option.label}
                            checked={selectedAvailability.includes(option.apiValue)}
                            onChange={(checked) => {
                              if (checked) {
                                setSelectedAvailability([...selectedAvailability, option.apiValue]);
                              } else {
                                setSelectedAvailability(
                                  selectedAvailability.filter((v) => v !== option.apiValue)
                                );
                              }
                            }}
                          />
                        ))}
                      </div>
                    </div>

                    {/* Verification Tier */}
                    <div>
                      <label className="mb-2 block text-sm font-medium text-gray-700">
                        Verification Tier
                      </label>
                      <div className="space-y-1">
                        {verificationOptions.map((option) => (
                          <FilterCheckbox
                            key={option.value}
                            label={option.label}
                            checked={selectedVerification.includes(option.value)}
                            onChange={(checked) => {
                              if (checked) {
                                setSelectedVerification([...selectedVerification, option.value]);
                              } else {
                                setSelectedVerification(
                                  selectedVerification.filter((v) => v !== option.value)
                                );
                              }
                            }}
                            badge={<VerificationBadge tier={option.tier} size="sm" />}
                          />
                        ))}
                      </div>
                    </div>

                    {/* Experience Range */}
                    <RangeSlider
                      label="Experience"
                      min={0}
                      max={20}
                      value={experienceRange}
                      onChange={setExperienceRange}
                      formatValue={(v) => (v >= 20 ? "20+ yrs" : `${v} yrs`)}
                    />
                  </div>
                </div>

                {/* Save Search Button */}
                <div className="border-t border-gray-100 p-4">
                  <Button
                    variant="secondary"
                    className="w-full"
                    leftIcon={<BookmarkPlus className="size-4" />}
                  >
                    Save This Search
                  </Button>
                </div>
              </div>
            </div>

            {/* Results Column */}
            <div className={cn("lg:col-span-3", !sidebarOpen && "lg:col-span-4")}>
              {/* Results Card */}
              <div className="rounded-xl border border-gray-200 bg-white">
                {/* Results Header */}
                <div className="flex flex-wrap items-center justify-between gap-4 border-b border-gray-100 p-4">
                  <div className="flex items-center gap-4">
                    <button
                      onClick={() => setSidebarOpen(!sidebarOpen)}
                      className={cn(
                        "flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition-colors",
                        sidebarOpen
                          ? "border-gold-300 bg-gold-50 text-gold-700"
                          : "border-gray-200 bg-gray-50 text-gray-700 hover:bg-gray-100"
                      )}
                    >
                      <SlidersHorizontal className="size-4" />
                      {sidebarOpen ? "Hide Filters" : "Show Filters"}
                    </button>
                    <span className="text-sm text-gray-600">
                      <span className="font-semibold text-navy-900">{totalResults.toLocaleString()}</span>{" "}
                      candidates
                      {isFetching && !isLoading && (
                        <Loader2 className="ml-2 inline size-4 animate-spin text-gray-400" />
                      )}
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    {/* Sort */}
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-500">Sort:</span>
                      <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value)}
                        className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm font-medium focus:border-gold-500 focus:outline-none focus:ring-1 focus:ring-gold-500"
                      >
                        <option value="created_at">Recently Added</option>
                        <option value="updated_at">Recently Updated</option>
                        <option value="years_experience">Experience</option>
                        <option value="last_name">Name</option>
                      </select>
                    </div>

                    {/* View Toggle */}
                    <div className="flex rounded-lg border border-gray-200 bg-gray-50 p-1">
                      <button
                        onClick={() => setViewMode("grid")}
                        className={cn(
                          "rounded-md p-2 transition-colors",
                          viewMode === "grid"
                            ? "bg-white text-navy-700 shadow-sm"
                            : "text-gray-400 hover:text-gray-600"
                        )}
                      >
                        <Grid3X3 className="size-4" />
                      </button>
                      <button
                        onClick={() => setViewMode("list")}
                        className={cn(
                          "rounded-md p-2 transition-colors",
                          viewMode === "list"
                            ? "bg-white text-navy-700 shadow-sm"
                            : "text-gray-400 hover:text-gray-600"
                        )}
                      >
                        <List className="size-4" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Results Grid/List */}
                <div className="p-4">
                  {isLoading ? (
                    <div className="flex items-center justify-center py-20">
                      <Loader2 className="size-8 animate-spin text-gray-400" />
                    </div>
                  ) : candidates.length > 0 ? (
                    <div
                      className={cn(
                        viewMode === "grid"
                          ? "grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3"
                          : "space-y-3"
                      )}
                    >
                      {candidates.map((candidate) => (
                        <CandidateCard
                          key={candidate.id}
                          candidate={candidate}
                          viewMode={viewMode}
                          onView={() => handleViewCandidate(candidate.id)}
                          onAddToJob={() => handleAddToJob(candidate)}
                          showRelevancy={useAISearch}
                        />
                      ))}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-16 text-center">
                      {/* V4 AI Search No Results - with suggestions */}
                      {useAISearch && aiSearchMutation.data?.noResultsReason ? (
                        <div className="mx-auto max-w-md rounded-xl border border-gray-100 bg-white p-8 shadow-sm">
                          <div className="mx-auto flex size-16 items-center justify-center rounded-full bg-amber-50">
                            <SearchX className="size-8 text-amber-500" />
                          </div>
                          <h3 className="mt-5 text-xl font-semibold text-navy-900">No matches found</h3>
                          <p className="mt-2 text-sm text-gray-500">
                            We couldn&apos;t find candidates matching your search criteria.
                          </p>
                          {searchQuery && (
                            <div className="mt-4 rounded-lg bg-gray-50 px-4 py-2">
                              <span className="text-sm text-gray-500">Searched for: </span>
                              <span className="font-medium text-navy-700">&ldquo;{searchQuery}&rdquo;</span>
                            </div>
                          )}

                          {/* Position Suggestions - More prominent */}
                          {aiSearchMutation.data.suggestions && aiSearchMutation.data.suggestions.length > 0 && (
                            <div className="mt-6 border-t border-gray-100 pt-6">
                              <p className="text-sm font-medium text-navy-700">Try these similar roles:</p>
                              <div className="mt-3 flex flex-wrap justify-center gap-2">
                                {aiSearchMutation.data.suggestions.map((suggestion) => (
                                  <Button
                                    key={suggestion}
                                    variant="secondary"
                                    size="sm"
                                    onClick={() => setSearchQuery(suggestion)}
                                    className="bg-blue-50 text-blue-700 hover:bg-blue-100"
                                  >
                                    {suggestion}
                                  </Button>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="mx-auto max-w-md rounded-xl border border-gray-100 bg-white p-8 shadow-sm">
                          {/* Standard No Results */}
                          <div className="mx-auto flex size-16 items-center justify-center rounded-full bg-gray-100">
                            <Search className="size-8 text-gray-400" />
                          </div>
                          <h3 className="mt-5 text-xl font-semibold text-navy-900">No candidates found</h3>
                          <p className="mt-2 text-sm text-gray-500">
                            Try adjusting your search or filters to find more results.
                          </p>
                        </div>
                      )}

                      {activeFilterCount > 0 && (
                        <Button variant="secondary" className="mt-4" onClick={clearAllFilters}>
                          Clear all filters
                        </Button>
                      )}
                    </div>
                  )}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-between border-t border-gray-100 px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-500">Show</span>
                      <select
                        value={pageSize}
                        onChange={(e) => {
                          setPageSize(Number(e.target.value));
                          setCurrentPage(1);
                        }}
                        className="rounded-lg border border-gray-200 bg-gray-50 px-2 py-1 text-sm focus:border-gold-500 focus:outline-none focus:ring-1 focus:ring-gold-500"
                      >
                        <option value={25}>25</option>
                        <option value={50}>50</option>
                        <option value={100}>100</option>
                      </select>
                      <span className="text-sm text-gray-500">per page</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                        disabled={currentPage === 1}
                        className="flex items-center gap-1 rounded-lg border border-gray-200 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <ChevronLeft className="size-4" />
                        Prev
                      </button>

                      <div className="flex items-center gap-1">
                        {paginationButtons.map((item, index) =>
                          item === "ellipsis" ? (
                            <span key={`ellipsis-${index}`} className="px-2 text-gray-400">
                              ...
                            </span>
                          ) : (
                            <button
                              key={item}
                              onClick={() => setCurrentPage(item)}
                              className={cn(
                                "flex size-8 items-center justify-center rounded-lg text-sm font-medium transition-colors",
                                currentPage === item
                                  ? "bg-gold-500 text-navy-900"
                                  : "text-gray-700 hover:bg-gray-100"
                              )}
                            >
                              {item}
                            </button>
                          )
                        )}
                      </div>

                      <button
                        onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                        disabled={currentPage === totalPages}
                        className="flex items-center gap-1 rounded-lg border border-gray-200 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        Next
                        <ChevronRight className="size-4" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Add to Job Modal */}
      <AddToJobModal
        open={addToJobModal.open}
        onOpenChange={(open) => setAddToJobModal((prev) => ({ ...prev, open }))}
        candidateId={addToJobModal.candidateId}
        candidateName={addToJobModal.candidateName}
      />
    </div>
  );
}

// Loading fallback for Suspense
function SearchPageLoading() {
  return (
    <div className="flex flex-1 items-center justify-center bg-gray-50">
      <Loader2 className="size-8 animate-spin text-gray-400" />
    </div>
  );
}

// Wrapped export with Suspense boundary for useSearchParams
export default function CandidateSearchPage() {
  return (
    <Suspense fallback={<SearchPageLoading />}>
      <CandidateSearchPageContent />
    </Suspense>
  );
}
