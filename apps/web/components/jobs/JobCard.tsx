"use client";

import * as React from "react";
import {
  MapPin,
  Ship,
  Calendar,
  DollarSign,
  Clock,
  Check,
  AlertCircle,
  CheckCircle2,
  Send,
  Shield,
  Loader2,
  Bookmark,
  Home,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { formatSalaryRange } from "@/lib/utils/currency";
import { isLandBasedJob } from "@/lib/utils/job-helpers";

// ----------------------------------------------------------------------------
// TYPES
// ----------------------------------------------------------------------------

/**
 * Common job data structure that both JobListing and SimpleJobMatch jobs share
 */
export interface JobCardData {
  id: string;
  title: string;
  vesselName?: string | null;
  vesselType?: string | null;
  vesselSize?: number | null;
  location?: string | null;
  contractType?: string | null;
  rotationSchedule?: string | null;
  startDate?: string | null;
  salaryMin?: number | null;
  salaryMax?: number | null;
  currency?: string;
  salaryPeriod?: string;
  holidayDays?: number | null;
  benefits?: string | null;
  description?: string | null;
  requirements?: Record<string, unknown> | null;
  isUrgent?: boolean;
  applyDeadline?: string | null;
  applicationsCount?: number;
  viewsCount?: number;
  publishedAt?: string | null;
  createdAt?: string;
}

export interface JobCardProps {
  job: JobCardData;
  hasApplied?: boolean;
  isSaved?: boolean;
  onView?: () => void;
  onQuickApply?: () => void;
  isApplying?: boolean;
  onToggleSave?: () => void;
  isSaving?: boolean;
  /** Show save button (default: true) */
  showSaveButton?: boolean;
  className?: string;
}

export interface JobDetailModalProps {
  job: JobCardData;
  hasApplied?: boolean;
  isSaved?: boolean;
  onClose: () => void;
  onApply?: () => void;
  isApplying?: boolean;
  onToggleSave?: () => void;
  isSaving?: boolean;
  /** Show save button (default: true) */
  showSaveButton?: boolean;
}

// ----------------------------------------------------------------------------
// HELPER FUNCTIONS
// ----------------------------------------------------------------------------

function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return "Flexible";
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatRelativeDate(dateStr: string | null | undefined): string {
  if (!dateStr) return "Recently";
  const date = new Date(dateStr);
  const now = new Date();
  const diffDays = Math.floor(
    (now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24)
  );
  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
  return formatDate(dateStr);
}

function formatSalary(
  min: number | null | undefined,
  max: number | null | undefined,
  currency: string | undefined,
  period?: string
): string {
  return formatSalaryRange(min ?? null, max ?? null, currency || "EUR", "month", {
    style: "full",
    showPeriod: false,
  });
}

function formatContractType(type: string | null | undefined): string {
  if (!type) return "Contract";
  return type.charAt(0).toUpperCase() + type.slice(1);
}

// ----------------------------------------------------------------------------
// CONTRACT BADGE COMPONENT
// ----------------------------------------------------------------------------

function ContractBadge({ type }: { type: string | null | undefined }) {
  const config: Record<string, { label: string; className: string }> = {
    permanent: { label: "Permanent", className: "bg-navy-100 text-navy-700" },
    rotational: {
      label: "Rotational",
      className: "bg-purple-100 text-purple-700",
    },
    seasonal: { label: "Seasonal", className: "bg-warning-100 text-warning-700" },
    temporary: { label: "Temporary", className: "bg-gray-100 text-gray-700" },
    freelance: { label: "Freelance", className: "bg-blue-100 text-blue-700" },
  };

  const { label, className } = config[type || ""] || {
    label: formatContractType(type),
    className: "bg-gray-100 text-gray-700",
  };

  return (
    <span className={cn("rounded-full px-2.5 py-1 text-xs font-medium", className)}>
      {label}
    </span>
  );
}

// ----------------------------------------------------------------------------
// JOB CARD COMPONENT
// ----------------------------------------------------------------------------

export function JobCard({
  job,
  hasApplied = false,
  isSaved = false,
  onView,
  onQuickApply,
  isApplying = false,
  onToggleSave,
  isSaving = false,
  showSaveButton = true,
  className,
}: JobCardProps) {
  // Determine if this is a yacht job or land-based job
  const isYacht = !!job.vesselType || !isLandBasedJob(job.title);

  return (
    <div className={cn(
      "group relative rounded-xl border border-gray-200 bg-white p-4 sm:p-5 transition-all hover:border-gray-300 hover:shadow-md",
      className
    )}>
      {/* Urgent Badge */}
      {job.isUrgent && (
        <div className="absolute -left-2 top-4 rounded-r-full bg-error-500 px-3 py-1 text-xs font-bold text-white shadow-sm">
          URGENT
        </div>
      )}

      {/* Top Row: Job Type Indicator, Contract Badge, Save Button */}
      <div className="mb-3 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          {/* Job Type Indicator */}
          <div className="flex items-center gap-1.5">
            {isYacht ? (
              <Ship className="size-3.5 text-navy-600 shrink-0" />
            ) : (
              <Home className="size-3.5 text-navy-600 shrink-0" />
            )}
            <span className="text-[10px] font-medium text-navy-600 uppercase tracking-wide sm:text-xs">
              {isYacht ? "Yacht" : "Private Household"}
            </span>
          </div>
          <ContractBadge type={job.contractType} />
        </div>
        <div className="flex items-center gap-2">
          {/* Bookmark Button */}
          {showSaveButton && onToggleSave && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onToggleSave();
              }}
              disabled={isSaving}
              className={cn(
                "rounded-lg p-1.5 transition-colors",
                isSaved
                  ? "bg-gold-100 text-gold-600 hover:bg-gold-200"
                  : "text-gray-400 hover:bg-gray-100 hover:text-gray-600"
              )}
              title={isSaved ? "Remove from saved" : "Save for later"}
            >
              {isSaving ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : (
                <Bookmark className={cn("size-3.5", isSaved && "fill-current")} />
              )}
            </button>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div>
        <h3 className="text-lg font-semibold text-navy-900">
          {onView ? (
            <button
              onClick={onView}
              className="text-left hover:text-gold-600 hover:underline transition-colors"
            >
              {job.title}
            </button>
          ) : (
            job.title
          )}
        </h3>
        <p className="mt-1 text-gray-600">
          {job.vesselName || (job.vesselSize ? `${job.vesselSize}m` : (
            <span className="flex items-center gap-1 italic text-gray-500">
              <Shield className="size-4" />
              Confidential Listing
            </span>
          ))}
        </p>
      </div>

      {/* Details Grid */}
      <div className="mt-4 grid grid-cols-1 gap-x-6 gap-y-2 text-sm sm:grid-cols-2 md:grid-cols-4">
        <div className="flex items-center gap-2 text-gray-600">
          <Ship className="size-4 text-gray-400" />
          <span>
            {job.vesselType || "Vessel / Property"}{" "}
            {job.vesselSize ? `• ${job.vesselSize}m` : ""}
          </span>
        </div>
        <div className="flex items-center gap-2 text-gray-600">
          <MapPin className="size-4 text-gray-400" />
          <span>{job.location || "Various"}</span>
        </div>
        <div className="flex items-center gap-2 text-gray-600">
          <DollarSign className="size-4 text-gray-400" />
          <span>
            {formatSalary(job.salaryMin, job.salaryMax, job.currency)}/
            {job.salaryPeriod === "year" ? "yr" : "mo"}
          </span>
        </div>
        <div className="flex items-center gap-2 text-gray-600">
          <Calendar className="size-4 text-gray-400" />
          <span>Start: {formatDate(job.startDate)}</span>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-4 flex flex-col gap-2 border-t border-gray-100 pt-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <span className="text-xs text-gray-400">
            Posted {formatRelativeDate(job.publishedAt || job.createdAt)}
          </span>
          <span className="text-xs text-gray-400">•</span>
          <span className="text-xs font-mono text-gray-500">
            ID: {job.id.slice(0, 8).toUpperCase()}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          {onView && (
            <Button variant="secondary" size="sm" onClick={onView} className="text-xs px-2.5 py-1 h-7">
              View Details
            </Button>
          )}
          {hasApplied ? (
            <Button variant="secondary" size="sm" disabled className="text-xs px-2.5 py-1 h-7">
              <CheckCircle2 className="mr-1 size-3 text-success-500" />
              Applied
            </Button>
          ) : onQuickApply && (
            <Button
              variant="primary"
              size="sm"
              onClick={onQuickApply}
              disabled={isApplying}
              className="text-xs px-2.5 py-1 h-7"
            >
              {isApplying ? (
                <>
                  <Loader2 className="mr-1 size-3 animate-spin" />
                  Applying...
                </>
              ) : (
                "Quick Apply"
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

// ----------------------------------------------------------------------------
// JOB DETAIL MODAL COMPONENT
// ----------------------------------------------------------------------------

export function JobDetailModal({
  job,
  hasApplied = false,
  isSaved = false,
  onClose,
  onApply,
  isApplying = false,
  onToggleSave,
  isSaving = false,
  showSaveButton = true,
}: JobDetailModalProps) {
  const requirements = job.requirements;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/50 p-3 pt-16 sm:p-4 sm:pt-20">
      <div className="relative w-full max-w-3xl rounded-2xl bg-white shadow-xl">
        {/* Header */}
        <div className="flex items-start justify-between rounded-t-2xl border-b border-gray-100 bg-white p-4 sm:p-6">
          <div className="flex-1 min-w-0 pr-2">
            <div className="flex items-start justify-between gap-3 mb-2">
              <div className="flex-1 min-w-0">
                <h2 className="font-serif text-xl sm:text-2xl font-medium text-navy-800 break-words pr-2">
                  {job.title}
                </h2>
              </div>
              {job.isUrgent && (
                <span className="flex-shrink-0 rounded-full bg-error-100 px-2 py-0.5 text-xs font-bold text-error-600 whitespace-nowrap">
                  URGENT
                </span>
              )}
            </div>
            <p className="text-sm sm:text-base text-gray-600">
              {job.vesselName || (job.vesselSize ? `${job.vesselSize}m` : "Confidential Listing")}
            </p>
          </div>
          <button
            onClick={onClose}
            className="flex-shrink-0 rounded-full p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600 ml-2"
          >
            <X className="size-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-6">
          {/* Key Info */}
          <div className="mb-6 flex flex-wrap items-center gap-4">
            <ContractBadge type={job.contractType} />
            <span className="flex items-center gap-1 text-sm text-gray-500">
              <Clock className="size-4" />
              Posted {formatRelativeDate(job.publishedAt || job.createdAt)}
            </span>
            <span className="text-xs font-mono text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
              ID: {job.id.slice(0, 8).toUpperCase()}
            </span>
            {job.applyDeadline && (
              <span className="flex items-center gap-1 text-sm text-warning-600">
                <AlertCircle className="size-4" />
                Apply by {formatDate(job.applyDeadline)}
              </span>
            )}
          </div>

          {/* Quick Stats */}
          <div className="mb-6 grid grid-cols-1 gap-4 rounded-xl bg-gray-50 p-4 sm:grid-cols-2 lg:grid-cols-3">
            <div>
              <p className="text-xs text-gray-500">Vessel / Property</p>
              <p className="font-medium text-navy-900">
                {job.vesselType || "Not specified"}{" "}
                {job.vesselSize ? `• ${job.vesselSize}m` : ""}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Location</p>
              <p className="font-medium text-navy-900">
                {job.location || "Various"}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Salary</p>
              <p className="font-medium text-navy-900">
                {formatSalary(job.salaryMin, job.salaryMax, job.currency)}/
                {job.salaryPeriod === "year" ? "yr" : "mo"}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Start Date</p>
              <p className="font-medium text-navy-900">
                {formatDate(job.startDate)}
              </p>
            </div>
            {job.holidayDays && (
              <div>
                <p className="text-xs text-gray-500">Holiday</p>
                <p className="font-medium text-navy-900">
                  {job.holidayDays} days annual leave
                </p>
              </div>
            )}
            {job.rotationSchedule && (
              <div>
                <p className="text-xs text-gray-500">Rotation</p>
                <p className="font-medium text-navy-900">
                  {job.rotationSchedule}
                </p>
              </div>
            )}
            {job.benefits && (
              <div className="sm:col-span-2 lg:col-span-1">
                <p className="text-xs text-gray-500">Benefits & Package</p>
                <p className="font-medium text-navy-900">
                  {job.benefits}
                </p>
              </div>
            )}
          </div>

          {/* Description */}
          {job.description && (
            <div className="mb-6">
              <h3 className="mb-4 text-base font-semibold text-navy-900 sm:text-lg">
                About This Position
              </h3>
              <div
                className="prose prose-sm sm:prose-base max-w-none text-gray-700
                  prose-headings:text-navy-900 prose-headings:font-semibold prose-headings:mt-6 prose-headings:mb-3
                  prose-h1:text-xl prose-h2:text-lg prose-h3:text-base
                  prose-p:text-gray-700 prose-p:leading-relaxed prose-p:mb-4
                  prose-strong:text-navy-900 prose-strong:font-semibold
                  prose-a:text-gold-600 prose-a:font-medium prose-a:no-underline hover:prose-a:underline
                  prose-ul:my-4 prose-ul:pl-6 prose-ul:list-disc prose-ul:space-y-1.5
                  prose-ol:my-4 prose-ol:pl-6 prose-ol:list-decimal prose-ol:space-y-1.5
                  prose-li:my-1 prose-li:text-gray-700 prose-li:leading-relaxed prose-li:pl-1
                  prose-blockquote:border-l-4 prose-blockquote:border-gold-500 prose-blockquote:pl-4 prose-blockquote:italic prose-blockquote:text-gray-600
                  prose-code:text-sm prose-code:bg-gray-100 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded
                  prose-pre:bg-gray-900 prose-pre:text-gray-100
                  prose-hr:border-gray-200 prose-hr:my-6
                  [&_p_strong]:text-navy-900 [&_p_strong]:font-semibold
                  [&_p]:[text-align:left]
                  [&_p:has(>_strong:first-child)]:mb-2
                  [&_p:has(>_strong:first-child)]:mt-0
                  [&_p]:[&:not(:has(ul))]:[&:not(:has(ol))]:[&:not(:has(li))]:before:content-none
                  [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:my-4
                  [&_ol]:list-decimal [&_ol]:pl-6 [&_ol]:my-4
                  [&_li]:my-1.5 [&_li]:leading-relaxed"
                dangerouslySetInnerHTML={{
                  __html: job.description
                    // Remove plain text bullets from paragraphs (•, ·, ▪, ▫, -)
                    .replace(/<p>([•·▪▫-])\s*/gi, '<p>')
                    .replace(/\s*([•·▪▫-])\s*/g, ' ')
                    // Clean up any double spaces
                    .replace(/\s{2,}/g, ' ')
                }}
              />
            </div>
          )}

          {/* Requirements */}
          {requirements && Object.keys(requirements).length > 0 && (
            <div className="mb-6">
              <h3 className="mb-3 text-base font-semibold text-navy-900 sm:text-lg">Requirements</h3>
              <ul className="space-y-2.5">
                {typeof requirements.experience_years_min === "number" && (
                  <li className="flex items-start gap-2.5 text-sm text-gray-700">
                    <Check className="mt-0.5 size-4 shrink-0 text-success-500" />
                    <span>Minimum {String(requirements.experience_years_min)} years experience</span>
                  </li>
                )}
                {Array.isArray(requirements.certifications_required) &&
                  (requirements.certifications_required as string[]).map((cert: string) => (
                    <li
                      key={cert}
                      className="flex items-start gap-2.5 text-sm text-gray-700"
                    >
                      <Check className="mt-0.5 size-4 shrink-0 text-success-500" />
                      <span>{cert} required</span>
                    </li>
                  ))}
                {Array.isArray(requirements.languages_required) &&
                  (requirements.languages_required as string[]).map((lang: string) => (
                    <li
                      key={lang}
                      className="flex items-start gap-2.5 text-sm text-gray-700"
                    >
                      <Check className="mt-0.5 size-4 shrink-0 text-success-500" />
                      <span>{lang} required</span>
                    </li>
                  ))}
                {Boolean(requirements.non_smoker) && (
                  <li className="flex items-start gap-2.5 text-sm text-gray-700">
                    <Check className="mt-0.5 size-4 shrink-0 text-success-500" />
                    <span>Non-smoker preferred</span>
                  </li>
                )}
              </ul>
            </div>
          )}

          {/* Action Buttons */}
          <div className="border-t border-gray-100 pt-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              {/* Save Button */}
              {showSaveButton && onToggleSave && (
                <button
                  onClick={onToggleSave}
                  disabled={isSaving}
                  className={cn(
                    "flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-colors sm:justify-start",
                    isSaved
                      ? "bg-gold-100 text-gold-700 hover:bg-gold-200"
                      : "border border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
                  )}
                >
                  {isSaving ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <Bookmark className={cn("size-4", isSaved && "fill-current")} />
                  )}
                  {isSaved ? "Saved" : "Save for Later"}
                </button>
              )}

              <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                <Button
                  variant="secondary"
                  onClick={onClose}
                  className="w-full sm:w-auto sm:min-w-[100px]"
                >
                  Close
                </Button>
                {hasApplied ? (
                  <Button
                    variant="secondary"
                    disabled
                    className="w-full sm:w-auto sm:min-w-[140px]"
                  >
                    <CheckCircle2 className="mr-2 size-4 text-success-500" />
                    Already Applied
                  </Button>
                ) : onApply && (
                  <Button
                    variant="primary"
                    onClick={onApply}
                    disabled={isApplying}
                    className="w-full sm:w-auto sm:min-w-[140px]"
                  >
                    {isApplying ? (
                      <>
                        <Loader2 className="mr-2 size-4 animate-spin" />
                        Submitting...
                      </>
                    ) : (
                      <>
                        <Send className="mr-2 size-4" />
                        Apply Now
                      </>
                    )}
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
