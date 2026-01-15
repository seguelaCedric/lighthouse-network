"use client";

import * as React from "react";
import {
  Ship,
  Home,
  MapPin,
  Calendar,
  DollarSign,
  ChevronDown,
  ChevronUp,
  Briefcase,
  Check,
  Upload,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { InlineCVUpload } from "@/components/documents/InlineCVUpload";
import type { SimpleJobMatch } from "@/app/crew/preferences/actions";

// ----------------------------------------------------------------------------
// TYPES
// ----------------------------------------------------------------------------

export interface JobMatchCardProps {
  match: SimpleJobMatch;
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

// ----------------------------------------------------------------------------
// COMPONENT
// ----------------------------------------------------------------------------

export const JobMatchCard = React.forwardRef<HTMLDivElement, JobMatchCardProps>(
  ({ match, onQuickApply, onViewJob, className, hasCV, candidateId, onCVUploadSuccess }, ref) => {
    const [expanded, setExpanded] = React.useState(false);
    const [isApplying, setIsApplying] = React.useState(false);
    const [showCVUpload, setShowCVUpload] = React.useState(false);

    const { job, canQuickApply, hasApplied } = match;

    // Determine if we should show the CV upload button (no CV and not yet applied)
    const needsCV = hasCV === false && !hasApplied;

    // Determine if this is a yacht job (has vessel type)
    const isYacht = !!job.vesselType;

    // Salary display
    const salaryDisplay = React.useMemo(() => {
      if (!job.salaryMin && !job.salaryMax) return null;
      const currency = job.currency || "EUR";

      if (job.salaryMin && job.salaryMax) {
        return `${formatCurrency(job.salaryMin, currency)} - ${formatCurrency(job.salaryMax, currency)}/mo`;
      }
      if (job.salaryMin) {
        return `From ${formatCurrency(job.salaryMin, currency)}/mo`;
      }
      return `Up to ${formatCurrency(job.salaryMax!, currency)}/mo`;
    }, [job.salaryMin, job.salaryMax, job.currency]);

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
                {job.isUrgent && (
                  <span className="ml-1 rounded-full bg-error-100 px-2 py-0.5 text-[10px] font-bold text-error-600 sm:text-xs">
                    URGENT
                  </span>
                )}
              </div>

              <h3 className="text-base font-semibold text-navy-900 font-cormorant line-clamp-2 sm:text-lg">
                {job.title || "Untitled Position"}
              </h3>

              <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-gray-600 sm:gap-3 sm:text-sm">
                {job.vesselType && (
                  <span className="flex items-center gap-1">
                    <Ship className="size-3.5" />
                    {job.vesselType}
                    {job.vesselSize && ` (${job.vesselSize}m)`}
                  </span>
                )}
                {job.location && (
                  <span className="flex items-center gap-1">
                    <MapPin className="size-3.5" />
                    {job.location}
                  </span>
                )}
                {job.contractType && (
                  <span className="flex items-center gap-1">
                    <Briefcase className="size-3.5" />
                    {job.contractType.replace(/_/g, " ")}
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
                {job.startDate && (
                  <span className="flex items-center gap-1 text-gray-600">
                    <Calendar className="size-3 text-gray-400 sm:size-3.5" />
                    <span className="truncate">Starts {formatDate(job.startDate)}</span>
                  </span>
                )}
              </div>
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
