"use client";

import * as React from "react";
import Link from "next/link";
import {
  Search,
  X,
  SlidersHorizontal,
  AlertCircle,
  CheckCircle2,
  Loader2,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { type JobsPageData, type JobListing, applyToJob, getJobsData, type JobFilters, saveJob, unsaveJob } from "./actions";
import { REGION_GROUPS, isLandBasedJob } from "@/lib/utils/job-helpers";
import { getDepartment, YACHT_DEPARTMENTS, HOUSEHOLD_DEPARTMENTS } from "@/lib/vincere/constants";
import { JobCard, JobDetailModal } from "@/components/jobs";

// Main Component
export function JobsClient({ data: initialData }: { data: JobsPageData }) {
  const [jobs, setJobs] = React.useState(initialData.jobs);
  const [appliedJobIds, setAppliedJobIds] = React.useState<string[]>(initialData.appliedJobIds);
  const [savedJobIds, setSavedJobIds] = React.useState<string[]>(initialData.savedJobIds);

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
  const [minSalaryFilter, setMinSalaryFilter] = React.useState("");
  const [maxSalaryFilter, setMaxSalaryFilter] = React.useState("");
  const [jobTypeFilter, setJobTypeFilter] = React.useState<"all" | "yacht" | "land-based">("all");
  const [departmentFilter, setDepartmentFilter] = React.useState("");

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
      if (minSalaryFilter) filters.minSalary = parseInt(minSalaryFilter, 10);
      if (maxSalaryFilter) filters.maxSalary = parseInt(maxSalaryFilter, 10);
      // jobType filtering is done client-side after fetch

      fetchJobs(filters);
    }, 300);

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchQuery, positionFilter, regionFilter, contractFilter, minSalaryFilter, maxSalaryFilter, fetchJobs]);

  // Get available departments based on selected job type
  const availableDepartments = React.useMemo(() => {
    if (jobTypeFilter === "yacht") {
      return Object.entries(YACHT_DEPARTMENTS).map(([key, label]) => ({ key, label }));
    }
    if (jobTypeFilter === "land-based") {
      return Object.entries(HOUSEHOLD_DEPARTMENTS).map(([key, label]) => ({ key, label }));
    }
    // All jobs - combine both
    const combinedDepts = new Map<string, { key: string; label: string }>();
    Object.entries(YACHT_DEPARTMENTS).forEach(([key, label]) => {
      combinedDepts.set(label, { key, label });
    });
    Object.entries(HOUSEHOLD_DEPARTMENTS).forEach(([key, label]) => {
      if (key.startsWith("villa_")) {
        combinedDepts.set(`Household - ${label}`, { key, label: `Household - ${label}` });
      } else if (!combinedDepts.has(label)) {
        combinedDepts.set(label, { key, label });
      }
    });
    return Array.from(combinedDepts.values()).sort((a, b) => a.label.localeCompare(b.label));
  }, [jobTypeFilter]);

  // Clear department if it's no longer valid when job type changes
  React.useEffect(() => {
    if (departmentFilter) {
      const isValidDepartment = availableDepartments.some(d => d.key === departmentFilter);
      if (!isValidDepartment) {
        setDepartmentFilter("");
      }
    }
  }, [jobTypeFilter, departmentFilter, availableDepartments]);

  // Client-side filter for job type and department
  const filteredJobs = React.useMemo(() => {
    let result = jobs;

    // Filter by job type
    if (jobTypeFilter !== "all") {
      result = result.filter(job => {
        const isLandBased = isLandBasedJob(job.title);
        if (jobTypeFilter === "land-based") return isLandBased;
        if (jobTypeFilter === "yacht") return !isLandBased;
        return true;
      });
    }

    // Filter by department
    if (departmentFilter) {
      result = result.filter(job => {
        const isLandBased = isLandBasedJob(job.title);
        const jobDepartment = getDepartment(job.title, isLandBased);
        return jobDepartment === departmentFilter;
      });
    }

    return result;
  }, [jobs, jobTypeFilter, departmentFilter]);

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
    setMinSalaryFilter("");
    setMaxSalaryFilter("");
    setJobTypeFilter("all");
    setDepartmentFilter("");
  };

  const hasActiveFilters = positionFilter || regionFilter || contractFilter || searchQuery || minSalaryFilter || maxSalaryFilter || jobTypeFilter !== "all" || departmentFilter;

  // Get unique values for filter dropdowns from current jobs
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
      <header className="bg-gray-50">
        <div className="mx-auto max-w-6xl px-6 py-6">
          <div className="border-b border-gray-200 pb-4">
            <div className="mb-6">
              <h1 className="flex items-center gap-3 font-serif text-3xl font-semibold text-navy-800">
                <Search className="size-7 text-gold-500" />
                Browse Jobs
              </h1>
              <p className="mt-2 text-gray-600">
                {initialData.candidateSoughtPositions.length > 0 ? (
                  <>
                    Matching jobs for{" "}
                    <Link
                      href="/crew/preferences"
                      className="font-medium text-gold-600 underline decoration-gold-300 underline-offset-2 transition-colors hover:text-gold-700 hover:decoration-gold-500"
                    >
                      {initialData.candidateSoughtPositions.slice(0, 3).join(", ")}
                      {initialData.candidateSoughtPositions.length > 3 && (
                        <span className="text-gray-500"> +{initialData.candidateSoughtPositions.length - 3} more</span>
                      )}
                    </Link>
                  </>
                ) : initialData.candidatePosition ? (
                  <>
                    Jobs matched for{" "}
                    <Link
                      href="/crew/preferences"
                      className="font-medium text-gold-600 underline decoration-gold-300 underline-offset-2 transition-colors hover:text-gold-700 hover:decoration-gold-500"
                    >
                      {initialData.candidatePosition}
                    </Link>
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
                    {Object.entries(REGION_GROUPS).map(([key, { label }]) => (
                      <option key={key} value={key}>
                        {label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Job Type */}
                <div>
                  <label className="mb-1 block text-xs text-gray-500">
                    Job Type
                  </label>
                  <select
                    value={jobTypeFilter}
                    onChange={(e) => setJobTypeFilter(e.target.value as "all" | "yacht" | "land-based")}
                    className="h-9 rounded-lg border border-gray-300 bg-white px-3 text-sm focus:border-gold-500 focus:outline-none focus:ring-1 focus:ring-gold-500"
                  >
                    <option value="all">All Jobs</option>
                    <option value="yacht">Yacht-based</option>
                    <option value="land-based">Land-based</option>
                  </select>
                </div>

                {/* Department */}
                <div>
                  <label className="mb-1 block text-xs text-gray-500">
                    Department
                  </label>
                  <select
                    value={departmentFilter}
                    onChange={(e) => setDepartmentFilter(e.target.value)}
                    className="h-9 rounded-lg border border-gray-300 bg-white px-3 text-sm focus:border-gold-500 focus:outline-none focus:ring-1 focus:ring-gold-500"
                  >
                    <option value="">All Departments</option>
                    {availableDepartments.map((dept) => (
                      <option key={dept.key} value={dept.key}>
                        {dept.label}
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

                {/* Salary Range */}
                <div className="flex items-end gap-2">
                  <div>
                    <label className="mb-1 block text-xs text-gray-500">
                      Min Salary
                    </label>
                    <input
                      type="number"
                      placeholder="e.g. 3000"
                      value={minSalaryFilter}
                      onChange={(e) => setMinSalaryFilter(e.target.value)}
                      className="h-9 w-28 rounded-lg border border-gray-300 bg-white px-3 text-sm focus:border-gold-500 focus:outline-none focus:ring-1 focus:ring-gold-500"
                    />
                  </div>
                  <span className="mb-2 text-gray-400">–</span>
                  <div>
                    <label className="mb-1 block text-xs text-gray-500">
                      Max Salary
                    </label>
                    <input
                      type="number"
                      placeholder="e.g. 8000"
                      value={maxSalaryFilter}
                      onChange={(e) => setMaxSalaryFilter(e.target.value)}
                      className="h-9 w-28 rounded-lg border border-gray-300 bg-white px-3 text-sm focus:border-gold-500 focus:outline-none focus:ring-1 focus:ring-gold-500"
                    />
                  </div>
                </div>
                </div>
              )}
            </div>
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
                <span className="font-semibold text-navy-900">{filteredJobs.length}</span>{" "}
                jobs found
                {jobTypeFilter !== "all" && (
                  <span className="text-gray-400"> ({jobTypeFilter})</span>
                )}
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
        {!isLoading && filteredJobs.length === 0 && (
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
        {!isLoading && filteredJobs.length > 0 && (
          <div className="space-y-4">
            {filteredJobs.map((job) => (
              <JobCard
                key={job.id}
                job={job}
                hasApplied={job.hasApplied}
                isSaved={job.isSaved}
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
          hasApplied={selectedJob.hasApplied}
          isSaved={selectedJob.isSaved}
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
