"use client";

import * as React from "react";
import {
  Search,
  X,
  MapPin,
  Ship,
  Calendar,
  DollarSign,
  Clock,
  SlidersHorizontal,
  Check,
  AlertCircle,
  CheckCircle2,
  Send,
  Shield,
  Loader2,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Anchor,
  CalendarClock,
  HelpCircle,
  Bookmark,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { type JobsPageData, type JobListing, applyToJob, getJobsData, type JobFilters, saveJob, unsaveJob } from "./actions";

// Helper functions
function formatDate(dateStr: string | null): string {
  if (!dateStr) return "Flexible";
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatRelativeDate(dateStr: string): string {
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
  min: number | null,
  max: number | null,
  currency: string
): string {
  if (!min && !max) return "Competitive";
  if (min && max) {
    return `${currency} ${min.toLocaleString("en-US")}-${max.toLocaleString("en-US")}`;
  }
  if (min) return `${currency} ${min.toLocaleString("en-US")}+`;
  return `Up to ${currency} ${max?.toLocaleString("en-US")}`;
}

function formatContractType(type: string | null): string {
  if (!type) return "Contract";
  return type.charAt(0).toUpperCase() + type.slice(1);
}

// Match score badge with match type context and tooltip
function MatchScoreBadge({
  score,
  matchType,
  showTooltip = false,
}: {
  score: number | null;
  matchType: "exact" | "related" | "none";
  showTooltip?: boolean;
}) {
  const [tooltipOpen, setTooltipOpen] = React.useState(false);

  if (!score) return null;

  // Different styling based on match type
  let colorClass = "bg-gray-100 text-gray-700";
  let label = `${score}% Match`;

  if (matchType === "exact") {
    colorClass = "bg-success-100 text-success-700";
    label = `${score}% Match`;
  } else if (matchType === "related") {
    colorClass = "bg-blue-100 text-blue-700";
    label = `${score}% Related`;
  } else if (score >= 70) {
    colorClass = "bg-warning-100 text-warning-700";
  }

  const tooltipContent = matchType === "exact"
    ? "This job matches your primary position. Score is based on your experience, certifications, and preferences."
    : matchType === "related"
    ? "This job is related to positions in your profile. You may be qualified based on transferable skills."
    : "Match score is calculated from your profile, experience, and job requirements.";

  return (
    <div className="relative">
      <button
        type="button"
        className={cn(
          "flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium transition-colors",
          colorClass,
          showTooltip && "cursor-help"
        )}
        onMouseEnter={() => showTooltip && setTooltipOpen(true)}
        onMouseLeave={() => setTooltipOpen(false)}
        onClick={(e) => {
          if (showTooltip) {
            e.stopPropagation();
            setTooltipOpen(!tooltipOpen);
          }
        }}
      >
        <Sparkles className="size-3" />
        {label}
        {showTooltip && <HelpCircle className="size-3 opacity-60" />}
      </button>

      {/* Tooltip */}
      {tooltipOpen && (
        <div className="absolute left-1/2 top-full z-50 mt-2 w-64 -translate-x-1/2 rounded-lg bg-navy-900 px-3 py-2 text-xs text-white shadow-lg">
          <div className="absolute -top-1.5 left-1/2 -translate-x-1/2 border-[6px] border-transparent border-b-navy-900" />
          <p className="font-medium mb-1">
            {matchType === "exact" ? "Exact Match" : matchType === "related" ? "Related Position" : "Match Score"}
          </p>
          <p className="text-gray-300 leading-relaxed">
            {tooltipContent}
          </p>
        </div>
      )}
    </div>
  );
}

// Contract Badge Component
function ContractBadge({ type }: { type: string | null }) {
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

// Job Card Component
function JobCard({
  job,
  onView,
  onQuickApply,
  isApplying,
  onToggleSave,
  isSaving,
}: {
  job: JobListing;
  onView: () => void;
  onQuickApply: () => void;
  isApplying: boolean;
  onToggleSave: () => void;
  isSaving: boolean;
}) {
  return (
    <div className="group relative rounded-xl border border-gray-200 bg-white p-5 transition-all hover:border-gray-300 hover:shadow-md">
      {/* Urgent Badge */}
      {job.isUrgent && (
        <div className="absolute -left-2 top-4 rounded-r-full bg-error-500 px-3 py-1 text-xs font-bold text-white shadow-sm">
          URGENT
        </div>
      )}

      {/* Stats & Match Score */}
      <div className="absolute right-4 top-4 flex items-center gap-2">
        <MatchScoreBadge score={job.matchScore} matchType={job.matchType} showTooltip />
        <span className="flex items-center gap-1 rounded-full bg-gray-100 px-2.5 py-1 text-xs text-gray-600">
          {job.applicationsCount} applied
        </span>
      </div>

      {/* Main Content */}
      <div className="pr-48">
        <h3 className="text-lg font-semibold text-navy-900">{job.title}</h3>
        <p className="mt-1 text-gray-600">
          {job.vesselName || (
            <span className="flex items-center gap-1 italic text-gray-500">
              <Shield className="size-4" />
              Confidential Listing
            </span>
          )}
        </p>
      </div>

      {/* Details Grid */}
      <div className="mt-4 grid grid-cols-2 gap-x-6 gap-y-2 text-sm sm:grid-cols-4">
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
      <div className="mt-4 flex items-center justify-between border-t border-gray-100 pt-4">
        <div className="flex items-center gap-3">
          <ContractBadge type={job.contractType} />
          <span className="text-xs text-gray-400">
            Posted {formatRelativeDate(job.createdAt)}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {/* Bookmark Button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleSave();
            }}
            disabled={isSaving}
            className={cn(
              "rounded-lg p-2 transition-colors",
              job.isSaved
                ? "bg-gold-100 text-gold-600 hover:bg-gold-200"
                : "text-gray-400 hover:bg-gray-100 hover:text-gray-600"
            )}
            title={job.isSaved ? "Remove from saved" : "Save for later"}
          >
            {isSaving ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Bookmark className={cn("size-4", job.isSaved && "fill-current")} />
            )}
          </button>
          <Button variant="secondary" size="sm" onClick={onView}>
            View Details
          </Button>
          {job.hasApplied ? (
            <Button variant="secondary" size="sm" disabled>
              <CheckCircle2 className="mr-1 size-3 text-success-500" />
              Applied
            </Button>
          ) : (
            <Button
              variant="primary"
              size="sm"
              onClick={onQuickApply}
              disabled={isApplying}
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

// Job Detail Modal Component
function JobDetailModal({
  job,
  onClose,
  onApply,
  isApplying,
  onToggleSave,
  isSaving,
}: {
  job: JobListing;
  onClose: () => void;
  onApply: () => void;
  isApplying: boolean;
  onToggleSave: () => void;
  isSaving: boolean;
}) {
  const requirements = job.requirements;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/50 p-4 pt-20">
      <div className="relative w-full max-w-3xl rounded-2xl bg-white shadow-xl">
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-start justify-between rounded-t-2xl border-b border-gray-100 bg-white p-6">
          <div>
            <div className="flex items-center gap-3">
              <h2 className="font-serif text-2xl font-medium text-navy-800">
                {job.title}
              </h2>
              {job.isUrgent && (
                <span className="rounded-full bg-error-100 px-2 py-0.5 text-xs font-bold text-error-600">
                  URGENT
                </span>
              )}
              <MatchScoreBadge score={job.matchScore} matchType={job.matchType} showTooltip />
            </div>
            <p className="mt-1 text-gray-600">
              {job.vesselName || "Confidential Listing"}
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
          >
            <X className="size-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Key Info */}
          <div className="mb-6 flex flex-wrap items-center gap-4">
            <ContractBadge type={job.contractType} />
            <span className="flex items-center gap-1 text-sm text-gray-500">
              <Clock className="size-4" />
              Posted {formatRelativeDate(job.createdAt)}
            </span>
            {job.applyDeadline && (
              <span className="flex items-center gap-1 text-sm text-warning-600">
                <AlertCircle className="size-4" />
                Apply by {formatDate(job.applyDeadline)}
              </span>
            )}
          </div>

          {/* Quick Stats */}
          <div className="mb-6 grid grid-cols-2 gap-4 rounded-xl bg-gray-50 p-4 sm:grid-cols-4">
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
          </div>

          {/* Additional Info Row */}
          {(job.holidayDays || job.rotationSchedule) && (
            <div className="mb-6 flex flex-wrap gap-4">
              {job.holidayDays && (
                <div className="flex items-center gap-2 rounded-lg bg-success-50 px-3 py-2 text-sm">
                  <CalendarClock className="size-4 text-success-600" />
                  <span className="text-success-700">{job.holidayDays} days holiday</span>
                </div>
              )}
              {job.rotationSchedule && (
                <div className="flex items-center gap-2 rounded-lg bg-blue-50 px-3 py-2 text-sm">
                  <Anchor className="size-4 text-blue-600" />
                  <span className="text-blue-700">{job.rotationSchedule}</span>
                </div>
              )}
            </div>
          )}

          {/* Description */}
          {job.description && (
            <div className="mb-6">
              <h3 className="mb-3 font-semibold text-navy-900">
                About This Position
              </h3>
              <p className="whitespace-pre-line text-sm leading-relaxed text-gray-600">
                {job.description}
              </p>
            </div>
          )}

          {/* Requirements */}
          {requirements && Object.keys(requirements).length > 0 && (
            <div className="mb-6">
              <h3 className="mb-3 font-semibold text-navy-900">Requirements</h3>
              <ul className="space-y-2">
                {typeof requirements.experience_years_min === "number" && (
                  <li className="flex items-start gap-2 text-sm text-gray-600">
                    <Check className="mt-0.5 size-4 shrink-0 text-success-500" />
                    Minimum {String(requirements.experience_years_min)} years experience
                  </li>
                )}
                {Array.isArray(requirements.certifications_required) &&
                  (requirements.certifications_required as string[]).map((cert: string) => (
                    <li
                      key={cert}
                      className="flex items-start gap-2 text-sm text-gray-600"
                    >
                      <Check className="mt-0.5 size-4 shrink-0 text-success-500" />
                      {cert} required
                    </li>
                  ))}
                {Array.isArray(requirements.languages_required) &&
                  (requirements.languages_required as string[]).map((lang: string) => (
                    <li
                      key={lang}
                      className="flex items-start gap-2 text-sm text-gray-600"
                    >
                      <Check className="mt-0.5 size-4 shrink-0 text-success-500" />
                      {lang} required
                    </li>
                  ))}
                {Boolean(requirements.non_smoker) && (
                  <li className="flex items-start gap-2 text-sm text-gray-600">
                    <Check className="mt-0.5 size-4 shrink-0 text-success-500" />
                    Non-smoker preferred
                  </li>
                )}
              </ul>
            </div>
          )}

          {/* Benefits */}
          {job.benefits && (
            <div className="mb-6">
              <h3 className="mb-3 font-semibold text-navy-900">
                Benefits & Package
              </h3>
              <p className="text-sm text-gray-600">{job.benefits}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 flex items-center justify-between rounded-b-2xl border-t border-gray-100 bg-white p-4">
          {/* Bookmark Button */}
          <button
            onClick={onToggleSave}
            disabled={isSaving}
            className={cn(
              "flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
              job.isSaved
                ? "bg-gold-100 text-gold-700 hover:bg-gold-200"
                : "text-gray-600 hover:bg-gray-100 hover:text-gray-800"
            )}
          >
            {isSaving ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Bookmark className={cn("size-4", job.isSaved && "fill-current")} />
            )}
            {job.isSaved ? "Saved" : "Save for Later"}
          </button>

          <div className="flex items-center gap-3">
            <Button variant="secondary" onClick={onClose}>
              Close
            </Button>
            {job.hasApplied ? (
              <Button variant="secondary" disabled>
                <CheckCircle2 className="mr-2 size-4 text-success-500" />
                Already Applied
              </Button>
            ) : (
              <Button
                variant="primary"
                onClick={onApply}
                disabled={isApplying}
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
  );
}

// Main Component
export function JobsClient({ data: initialData }: { data: JobsPageData }) {
  const [jobs, setJobs] = React.useState(initialData.jobs);
  const [appliedJobIds, setAppliedJobIds] = React.useState<string[]>(initialData.appliedJobIds);
  const [savedJobIds, setSavedJobIds] = React.useState<string[]>(initialData.savedJobIds);
  const [totalCount, setTotalCount] = React.useState(initialData.totalCount);

  const [searchQuery, setSearchQuery] = React.useState("");
  const [filtersExpanded, setFiltersExpanded] = React.useState(false);
  const [selectedJob, setSelectedJob] = React.useState<JobListing | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);
  const [applyingJobId, setApplyingJobId] = React.useState<string | null>(null);
  const [savingJobId, setSavingJobId] = React.useState<string | null>(null);
  const [applySuccess, setApplySuccess] = React.useState<string | null>(null);
  const [applyError, setApplyError] = React.useState<string | null>(null);

  // Filter states
  const [positionFilter, setPositionFilter] = React.useState("");
  const [regionFilter, setRegionFilter] = React.useState("");
  const [contractFilter, setContractFilter] = React.useState("");

  // Debounced search
  const searchTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);

  const fetchJobs = React.useCallback(async (filters: JobFilters = {}) => {
    setIsLoading(true);
    try {
      const result = await getJobsData(filters);
      if (result) {
        // Update hasApplied status based on current appliedJobIds
        setAppliedJobIds(prevAppliedIds => {
          const mergedIds = [...new Set([...prevAppliedIds, ...result.appliedJobIds])];
          // Update jobs with merged applied IDs
          const updatedJobs = result.jobs.map(job => ({
            ...job,
            hasApplied: mergedIds.includes(job.id),
          }));
          setJobs(updatedJobs);
          return mergedIds;
        });
        setTotalCount(result.totalCount);
      }
    } catch (error) {
      console.error("Error fetching jobs:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Handle filter changes
  React.useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    searchTimeoutRef.current = setTimeout(() => {
      const filters: JobFilters = {};
      if (searchQuery) filters.position = searchQuery;
      if (positionFilter) filters.position = positionFilter;
      if (regionFilter) filters.region = regionFilter;
      if (contractFilter) filters.contractType = contractFilter;

      fetchJobs(filters);
    }, 300);

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchQuery, positionFilter, regionFilter, contractFilter, fetchJobs]);

  const handleApply = async (jobId: string) => {
    setApplyingJobId(jobId);
    setApplyError(null);
    setApplySuccess(null);

    try {
      const result = await applyToJob(jobId);
      if (result.success) {
        setApplySuccess("Application submitted successfully!");
        setAppliedJobIds(prev => [...prev, jobId]);
        // Update the job in the list
        setJobs(prev => prev.map(job =>
          job.id === jobId ? { ...job, hasApplied: true } : job
        ));
        // Update selected job if open
        if (selectedJob?.id === jobId) {
          setSelectedJob({ ...selectedJob, hasApplied: true });
        }
        setTimeout(() => setApplySuccess(null), 5000);
      } else {
        setApplyError(result.error || "Failed to apply");
      }
    } catch (err) {
      setApplyError(err instanceof Error ? err.message : "Failed to apply");
    } finally {
      setApplyingJobId(null);
    }
  };

  const handleToggleSave = async (jobId: string) => {
    setSavingJobId(jobId);

    const isSaved = savedJobIds.includes(jobId);

    try {
      if (isSaved) {
        const result = await unsaveJob(jobId);
        if (result.success) {
          setSavedJobIds(prev => prev.filter(id => id !== jobId));
          // Update the job in the list
          setJobs(prev => prev.map(job =>
            job.id === jobId ? { ...job, isSaved: false } : job
          ));
          // Update selected job if open
          if (selectedJob?.id === jobId) {
            setSelectedJob({ ...selectedJob, isSaved: false });
          }
        }
      } else {
        const result = await saveJob(jobId);
        if (result.success) {
          setSavedJobIds(prev => [...prev, jobId]);
          // Update the job in the list
          setJobs(prev => prev.map(job =>
            job.id === jobId ? { ...job, isSaved: true } : job
          ));
          // Update selected job if open
          if (selectedJob?.id === jobId) {
            setSelectedJob({ ...selectedJob, isSaved: true });
          }
        }
      }
    } catch (err) {
      console.error("Failed to toggle save:", err);
    } finally {
      setSavingJobId(null);
    }
  };

  const clearFilters = () => {
    setPositionFilter("");
    setRegionFilter("");
    setContractFilter("");
    setSearchQuery("");
  };

  const hasActiveFilters = positionFilter || regionFilter || contractFilter || searchQuery;

  // Get unique values for filter dropdowns from current jobs
  const regions = [...new Set(jobs.map(j => j.location).filter(Boolean))] as string[];
  const contractTypes = [...new Set(jobs.map(j => j.contractType).filter(Boolean))] as string[];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Success/Error Toast */}
      {applySuccess && (
        <div className="fixed right-4 top-4 z-50 flex items-center gap-2 rounded-lg bg-success-500 px-4 py-3 text-white shadow-lg">
          <CheckCircle2 className="size-5" />
          {applySuccess}
        </div>
      )}
      {applyError && (
        <div className="fixed right-4 top-4 z-50 flex items-center gap-2 rounded-lg bg-error-500 px-4 py-3 text-white shadow-lg">
          <AlertCircle className="size-5" />
          {applyError}
          <button onClick={() => setApplyError(null)} className="ml-2">
            <X className="size-4" />
          </button>
        </div>
      )}

      {/* Header */}
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto max-w-6xl px-6 py-6">
          <div className="mb-6">
            <h1 className="font-serif text-3xl font-medium text-navy-800">
              Browse Jobs
            </h1>
            <p className="mt-2 text-gray-600">
              {initialData.candidateSoughtPositions.length > 0 ? (
                <>
                  Matching jobs for{" "}
                  <span className="font-medium text-gold-600">
                    {initialData.candidateSoughtPositions.slice(0, 3).join(", ")}
                    {initialData.candidateSoughtPositions.length > 3 && (
                      <span className="text-gray-500"> +{initialData.candidateSoughtPositions.length - 3} more</span>
                    )}
                  </span>
                </>
              ) : initialData.candidatePosition ? (
                <>
                  Jobs matched for <span className="font-medium text-gold-600">{initialData.candidatePosition}</span>
                </>
              ) : (
                "Find your next position in yachting or private service"
              )}
            </p>
          </div>

          {/* Search Bar */}
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search positions, locations..."
                className="h-12 w-full rounded-xl border border-gray-300 bg-white pl-12 pr-4 text-base placeholder:text-gray-400 focus:border-gold-500 focus:outline-none focus:ring-2 focus:ring-gold-500/20"
              />
            </div>
          </div>

          {/* Filter Bar */}
          <div className="mt-4 border-t border-gray-100 pt-4">
            <div className="flex items-center justify-between">
              <button
                onClick={() => setFiltersExpanded(!filtersExpanded)}
                className="flex items-center gap-2 text-sm font-medium text-gray-700"
              >
                <SlidersHorizontal className="size-4" />
                Filters
                {hasActiveFilters && (
                  <span className="rounded-full bg-gold-500 px-2 py-0.5 text-xs font-bold text-white">
                    Active
                  </span>
                )}
                {filtersExpanded ? (
                  <ChevronUp className="size-4" />
                ) : (
                  <ChevronDown className="size-4" />
                )}
              </button>

              {hasActiveFilters && (
                <button
                  onClick={clearFilters}
                  className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
                >
                  <X className="size-3" />
                  Clear All
                </button>
              )}
            </div>

            {filtersExpanded && (
              <div className="mt-4 flex flex-wrap items-end gap-4">
                {/* Region */}
                <div>
                  <label className="mb-1 block text-xs text-gray-500">
                    Region
                  </label>
                  <select
                    value={regionFilter}
                    onChange={(e) => setRegionFilter(e.target.value)}
                    className="h-9 rounded-lg border border-gray-300 bg-white px-3 text-sm focus:border-gold-500 focus:outline-none focus:ring-1 focus:ring-gold-500"
                  >
                    <option value="">All Regions</option>
                    {regions.map((region) => (
                      <option key={region} value={region}>
                        {region}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Contract Type */}
                <div>
                  <label className="mb-1 block text-xs text-gray-500">
                    Contract Type
                  </label>
                  <select
                    value={contractFilter}
                    onChange={(e) => setContractFilter(e.target.value)}
                    className="h-9 rounded-lg border border-gray-300 bg-white px-3 text-sm focus:border-gold-500 focus:outline-none focus:ring-1 focus:ring-gold-500"
                  >
                    <option value="">All Types</option>
                    {contractTypes.map((type) => (
                      <option key={type} value={type}>
                        {type.charAt(0).toUpperCase() + type.slice(1)}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Results */}
      <main className="mx-auto max-w-6xl px-6 py-6">
        {/* Results Header */}
        <div className="mb-4 flex items-center justify-between">
          <p className="text-sm text-gray-600">
            {isLoading ? (
              "Loading..."
            ) : (
              <>
                <span className="font-semibold text-navy-900">{totalCount}</span>{" "}
                jobs found
              </>
            )}
          </p>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="size-8 animate-spin text-gold-500" />
          </div>
        )}

        {/* Empty State */}
        {!isLoading && jobs.length === 0 && (
          <div className="flex flex-col items-center justify-center rounded-xl border border-gray-200 bg-white py-16">
            <Search className="size-12 text-gray-300" />
            <h3 className="mt-4 font-semibold text-gray-600">No jobs found</h3>
            <p className="mt-1 text-sm text-gray-500">
              Try adjusting your filters or search terms
            </p>
            {hasActiveFilters && (
              <Button variant="secondary" className="mt-4" onClick={clearFilters}>
                Clear All Filters
              </Button>
            )}
          </div>
        )}

        {/* Job List */}
        {!isLoading && jobs.length > 0 && (
          <div className="space-y-4">
            {jobs.map((job) => (
              <JobCard
                key={job.id}
                job={job}
                onView={() => setSelectedJob(job)}
                onQuickApply={() => handleApply(job.id)}
                isApplying={applyingJobId === job.id}
                onToggleSave={() => handleToggleSave(job.id)}
                isSaving={savingJobId === job.id}
              />
            ))}
          </div>
        )}
      </main>

      {/* Job Detail Modal */}
      {selectedJob && (
        <JobDetailModal
          job={selectedJob}
          onClose={() => setSelectedJob(null)}
          onApply={() => handleApply(selectedJob.id)}
          isApplying={applyingJobId === selectedJob.id}
          onToggleSave={() => handleToggleSave(selectedJob.id)}
          isSaving={savingJobId === selectedJob.id}
        />
      )}
    </div>
  );
}
