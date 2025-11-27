"use client";

import * as React from "react";
import {
  Search,
  Sparkles,
  ChevronDown,
  ChevronUp,
  X,
  Heart,
  MapPin,
  Ship,
  Calendar,
  DollarSign,
  Clock,
  SlidersHorizontal,
  Check,
  AlertCircle,
  CheckCircle2,
  TrendingUp,
  Send,
  Shield,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  usePublicJobs,
  useApplyToJob,
  type PublicJobSearchParams,
} from "@/hooks/usePublicJobs";
import type { PublicJob } from "@/lib/validations/public-job";

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
    return `${currency} ${min.toLocaleString()}-${max.toLocaleString()}`;
  }
  if (min) return `${currency} ${min.toLocaleString()}+`;
  return `Up to ${currency} ${max?.toLocaleString()}`;
}

function formatContractType(type: string | null): string {
  if (!type) return "Contract";
  return type.charAt(0).toUpperCase() + type.slice(1);
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
}: {
  job: PublicJob;
  onView: () => void;
  onQuickApply: () => void;
  isApplying: boolean;
}) {
  return (
    <div className="group relative rounded-xl border border-gray-200 bg-white p-5 transition-all hover:border-gray-300 hover:shadow-md">
      {/* Urgent Badge */}
      {job.is_urgent && (
        <div className="absolute -left-2 top-4 rounded-r-full bg-error-500 px-3 py-1 text-xs font-bold text-white shadow-sm">
          URGENT
        </div>
      )}

      {/* Stats & Actions */}
      <div className="absolute right-4 top-4 flex items-center gap-2">
        <span className="flex items-center gap-1 rounded-full bg-gray-100 px-2.5 py-1 text-xs text-gray-600">
          {job.applications_count} applied
        </span>
      </div>

      {/* Main Content */}
      <div className="pr-32">
        <h3 className="text-lg font-semibold text-navy-900">{job.title}</h3>
        <p className="mt-1 text-gray-600">
          {job.agency_name || (
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
            {job.vessel_type || "Yacht"}{" "}
            {job.vessel_size_meters ? `• ${job.vessel_size_meters}m` : ""}
          </span>
        </div>
        <div className="flex items-center gap-2 text-gray-600">
          <MapPin className="size-4 text-gray-400" />
          <span>{job.primary_region || "Various"}</span>
        </div>
        <div className="flex items-center gap-2 text-gray-600">
          <DollarSign className="size-4 text-gray-400" />
          <span>
            {formatSalary(job.salary_min, job.salary_max, job.salary_currency)}/
            {job.salary_period === "year" ? "yr" : "mo"}
          </span>
        </div>
        <div className="flex items-center gap-2 text-gray-600">
          <Calendar className="size-4 text-gray-400" />
          <span>Start: {formatDate(job.start_date)}</span>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-4 flex items-center justify-between border-t border-gray-100 pt-4">
        <div className="flex items-center gap-3">
          <ContractBadge type={job.contract_type} />
          <span className="text-xs text-gray-400">
            Posted {formatRelativeDate(job.created_at)}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm" onClick={onView}>
            View Details
          </Button>
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
}: {
  job: PublicJob;
  onClose: () => void;
  onApply: () => void;
  isApplying: boolean;
}) {
  const requirements = job.requirements as Record<string, unknown>;

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
              {job.is_urgent && (
                <span className="rounded-full bg-error-100 px-2 py-0.5 text-xs font-bold text-error-600">
                  URGENT
                </span>
              )}
            </div>
            <p className="mt-1 text-gray-600">
              {job.agency_name || "Confidential Listing"}
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
            <ContractBadge type={job.contract_type} />
            <span className="flex items-center gap-1 text-sm text-gray-500">
              <Clock className="size-4" />
              Posted {formatRelativeDate(job.created_at)}
            </span>
            {job.apply_deadline && (
              <span className="flex items-center gap-1 text-sm text-warning-600">
                <AlertCircle className="size-4" />
                Apply by {formatDate(job.apply_deadline)}
              </span>
            )}
          </div>

          {/* Quick Stats */}
          <div className="mb-6 grid grid-cols-2 gap-4 rounded-xl bg-gray-50 p-4 sm:grid-cols-4">
            <div>
              <p className="text-xs text-gray-500">Yacht</p>
              <p className="font-medium text-navy-900">
                {job.vessel_type || "Not specified"}{" "}
                {job.vessel_size_meters ? `• ${job.vessel_size_meters}m` : ""}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Location</p>
              <p className="font-medium text-navy-900">
                {job.primary_region || "Various"}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Salary</p>
              <p className="font-medium text-navy-900">
                {formatSalary(job.salary_min, job.salary_max, job.salary_currency)}/
                {job.salary_period === "year" ? "yr" : "mo"}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Start Date</p>
              <p className="font-medium text-navy-900">
                {formatDate(job.start_date)}
              </p>
            </div>
          </div>

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
                {requirements.experience_years_min && (
                  <li className="flex items-start gap-2 text-sm text-gray-600">
                    <Check className="mt-0.5 size-4 shrink-0 text-success-500" />
                    Minimum {requirements.experience_years_min} years experience
                  </li>
                )}
                {Array.isArray(requirements.certifications_required) &&
                  requirements.certifications_required.map((cert: string) => (
                    <li
                      key={cert}
                      className="flex items-start gap-2 text-sm text-gray-600"
                    >
                      <Check className="mt-0.5 size-4 shrink-0 text-success-500" />
                      {cert} required
                    </li>
                  ))}
                {Array.isArray(requirements.languages_required) &&
                  requirements.languages_required.map((lang: string) => (
                    <li
                      key={lang}
                      className="flex items-start gap-2 text-sm text-gray-600"
                    >
                      <Check className="mt-0.5 size-4 shrink-0 text-success-500" />
                      {lang} required
                    </li>
                  ))}
                {requirements.non_smoker && (
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

          {/* Rotation Schedule */}
          {job.rotation_schedule && (
            <div className="mb-6">
              <h3 className="mb-3 font-semibold text-navy-900">
                Rotation Schedule
              </h3>
              <p className="text-sm text-gray-600">{job.rotation_schedule}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 flex items-center justify-end gap-3 rounded-b-2xl border-t border-gray-100 bg-white p-4">
          <Button variant="secondary" onClick={onClose}>
            Close
          </Button>
          <Button
            variant="primary"
            leftIcon={
              isApplying ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Send className="size-4" />
              )
            }
            onClick={onApply}
            disabled={isApplying}
          >
            {isApplying ? "Submitting..." : "Apply Now"}
          </Button>
        </div>
      </div>
    </div>
  );
}

// Main Component
export default function JobSearchPage() {
  const [searchQuery, setSearchQuery] = React.useState("");
  const [debouncedSearch, setDebouncedSearch] = React.useState("");
  const [filtersExpanded, setFiltersExpanded] = React.useState(true);
  const [selectedJob, setSelectedJob] = React.useState<PublicJob | null>(null);
  const [sortBy, setSortBy] = React.useState<PublicJobSearchParams["sort_by"]>("newest");
  const [page, setPage] = React.useState(1);
  const [applyingJobId, setApplyingJobId] = React.useState<string | null>(null);
  const [applySuccess, setApplySuccess] = React.useState<string | null>(null);
  const [applyError, setApplyError] = React.useState<string | null>(null);

  // Filter states
  const [positionFilter, setPositionFilter] = React.useState("");
  const [regionFilter, setRegionFilter] = React.useState("");
  const [contractFilter, setContractFilter] = React.useState("");
  const [vesselTypeFilter, setVesselTypeFilter] = React.useState("");

  // Debounce search
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Fetch jobs
  const { data, isLoading, error } = usePublicJobs({
    search: debouncedSearch || undefined,
    position: positionFilter || undefined,
    region: regionFilter || undefined,
    contract_type: contractFilter || undefined,
    vessel_type: vesselTypeFilter || undefined,
    sort_by: sortBy,
    page,
    limit: 12,
  });

  // Apply mutation
  const applyMutation = useApplyToJob();

  const handleApply = async (jobId: string) => {
    setApplyingJobId(jobId);
    setApplyError(null);
    setApplySuccess(null);

    try {
      await applyMutation.mutateAsync({ jobId });
      setApplySuccess("Application submitted successfully!");
      setSelectedJob(null);
      setTimeout(() => setApplySuccess(null), 5000);
    } catch (err) {
      setApplyError(err instanceof Error ? err.message : "Failed to apply");
    } finally {
      setApplyingJobId(null);
    }
  };

  const clearFilters = () => {
    setPositionFilter("");
    setRegionFilter("");
    setContractFilter("");
    setVesselTypeFilter("");
    setSearchQuery("");
    setPage(1);
  };

  const hasActiveFilters =
    positionFilter || regionFilter || contractFilter || vesselTypeFilter;

  const jobs = data?.data || [];
  const filters = data?.filters;
  const pagination = data?.pagination;

  const sortOptions = [
    { value: "newest", label: "Newest First" },
    { value: "oldest", label: "Oldest First" },
    { value: "salary_high", label: "Salary: High to Low" },
    { value: "salary_low", label: "Salary: Low to High" },
  ];

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
      <header className="sticky top-0 z-20 border-b border-gray-200 bg-white">
        <div className="mx-auto max-w-6xl px-6 py-4">
          {/* Search Bar */}
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search positions, locations, yacht types..."
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

            {filtersExpanded && filters && (
              <div className="mt-4 flex flex-wrap items-end gap-4">
                {/* Position */}
                <div>
                  <label className="mb-1 block text-xs text-gray-500">
                    Position
                  </label>
                  <select
                    value={positionFilter}
                    onChange={(e) => {
                      setPositionFilter(e.target.value);
                      setPage(1);
                    }}
                    className="h-9 rounded-lg border border-gray-300 bg-white px-3 text-sm focus:border-gold-500 focus:outline-none focus:ring-1 focus:ring-gold-500"
                  >
                    <option value="">All Positions</option>
                    {filters.positions.map((pos) => (
                      <option key={pos} value={pos}>
                        {pos.charAt(0).toUpperCase() + pos.slice(1)}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Region */}
                <div>
                  <label className="mb-1 block text-xs text-gray-500">
                    Region
                  </label>
                  <select
                    value={regionFilter}
                    onChange={(e) => {
                      setRegionFilter(e.target.value);
                      setPage(1);
                    }}
                    className="h-9 rounded-lg border border-gray-300 bg-white px-3 text-sm focus:border-gold-500 focus:outline-none focus:ring-1 focus:ring-gold-500"
                  >
                    <option value="">All Regions</option>
                    {filters.regions.map((region) => (
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
                    onChange={(e) => {
                      setContractFilter(e.target.value);
                      setPage(1);
                    }}
                    className="h-9 rounded-lg border border-gray-300 bg-white px-3 text-sm focus:border-gold-500 focus:outline-none focus:ring-1 focus:ring-gold-500"
                  >
                    <option value="">All Types</option>
                    {filters.contractTypes.map((type) => (
                      <option key={type} value={type}>
                        {type.charAt(0).toUpperCase() + type.slice(1)}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Vessel Type */}
                <div>
                  <label className="mb-1 block text-xs text-gray-500">
                    Vessel Type
                  </label>
                  <select
                    value={vesselTypeFilter}
                    onChange={(e) => {
                      setVesselTypeFilter(e.target.value);
                      setPage(1);
                    }}
                    className="h-9 rounded-lg border border-gray-300 bg-white px-3 text-sm focus:border-gold-500 focus:outline-none focus:ring-1 focus:ring-gold-500"
                  >
                    <option value="">All Vessels</option>
                    {filters.vesselTypes.map((type) => (
                      <option key={type} value={type}>
                        {type}
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
                <span className="font-semibold text-navy-900">
                  {pagination?.total || 0}
                </span>{" "}
                jobs found
              </>
            )}
          </p>

          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500">Sort by:</span>
            <select
              value={sortBy}
              onChange={(e) => {
                setSortBy(e.target.value as PublicJobSearchParams["sort_by"]);
                setPage(1);
              }}
              className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium focus:border-gold-500 focus:outline-none focus:ring-1 focus:ring-gold-500"
            >
              {sortOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="size-8 animate-spin text-gold-500" />
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="flex flex-col items-center justify-center rounded-xl border border-error-200 bg-error-50 py-16">
            <AlertCircle className="size-12 text-error-400" />
            <h3 className="mt-4 font-semibold text-error-600">
              Failed to load jobs
            </h3>
            <p className="mt-1 text-sm text-error-500">
              {error instanceof Error ? error.message : "Please try again later"}
            </p>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && !error && jobs.length === 0 && (
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
        {!isLoading && !error && jobs.length > 0 && (
          <>
            <div className="space-y-4">
              {jobs.map((job) => (
                <JobCard
                  key={job.id}
                  job={job}
                  onView={() => setSelectedJob(job)}
                  onQuickApply={() => handleApply(job.id)}
                  isApplying={applyingJobId === job.id}
                />
              ))}
            </div>

            {/* Pagination */}
            {pagination && pagination.totalPages > 1 && (
              <div className="mt-8 flex items-center justify-center gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={page === 1}
                  onClick={() => setPage(page - 1)}
                >
                  Previous
                </Button>
                <span className="px-4 text-sm text-gray-600">
                  Page {page} of {pagination.totalPages}
                </span>
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={page >= pagination.totalPages}
                  onClick={() => setPage(page + 1)}
                >
                  Next
                </Button>
              </div>
            )}
          </>
        )}
      </main>

      {/* Job Detail Modal */}
      {selectedJob && (
        <JobDetailModal
          job={selectedJob}
          onClose={() => setSelectedJob(null)}
          onApply={() => handleApply(selectedJob.id)}
          isApplying={applyingJobId === selectedJob.id}
        />
      )}
    </div>
  );
}
