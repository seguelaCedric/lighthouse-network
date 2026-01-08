"use client";

import * as React from "react";
import {
  Plus,
  ChevronDown,
  ChevronUp,
  ChevronRight,
  ChevronLeft,
  Eye,
  Archive,
  Flag,
  Clock,
  Users,
  DollarSign,
  X,
  Search,
  MoreVertical,
  Calendar,
  Briefcase,
  Check,
  Download,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import Link from "next/link";

// Types
type StageId = "draft" | "open" | "shortlist" | "interview" | "offer" | "filled";
type SortField = "position" | "client" | "status" | "salary" | "startDate" | "candidates" | "days" | "created";
type SortDirection = "asc" | "desc";

interface Job {
  id: string;
  position: string;
  client: string;
  clientLogo?: string;
  salaryMin: number;
  salaryMax: number;
  currency: string;
  startDate: Date;
  candidatesCount: number;
  daysInStage: number;
  priority: "normal" | "urgent";
  assignee: {
    name: string;
    avatar?: string;
  };
  stage: StageId;
  createdAt?: string;
  externalSource?: string | null;
}

interface Stage {
  id: StageId;
  label: string;
  color: string;
  bgColor: string;
  borderColor: string;
}

// Stage configuration
const stages: Stage[] = [
  {
    id: "draft",
    label: "Draft",
    color: "text-gray-700",
    bgColor: "bg-gray-100",
    borderColor: "border-gray-300",
  },
  {
    id: "open",
    label: "Open",
    color: "text-blue-700",
    bgColor: "bg-blue-100",
    borderColor: "border-blue-300",
  },
  {
    id: "shortlist",
    label: "Shortlist",
    color: "text-purple-700",
    bgColor: "bg-purple-100",
    borderColor: "border-purple-300",
  },
  {
    id: "interview",
    label: "Interview",
    color: "text-warning-700",
    bgColor: "bg-warning-100",
    borderColor: "border-amber-300",
  },
  {
    id: "offer",
    label: "Offer",
    color: "text-orange-700",
    bgColor: "bg-orange-100",
    borderColor: "border-orange-300",
  },
  {
    id: "filled",
    label: "Filled",
    color: "text-success-700",
    bgColor: "bg-success-100",
    borderColor: "border-green-300",
  },
];

// Helper functions
function formatDate(date: Date): string {
  return date.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays}d ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`;
  if (diffDays < 365) return `${Math.floor(diffDays / 30)}mo ago`;
  return `${Math.floor(diffDays / 365)}y ago`;
}

function formatSalary(min: number, max: number, currency: string): string {
  if (min === 0 && max === 0) return "—";
  const formatter = new Intl.NumberFormat("en-US", {
    notation: "compact",
    maximumFractionDigits: 1,
  });
  if (min === max) {
    return `${currency} ${formatter.format(min)}`;
  }
  return `${currency} ${formatter.format(min)}-${formatter.format(max)}`;
}

// Map database status to pipeline stage
function mapStatusToStage(status: string): StageId {
  switch (status) {
    case "draft":
      return "draft";
    case "open":
      return "open";
    case "shortlisting":
      return "shortlist";
    case "interviewing":
      return "interview";
    case "offer":
      return "offer";
    case "filled":
      return "filled";
    case "cancelled":
    case "on_hold":
      return "draft";
    default:
      return "draft";
  }
}

// Map stage back to database status
function stageToStatus(stage: StageId): string {
  switch (stage) {
    case "draft":
      return "draft";
    case "open":
      return "open";
    case "shortlist":
      return "shortlisting";
    case "interview":
      return "interviewing";
    case "offer":
      return "offer";
    case "filled":
      return "filled";
    default:
      return "draft";
  }
}

// Calculate days in current stage
function calculateDaysInStage(updatedAt: string, createdAt: string): number {
  const updated = new Date(updatedAt);
  const now = new Date();
  const diffTime = Math.abs(now.getTime() - updated.getTime());
  return Math.floor(diffTime / (1000 * 60 * 60 * 24));
}

// Inline Status Dropdown Component
function StatusDropdown({
  job,
  onUpdate,
}: {
  job: Job;
  onUpdate: (jobId: string, newStage: StageId) => void;
}) {
  const [isOpen, setIsOpen] = React.useState(false);
  const stage = stages.find((s) => s.id === job.stage)!;
  const dropdownRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isOpen]);

  const handleSelect = (newStage: StageId) => {
    onUpdate(job.id, newStage);
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs font-medium transition-colors hover:opacity-80",
          stage.bgColor,
          stage.color,
          stage.borderColor
        )}
      >
        {stage.label}
        <ChevronDown className="size-3" />
      </button>
      {isOpen && (
        <div className="absolute left-0 top-full z-50 mt-1 w-40 rounded-lg border border-gray-200 bg-white shadow-lg">
          {stages.map((s) => (
            <button
              key={s.id}
              onClick={() => handleSelect(s.id)}
              className={cn(
                "w-full px-3 py-2 text-left text-sm transition-colors first:rounded-t-lg last:rounded-b-lg",
                s.id === job.stage
                  ? "bg-gray-50 font-medium text-gray-900"
                  : "text-gray-700 hover:bg-gray-50"
              )}
            >
              {s.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// Sortable Column Header Component
function SortableHeader({
  field,
  currentSort,
  onSort,
  children,
  className,
}: {
  field: SortField;
  currentSort: { field: SortField; direction: SortDirection } | null;
  onSort: (field: SortField) => void;
  children: React.ReactNode;
  className?: string;
}) {
  const isActive = currentSort?.field === field;
  const direction = isActive ? currentSort.direction : null;

  return (
    <button
      onClick={() => onSort(field)}
      className={cn(
        "flex items-center gap-1.5 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 transition-colors hover:text-gray-700",
        className
      )}
    >
      {children}
      <div className="flex flex-col">
        <ChevronUp
          className={cn(
            "size-3 transition-opacity",
            direction === "asc" ? "opacity-100 text-gold-600" : "opacity-30"
          )}
        />
        <ChevronDown
          className={cn(
            "size-3 -mt-1.5 transition-opacity",
            direction === "desc" ? "opacity-100 text-gold-600" : "opacity-30"
          )}
        />
      </div>
    </button>
  );
}

// Main Component
export default function JobPipelinePage() {
  const [jobs, setJobs] = React.useState<Job[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [selectedJobs, setSelectedJobs] = React.useState<Set<string>>(new Set());

  // Filters
  const [searchQuery, setSearchQuery] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState<StageId | "">("");
  const [sourceFilter, setSourceFilter] = React.useState<"all" | "vincere" | "manual">("all");
  const [urgencyFilter, setUrgencyFilter] = React.useState<"all" | "urgent">("all");

  // Sorting
  const [sort, setSort] = React.useState<{ field: SortField; direction: SortDirection } | null>({
    field: "created",
    direction: "desc",
  });

  // Pagination
  const [currentPage, setCurrentPage] = React.useState(1);
  const [jobsPerPage] = React.useState(50);

  // Fetch jobs from API
  React.useEffect(() => {
    async function fetchJobs() {
      try {
        setLoading(true);
        const allJobs: any[] = [];
        let page = 1;
        const limit = 100;
        let hasMore = true;

        while (hasMore) {
          const response = await fetch(
            `/api/jobs?limit=${limit}&page=${page}&sortBy=created_at&sortOrder=desc`,
            {
              credentials: "include",
            }
          );

          if (!response.ok) {
            const errorText = await response.text();
            console.error("API error:", response.status, errorText);
            if (response.status === 401) {
              throw new Error("Please log in to view jobs");
            }
            throw new Error(`Failed to fetch jobs: ${response.status} ${errorText}`);
          }

          const result = await response.json();
          const jobs = result.data || result || [];

          if (!Array.isArray(jobs)) {
            console.error("API returned non-array data:", jobs);
            hasMore = false;
            break;
          }

          if (jobs.length > 0) {
            allJobs.push(...jobs);
            hasMore = jobs.length === limit && page < 30;
            page++;
          } else {
            hasMore = false;
          }
        }

        const mappedJobs: Job[] = allJobs.map((job: any) => {
          const updatedAt = job.updated_at || job.created_at || new Date().toISOString();
          const createdAt = job.created_at || new Date().toISOString();
          const daysInStage = calculateDaysInStage(updatedAt, createdAt);

          return {
            id: job.id,
            position: job.title || "Untitled Position",
            client: job.vessel_name || job.client?.name || "Unknown Client",
            clientLogo: undefined,
            salaryMin: job.salary_min || 0,
            salaryMax: job.salary_max || 0,
            currency: job.salary_currency || "EUR",
            startDate: job.start_date ? new Date(job.start_date) : new Date(),
            candidatesCount: job.submissions_count || job.applications_count || 0,
            daysInStage,
            priority: job.is_urgent ? "urgent" : "normal",
            assignee: {
              name: "Unassigned",
            },
            stage: mapStatusToStage(job.status || "draft"),
            createdAt: job.created_at,
            externalSource: job.external_source || null,
          };
        });

        // Initial sort: Vincere first, then by created date
        mappedJobs.sort((a, b) => {
          const aCreated = new Date(a.createdAt || 0).getTime();
          const bCreated = new Date(b.createdAt || 0).getTime();
          const aIsVincere = a.externalSource === "vincere";
          const bIsVincere = b.externalSource === "vincere";

          if (aIsVincere && !bIsVincere) return -1;
          if (!aIsVincere && bIsVincere) return 1;
          return bCreated - aCreated;
        });

        setJobs(mappedJobs);
      } catch (error) {
        console.error("Error fetching jobs:", error);
        setJobs([]);
      } finally {
        setLoading(false);
      }
    }

    fetchJobs();
  }, []);

  // Filtered and sorted jobs
  const filteredJobs = React.useMemo(() => {
    let result = jobs.filter((job) => {
      if (statusFilter && job.stage !== statusFilter) return false;
      if (sourceFilter !== "all") {
        const jobSource = job.externalSource;
        if (sourceFilter === "vincere" && jobSource !== "vincere") return false;
        if (sourceFilter === "manual" && jobSource === "vincere") return false;
      }
      if (urgencyFilter === "urgent" && job.priority !== "urgent") return false;
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        return (
          job.position.toLowerCase().includes(query) ||
          job.client.toLowerCase().includes(query)
        );
      }
      return true;
    });

    // Apply sorting
    if (sort) {
      result = [...result].sort((a, b) => {
        let aVal: any;
        let bVal: any;

        switch (sort.field) {
          case "position":
            aVal = a.position.toLowerCase();
            bVal = b.position.toLowerCase();
            break;
          case "client":
            aVal = a.client.toLowerCase();
            bVal = b.client.toLowerCase();
            break;
          case "status":
            aVal = a.stage;
            bVal = b.stage;
            break;
          case "salary":
            aVal = a.salaryMax || a.salaryMin || 0;
            bVal = b.salaryMax || b.salaryMin || 0;
            break;
          case "startDate":
            aVal = a.startDate.getTime();
            bVal = b.startDate.getTime();
            break;
          case "candidates":
            aVal = a.candidatesCount;
            bVal = b.candidatesCount;
            break;
          case "days":
            aVal = a.daysInStage;
            bVal = b.daysInStage;
            break;
          case "created":
            aVal = new Date(a.createdAt || 0).getTime();
            bVal = new Date(b.createdAt || 0).getTime();
            // Vincere priority for created sort
            const aIsVincere = a.externalSource === "vincere";
            const bIsVincere = b.externalSource === "vincere";
            if (aIsVincere && !bIsVincere) return -1;
            if (!aIsVincere && bIsVincere) return 1;
            break;
          default:
            return 0;
        }

        if (aVal < bVal) return sort.direction === "asc" ? -1 : 1;
        if (aVal > bVal) return sort.direction === "asc" ? 1 : -1;
        return 0;
      });
    }

    return result;
  }, [jobs, statusFilter, sourceFilter, urgencyFilter, searchQuery, sort]);

  // Pagination
  const totalPages = Math.ceil(filteredJobs.length / jobsPerPage);
  const startIndex = (currentPage - 1) * jobsPerPage;
  const endIndex = startIndex + jobsPerPage;
  const paginatedJobs = filteredJobs.slice(startIndex, endIndex);

  React.useEffect(() => {
    setCurrentPage(1);
    setSelectedJobs(new Set());
  }, [statusFilter, sourceFilter, urgencyFilter, searchQuery]);

  const handleSort = (field: SortField) => {
    setSort((current) => {
      if (current?.field === field) {
        return {
          field,
          direction: current.direction === "asc" ? "desc" : "asc",
        };
      }
      return { field, direction: "desc" };
    });
  };

  const handleStatusUpdate = async (jobId: string, newStage: StageId) => {
    // Optimistic update
    setJobs((prev) =>
      prev.map((job) =>
        job.id === jobId ? { ...job, stage: newStage, daysInStage: 0 } : job
      )
    );

    // Update in database
    try {
      const response = await fetch(`/api/jobs/${jobId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: stageToStatus(newStage) }),
      });

      if (!response.ok) {
        throw new Error("Failed to update job status");
      }
    } catch (error) {
      console.error("Error updating job status:", error);
      // Revert on error - refetch jobs
      window.location.reload();
    }
  };

  const handleSelectAll = () => {
    if (selectedJobs.size === paginatedJobs.length) {
      setSelectedJobs(new Set());
    } else {
      setSelectedJobs(new Set(paginatedJobs.map((j) => j.id)));
    }
  };

  const handleSelectJob = (jobId: string) => {
    setSelectedJobs((prev) => {
      const next = new Set(prev);
      if (next.has(jobId)) {
        next.delete(jobId);
      } else {
        next.add(jobId);
      }
      return next;
    });
  };

  const clearFilters = () => {
    setSearchQuery("");
    setStatusFilter("");
    setSourceFilter("all");
    setUrgencyFilter("all");
  };

  const activeFilterCount =
    (statusFilter ? 1 : 0) +
    (sourceFilter !== "all" ? 1 : 0) +
    (urgencyFilter !== "all" ? 1 : 0) +
    (searchQuery ? 1 : 0);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="mb-4 inline-block h-12 w-12 animate-spin rounded-full border-4 border-solid border-gold-500 border-r-transparent"></div>
          <p className="text-lg font-medium text-gray-600">Loading jobs...</p>
        </div>
      </div>
    );
  }

  if (jobs.length === 0) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-center max-w-md">
          <div className="mb-6 inline-flex size-20 items-center justify-center rounded-full bg-gray-100">
            <Briefcase className="size-10 text-gray-400" />
          </div>
          <h2 className="mb-2 text-2xl font-serif font-semibold text-navy-800">No Jobs Found</h2>
          <p className="mb-6 text-gray-600">
            There are no jobs in your pipeline. Check the browser console for details.
          </p>
          <Button variant="primary" leftIcon={<Plus className="size-4" />}>
            Create Your First Job
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="sticky top-0 z-10 border-b border-gray-200 bg-white shadow-sm">
        <div className="mx-auto max-w-[1800px] px-6 py-4">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-serif font-semibold text-navy-800">Job Pipeline</h1>
              <p className="mt-0.5 text-sm text-gray-500">Manage and track all your job postings</p>
            </div>
            <Button variant="primary" leftIcon={<Plus className="size-4" />}>
              Create Job
            </Button>
          </div>

          {/* Always-Visible Filters */}
          <div className="space-y-3">
            {/* Search Bar */}
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search jobs by position or client..."
                className="h-10 w-full rounded-lg border border-gray-300 bg-white pl-10 pr-4 text-sm placeholder:text-gray-400 focus:border-gold-500 focus:outline-none focus:ring-2 focus:ring-gold-500/20"
              />
            </div>

            {/* Quick Filter Chips */}
            <div className="flex flex-wrap items-center gap-2">
              {/* Status Filter */}
              <div className="flex items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-2">
                <span className="text-xs font-medium text-gray-600">Status:</span>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as StageId | "")}
                  className="h-8 border-0 bg-transparent py-0 pl-1 pr-6 text-xs font-medium text-gray-700 focus:ring-0"
                >
                  <option value="">All</option>
                  {stages.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Source Filter */}
              <div className="flex items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-2">
                <span className="text-xs font-medium text-gray-600">Source:</span>
                <select
                  value={sourceFilter}
                  onChange={(e) => setSourceFilter(e.target.value as "all" | "vincere" | "manual")}
                  className="h-8 border-0 bg-transparent py-0 pl-1 pr-6 text-xs font-medium text-gray-700 focus:ring-0"
                >
                  <option value="all">All</option>
                  <option value="vincere">Vincere</option>
                  <option value="manual">Manual</option>
                </select>
              </div>

              {/* Urgency Filter */}
              <div className="flex items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-2">
                <span className="text-xs font-medium text-gray-600">Urgency:</span>
                <select
                  value={urgencyFilter}
                  onChange={(e) => setUrgencyFilter(e.target.value as "all" | "urgent")}
                  className="h-8 border-0 bg-transparent py-0 pl-1 pr-6 text-xs font-medium text-gray-700 focus:ring-0"
                >
                  <option value="all">All</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>

              {activeFilterCount > 0 && (
                <button
                  onClick={clearFilters}
                  className="flex items-center gap-1 rounded-lg border border-gray-300 bg-white px-2.5 py-1.5 text-xs font-medium text-gray-600 transition-colors hover:bg-gray-50"
                >
                  <X className="size-3" />
                  Clear ({activeFilterCount})
                </button>
              )}

              <div className="ml-auto flex items-center gap-4 text-xs text-gray-600">
                <span>
                  <span className="font-semibold text-navy-900">{filteredJobs.length}</span> jobs
                </span>
                <span>
                  <span className="font-semibold text-error-600">
                    {filteredJobs.filter((j) => j.priority === "urgent").length}
                  </span>{" "}
                  urgent
                </span>
                <span>
                  <span className="font-semibold text-warning-600">
                    {filteredJobs.filter((j) => j.daysInStage > 7).length}
                  </span>{" "}
                  needs attention
                </span>
              </div>
            </div>
          </div>

          {/* Bulk Actions Bar */}
          {selectedJobs.size > 0 && (
            <div className="mt-3 flex items-center justify-between rounded-lg border border-gold-300 bg-gold-50 px-4 py-2">
              <span className="text-sm font-medium text-gold-900">
                {selectedJobs.size} job{selectedJobs.size !== 1 ? "s" : ""} selected
              </span>
              <div className="flex items-center gap-2">
                <select className="h-8 rounded border border-gold-300 bg-white px-2 text-xs">
                  <option>Update status...</option>
                  {stages.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.label}
                    </option>
                  ))}
                </select>
                <button className="flex h-8 items-center gap-1.5 rounded border border-gray-300 bg-white px-3 text-xs font-medium text-gray-700 transition-colors hover:bg-gray-50">
                  <Archive className="size-3" />
                  Archive
                </button>
                <button className="flex h-8 items-center gap-1.5 rounded border border-gray-300 bg-white px-3 text-xs font-medium text-gray-700 transition-colors hover:bg-gray-50">
                  <Download className="size-3" />
                  Export
                </button>
                <button
                  onClick={() => setSelectedJobs(new Set())}
                  className="flex h-8 items-center gap-1.5 rounded border border-gray-300 bg-white px-3 text-xs font-medium text-gray-700 transition-colors hover:bg-gray-50"
                >
                  <X className="size-3" />
                  Clear
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Table */}
      <main className="mx-auto max-w-[1800px] px-6 py-6">
        {paginatedJobs.length === 0 ? (
          <div className="rounded-lg border border-gray-200 bg-white p-12 text-center">
            <p className="text-gray-600">No jobs match your filters. Try adjusting your search criteria.</p>
            {activeFilterCount > 0 && (
              <button
                onClick={clearFilters}
                className="mt-4 text-sm font-medium text-gold-600 hover:text-gold-700"
              >
                Clear all filters
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
            {/* Table Header */}
            <div className="sticky top-0 z-10 flex items-center gap-4 border-b border-gray-200 bg-gray-50 px-4 py-3">
              <div className="w-10 flex-shrink-0">
                <input
                  type="checkbox"
                  checked={selectedJobs.size === paginatedJobs.length && paginatedJobs.length > 0}
                  onChange={handleSelectAll}
                  className="size-4 rounded border-gray-300 text-gold-600 focus:ring-gold-500"
                />
              </div>
              <SortableHeader
                field="position"
                currentSort={sort}
                onSort={handleSort}
                className="flex-1 min-w-[200px] flex-shrink-0"
              >
                Position
              </SortableHeader>
              <SortableHeader
                field="client"
                currentSort={sort}
                onSort={handleSort}
                className="w-[180px] flex-shrink-0"
              >
                Client/Vessel
              </SortableHeader>
              <div className="w-[140px] flex-shrink-0 text-xs font-semibold uppercase tracking-wider text-gray-500">
                Status
              </div>
              <SortableHeader
                field="salary"
                currentSort={sort}
                onSort={handleSort}
                className="w-[120px] flex-shrink-0"
              >
                Salary
              </SortableHeader>
              <SortableHeader
                field="startDate"
                currentSort={sort}
                onSort={handleSort}
                className="w-[110px] flex-shrink-0"
              >
                Start Date
              </SortableHeader>
              <SortableHeader
                field="candidates"
                currentSort={sort}
                onSort={handleSort}
                className="w-[100px] flex-shrink-0"
              >
                Candidates
              </SortableHeader>
              <SortableHeader
                field="days"
                currentSort={sort}
                onSort={handleSort}
                className="w-[80px] flex-shrink-0"
              >
                Days
              </SortableHeader>
              <div className="w-[100px] flex-shrink-0 text-xs font-semibold uppercase tracking-wider text-gray-500">
                Source
              </div>
              <SortableHeader
                field="created"
                currentSort={sort}
                onSort={handleSort}
                className="w-[120px] flex-shrink-0"
              >
                Created
              </SortableHeader>
              <div className="w-[60px] flex-shrink-0"></div>
            </div>

            {/* Table Body */}
            <div className="divide-y divide-gray-100">
              {paginatedJobs.map((job, index) => {
                const stage = stages.find((s) => s.id === job.stage)!;
                const isSelected = selectedJobs.has(job.id);
                const isUrgent = job.priority === "urgent";
                const isStale = job.daysInStage > 7;

                return (
                  <div
                    key={job.id}
                    className={cn(
                      "group flex items-center gap-4 px-4 py-3 transition-colors",
                      index % 2 === 0 ? "bg-white" : "bg-gray-50/50",
                      isUrgent && "border-l-4 border-l-error-500",
                      isStale && !isUrgent && "border-l-4 border-l-warning-500",
                      !isUrgent && !isStale && "border-l-4 border-l-transparent",
                      "hover:bg-gold-50/50 hover:border-l-gold-500"
                    )}
                  >
                    {/* Checkbox */}
                    <div className="w-10 flex-shrink-0">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => handleSelectJob(job.id)}
                        className="size-4 rounded border-gray-300 text-gold-600 focus:ring-gold-500"
                      />
                    </div>

                    {/* Position */}
                    <div className="flex-1 min-w-[200px] flex-shrink-0">
                      <Link
                        href={`/jobs/${job.id}`}
                        className="font-medium text-navy-900 hover:text-gold-600 transition-colors"
                      >
                        {job.position}
                      </Link>
                    </div>

                    {/* Client/Vessel */}
                    <div className="w-[180px] flex-shrink-0 truncate text-sm text-gray-700">{job.client}</div>

                    {/* Status */}
                    <div className="w-[140px] flex-shrink-0">
                      <StatusDropdown job={job} onUpdate={handleStatusUpdate} />
                    </div>

                    {/* Salary */}
                    <div className="w-[120px] flex-shrink-0 text-sm text-gray-700">
                      {formatSalary(job.salaryMin, job.salaryMax, job.currency)}
                    </div>

                    {/* Start Date */}
                    <div className="w-[110px] flex-shrink-0 text-sm text-gray-700">{formatDate(job.startDate)}</div>

                    {/* Candidates */}
                    <div className="w-[100px] flex-shrink-0">
                      <Link
                        href={`/jobs/${job.id}/submissions`}
                        className="flex items-center gap-1.5 text-sm font-medium text-navy-700 hover:text-gold-600 transition-colors"
                      >
                        <Users className="size-4" />
                        {job.candidatesCount}
                      </Link>
                    </div>

                    {/* Days */}
                    <div
                      className={cn(
                        "w-[80px] flex-shrink-0 text-sm font-medium",
                        job.daysInStage > 14
                          ? "text-error-600"
                          : job.daysInStage >= 7
                          ? "text-warning-600"
                          : "text-gray-600"
                      )}
                    >
                      {job.daysInStage}d
                    </div>

                    {/* Source */}
                    <div className="w-[100px] flex-shrink-0">
                      {job.externalSource === "vincere" ? (
                        <span className="inline-flex items-center rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700">
                          Vincere
                        </span>
                      ) : (
                        <span className="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-700">
                          Manual
                        </span>
                      )}
                    </div>

                    {/* Created */}
                    <div className="w-[120px] flex-shrink-0 text-sm text-gray-600">
                      {job.createdAt ? formatRelativeTime(job.createdAt) : "—"}
                    </div>

                    {/* Actions */}
                    <div className="w-[60px] flex-shrink-0">
                      <Link
                        href={`/jobs/${job.id}`}
                        className="flex size-8 items-center justify-center rounded text-gray-400 opacity-0 transition-opacity hover:bg-gray-100 hover:text-gray-600 group-hover:opacity-100"
                      >
                        <Eye className="size-4" />
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-6 flex items-center justify-between rounded-lg border border-gray-200 bg-white px-6 py-4">
            <div className="text-sm text-gray-600">
              Showing <span className="font-semibold text-navy-900">{startIndex + 1}</span> to{" "}
              <span className="font-semibold text-navy-900">{Math.min(endIndex, filteredJobs.length)}</span> of{" "}
              <span className="font-semibold text-navy-900">{filteredJobs.length}</span> jobs
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className={cn(
                  "flex items-center gap-1.5 rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-medium transition-colors",
                  currentPage === 1
                    ? "cursor-not-allowed bg-gray-50 text-gray-400"
                    : "bg-white text-gray-700 hover:bg-gray-50"
                )}
              >
                <ChevronLeft className="size-4" />
                Previous
              </button>
              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum: number;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (currentPage <= 3) {
                    pageNum = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = currentPage - 2 + i;
                  }
                  return (
                    <button
                      key={pageNum}
                      onClick={() => setCurrentPage(pageNum)}
                      className={cn(
                        "min-w-[2.5rem] rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors",
                        currentPage === pageNum
                          ? "border-gold-500 bg-gold-500 text-white"
                          : "border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
                      )}
                    >
                      {pageNum}
                    </button>
                  );
                })}
              </div>
              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className={cn(
                  "flex items-center gap-1.5 rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-medium transition-colors",
                  currentPage === totalPages
                    ? "cursor-not-allowed bg-gray-50 text-gray-400"
                    : "bg-white text-gray-700 hover:bg-gray-50"
                )}
              >
                Next
                <ChevronRight className="size-4" />
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
