"use client";

import * as React from "react";
import {
  Ship,
  Home,
  MapPin,
  Calendar,
  DollarSign,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Briefcase,
  Clock,
  Check,
  Upload,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScoreBreakdown, type ScoreSegment } from "@/components/ui/score-breakdown";
import { InlineCVUpload } from "@/components/documents/InlineCVUpload";
import type { JobMatchResult, MatchScoreBreakdown } from "@lighthouse/ai/matcher";

// ----------------------------------------------------------------------------
// TYPES
// ----------------------------------------------------------------------------

export interface JobMatchCardProps {
  match: JobMatchResult;
  onQuickApply?: (jobId: string) => Promise<void>;
  onViewJob?: (jobId: string) => void;
  className?: string;
  /** Whether the candidate has a CV uploaded */
  hasCV?: boolean;
  /** Candidate ID for CV upload */
  candidateId?: string;
  /** Callback when CV is successfully uploaded */
  onCVUploadSuccess?: () => void;
}

// ----------------------------------------------------------------------------
// HELPER FUNCTIONS
// ----------------------------------------------------------------------------

const formatCurrency = (amount: number, currency: string = "EUR"): string => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

const formatDate = (date: Date | string | null): string => {
  if (!date) return "";
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

const getScoreColor = (score: number): string => {
  if (score >= 80) return "text-success-600";
  if (score >= 60) return "text-gold-600";
  if (score >= 40) return "text-warning-600";
  return "text-gray-500";
};

const getScoreBgColor = (score: number): string => {
  if (score >= 80) return "bg-success-50 border-success-200";
  if (score >= 60) return "bg-gold-50 border-gold-200";
  if (score >= 40) return "bg-warning-50 border-warning-200";
  return "bg-gray-50 border-gray-200";
};

const getScoreLabel = (score: number): string => {
  if (score >= 85) return "Excellent Match";
  if (score >= 70) return "Great Match";
  if (score >= 55) return "Good Match";
  if (score >= 40) return "Fair Match";
  return "Possible Match";
};

// Score segment colors
const SEGMENT_COLORS = {
  position: "#1E3A5F",      // navy-800
  experience: "#B49A5E",    // gold-500
  preferences: "#059669",   // success-600
  availability: "#7C3AED",  // purple
  qualifications: "#0EA5E9", // sky-500
};

// Convert breakdown to score segments
const breakdownToSegments = (breakdown: MatchScoreBreakdown): ScoreSegment[] => [
  {
    id: "position",
    label: "Position",
    value: breakdown.position,
    maxValue: 25,
    color: SEGMENT_COLORS.position,
  },
  {
    id: "experience",
    label: "Experience",
    value: breakdown.experience,
    maxValue: 20,
    color: SEGMENT_COLORS.experience,
  },
  {
    id: "preferences",
    label: "Preferences",
    value: breakdown.preferences,
    maxValue: 25,
    color: SEGMENT_COLORS.preferences,
  },
  {
    id: "availability",
    label: "Availability",
    value: breakdown.availability,
    maxValue: 15,
    color: SEGMENT_COLORS.availability,
  },
  {
    id: "qualifications",
    label: "Qualifications",
    value: breakdown.qualifications,
    maxValue: 15,
    color: SEGMENT_COLORS.qualifications,
  },
];

// ----------------------------------------------------------------------------
// COMPONENT
// ----------------------------------------------------------------------------

export const JobMatchCard = React.forwardRef<HTMLDivElement, JobMatchCardProps>(
  ({ match, onQuickApply, onViewJob, className, hasCV, candidateId, onCVUploadSuccess }, ref) => {
    const [expanded, setExpanded] = React.useState(false);
    const [isApplying, setIsApplying] = React.useState(false);
    const [showCVUpload, setShowCVUpload] = React.useState(false);

    const { job, matchScore, breakdown, strengths, concerns, aiSummary, canQuickApply, hasApplied, industry } = match;

    // Determine if we should show the CV upload button (no CV and not yet applied)
    const needsCV = hasCV === false && !hasApplied;

    const isYacht = industry === "yacht";
    const segments = breakdownToSegments(breakdown);

    // Salary display
    const salaryDisplay = React.useMemo(() => {
      if (!job.salary_min && !job.salary_max) return null;
      const currency = job.salary_currency || "EUR";
      const period = job.salary_period === "monthly" ? "/mo" : "/yr";

      if (job.salary_min && job.salary_max) {
        return `${formatCurrency(job.salary_min, currency)} - ${formatCurrency(job.salary_max, currency)}${period}`;
      }
      if (job.salary_min) {
        return `From ${formatCurrency(job.salary_min, currency)}${period}`;
      }
      return `Up to ${formatCurrency(job.salary_max!, currency)}${period}`;
    }, [job.salary_min, job.salary_max, job.salary_currency, job.salary_period]);

    const handleQuickApply = async () => {
      if (!onQuickApply || isApplying || hasApplied) return;
      setIsApplying(true);
      try {
        await onQuickApply(job.id);
      } finally {
        setIsApplying(false);
      }
    };

    return (
      <div
        ref={ref}
        className={cn(
          "rounded-xl border bg-white shadow-[0px_2px_4px_rgba(26,24,22,0.06)] transition-all duration-200",
          expanded ? "ring-2 ring-gold-500/20 border-gold-300" : "border-gray-200",
          className
        )}
      >
        {/* Header Section */}
        <div className="p-4 sm:p-5">
          <div className="flex items-start justify-between gap-3 sm:gap-4">
            {/* Job Info */}
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5 mb-1 sm:gap-2">
                {isYacht ? (
                  <Ship className="size-3.5 text-navy-600 shrink-0 sm:size-4" />
                ) : (
                  <Home className="size-3.5 text-navy-600 shrink-0 sm:size-4" />
                )}
                <span className="text-[10px] font-medium text-navy-600 uppercase tracking-wide sm:text-xs">
                  {isYacht ? "Yacht" : "Private Household"}
                </span>
              </div>

              <h3 className="text-base font-semibold text-navy-900 font-cormorant line-clamp-2 sm:text-lg">
                {job.title || job.position_category || "Untitled Position"}
              </h3>

              <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-gray-600 sm:gap-3 sm:text-sm">
                {job.vessel_type && (
                  <span className="flex items-center gap-1">
                    <Ship className="size-3.5" />
                    {job.vessel_type}
                    {job.vessel_size_meters && ` (${job.vessel_size_meters}m)`}
                  </span>
                )}
                {job.primary_region && (
                  <span className="flex items-center gap-1">
                    <MapPin className="size-3.5" />
                    {job.primary_region}
                  </span>
                )}
                {job.contract_type && (
                  <span className="flex items-center gap-1">
                    <Briefcase className="size-3.5" />
                    {job.contract_type.replace(/_/g, " ")}
                  </span>
                )}
              </div>

              {/* Salary & Dates */}
              <div className="mt-2 flex flex-wrap items-center gap-2 text-xs sm:gap-4 sm:text-sm">
                {salaryDisplay && (
                  <span className="flex items-center gap-1 font-semibold text-navy-800">
                    <DollarSign className="size-3 text-gray-400 sm:size-4" />
                    <span className="truncate">{salaryDisplay}</span>
                  </span>
                )}
                {job.start_date && (
                  <span className="flex items-center gap-1 text-gray-600">
                    <Calendar className="size-3 text-gray-400 sm:size-3.5" />
                    <span className="truncate">Starts {formatDate(job.start_date)}</span>
                  </span>
                )}
              </div>
            </div>

            {/* Match Score Badge */}
            <div
              className={cn(
                "flex flex-col items-center justify-center rounded-lg border px-2.5 py-2 min-w-[70px] sm:rounded-xl sm:px-4 sm:py-3 sm:min-w-[90px]",
                getScoreBgColor(matchScore)
              )}
            >
              <span className={cn("text-lg font-bold sm:text-2xl", getScoreColor(matchScore))}>
                {matchScore}%
              </span>
              <span className="text-[9px] text-gray-600 font-medium text-center sm:text-xs">
                {getScoreLabel(matchScore)}
              </span>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="mt-3 flex flex-col gap-2 sm:mt-4 sm:flex-row sm:items-center sm:gap-3">
            {hasApplied ? (
              <div className="flex items-center gap-2 text-success-600 bg-success-50 px-3 py-1.5 rounded-lg sm:px-4 sm:py-2">
                <Check className="size-3.5 sm:size-4" />
                <span className="text-xs font-medium sm:text-sm">Applied</span>
              </div>
            ) : needsCV ? (
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setShowCVUpload(true)}
                leftIcon={<Upload className="size-3.5 sm:size-4" />}
                className="w-full text-xs sm:w-auto sm:text-sm"
              >
                <span className="hidden sm:inline">Upload CV to Apply</span>
                <span className="sm:hidden">Upload CV</span>
              </Button>
            ) : canQuickApply ? (
              <Button
                onClick={handleQuickApply}
                loading={isApplying}
                size="sm"
                className="w-full min-w-0 sm:min-w-[120px] text-xs sm:text-sm"
              >
                Quick Apply
              </Button>
            ) : (
              <Button
                variant="secondary"
                size="sm"
                onClick={() => onViewJob?.(job.id)}
                className="w-full text-xs sm:w-auto sm:text-sm"
              >
                View & Apply
              </Button>
            )}

            <Button
              variant="ghost"
              size="sm"
              onClick={() => setExpanded(!expanded)}
              rightIcon={expanded ? <ChevronUp className="size-3.5 sm:size-4" /> : <ChevronDown className="size-3.5 sm:size-4" />}
              className="w-full text-xs sm:w-auto sm:text-sm"
            >
              {expanded ? "Less" : "Details"}
            </Button>
          </div>

          {/* Inline CV Upload Section */}
          {showCVUpload && candidateId && (
            <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-lg sm:mt-4 sm:p-4 sm:rounded-xl">
              <h4 className="text-xs font-semibold text-amber-900 mb-2 flex items-center gap-1.5 sm:text-sm sm:mb-3 sm:gap-2">
                <Upload className="size-3.5 sm:size-4" />
                Upload Your CV to Apply
              </h4>
              <p className="text-[11px] text-amber-700 mb-2 sm:text-xs sm:mb-3">
                A CV is required to apply for jobs. Upload your CV below to continue.
              </p>
              <InlineCVUpload
                candidateId={candidateId}
                onUploadSuccess={() => {
                  setShowCVUpload(false);
                  onCVUploadSuccess?.();
                }}
                onUploadError={(error) => {
                  console.error("CV upload error:", error);
                }}
              />
            </div>
          )}
        </div>

        {/* Expanded Details */}
        {expanded && (
          <div className="border-t border-gray-100 px-4 py-3 space-y-4 bg-gray-50/50 sm:px-5 sm:py-4 sm:space-y-5">
            {/* Score Breakdown */}
            <div>
              <h4 className="text-xs font-semibold text-navy-800 mb-2 sm:text-sm sm:mb-3">Match Breakdown</h4>
              <ScoreBreakdown
                segments={segments}
                totalScore={matchScore}
                maxScore={100}
                size="sm"
                showValues={true}
              />
            </div>

            {/* Strengths */}
            {strengths.length > 0 && (
              <div>
                <h4 className="text-xs font-semibold text-navy-800 mb-2 flex items-center gap-1.5 sm:text-sm">
                  <CheckCircle2 className="size-3.5 text-success-500 sm:size-4" />
                  Strengths
                </h4>
                <ul className="space-y-1.5">
                  {strengths.map((strength, idx) => (
                    <li key={idx} className="flex items-start gap-1.5 text-xs text-gray-700 sm:gap-2 sm:text-sm">
                      <span className="text-success-500 mt-0.5 shrink-0">+</span>
                      <span>{strength}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Concerns */}
            {concerns.length > 0 && (
              <div>
                <h4 className="text-xs font-semibold text-navy-800 mb-2 flex items-center gap-1.5 sm:text-sm">
                  <AlertCircle className="size-3.5 text-warning-500 sm:size-4" />
                  Considerations
                </h4>
                <ul className="space-y-1.5">
                  {concerns.map((concern, idx) => (
                    <li key={idx} className="flex items-start gap-1.5 text-xs text-gray-600 sm:gap-2 sm:text-sm">
                      <span className="text-warning-500 mt-0.5 shrink-0">!</span>
                      <span>{concern}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* AI Summary */}
            {aiSummary && (
              <div className="bg-gradient-to-r from-gold-50 to-amber-50 rounded-lg p-3 border border-gold-200/50 sm:p-4">
                <h4 className="text-xs font-semibold text-navy-800 mb-2 flex items-center gap-1.5 sm:text-sm">
                  <Sparkles className="size-3.5 text-gold-500 sm:size-4" />
                  AI Analysis
                </h4>
                <p className="text-xs text-gray-700 leading-relaxed sm:text-sm">{aiSummary}</p>
              </div>
            )}

            {/* View Full Details */}
            <div className="pt-2">
              <Button
                variant="tertiary"
                size="sm"
                onClick={() => onViewJob?.(job.id)}
                className="w-full text-xs sm:text-sm"
              >
                View Full Job Details
              </Button>
            </div>
          </div>
        )}
      </div>
    );
  }
);

JobMatchCard.displayName = "JobMatchCard";
