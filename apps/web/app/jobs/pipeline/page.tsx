"use client";

import * as React from "react";
import {
  LayoutGrid,
  List,
  Calendar,
  Plus,
  ChevronDown,
  ChevronRight,
  Eye,
  UserPlus,
  Archive,
  Flag,
  Clock,
  Users,
  DollarSign,
  GripVertical,
  X,
  Search,
  Filter,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// Types
type StageId = "draft" | "open" | "shortlist" | "interview" | "offer" | "filled";

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

// Mock Data
const mockJobs: Job[] = [
  {
    id: "1",
    position: "Chief Stewardess",
    client: "M/Y Eclipse",
    salaryMin: 6500,
    salaryMax: 8000,
    currency: "EUR",
    startDate: new Date("2025-01-15"),
    candidatesCount: 12,
    daysInStage: 3,
    priority: "urgent",
    assignee: { name: "Emma Wilson" },
    stage: "open",
  },
  {
    id: "2",
    position: "Captain",
    client: "M/Y Northern Star",
    salaryMin: 15000,
    salaryMax: 18000,
    currency: "EUR",
    startDate: new Date("2025-02-01"),
    candidatesCount: 5,
    daysInStage: 8,
    priority: "normal",
    assignee: { name: "Tom Harris" },
    stage: "shortlist",
  },
  {
    id: "3",
    position: "Chef",
    client: "M/Y Serenity",
    salaryMin: 7000,
    salaryMax: 9000,
    currency: "EUR",
    startDate: new Date("2025-01-20"),
    candidatesCount: 8,
    daysInStage: 15,
    priority: "urgent",
    assignee: { name: "Emma Wilson" },
    stage: "interview",
  },
  {
    id: "4",
    position: "2nd Engineer",
    client: "M/Y Azure Dream",
    salaryMin: 5500,
    salaryMax: 6500,
    currency: "EUR",
    startDate: new Date("2025-03-01"),
    candidatesCount: 3,
    daysInStage: 2,
    priority: "normal",
    assignee: { name: "Sarah Chen" },
    stage: "draft",
  },
  {
    id: "5",
    position: "Deckhand",
    client: "M/Y Horizon",
    salaryMin: 3000,
    salaryMax: 3500,
    currency: "EUR",
    startDate: new Date("2025-01-10"),
    candidatesCount: 18,
    daysInStage: 5,
    priority: "normal",
    assignee: { name: "Tom Harris" },
    stage: "open",
  },
  {
    id: "6",
    position: "Chief Engineer",
    client: "M/Y Poseidon",
    salaryMin: 12000,
    salaryMax: 14000,
    currency: "EUR",
    startDate: new Date("2025-02-15"),
    candidatesCount: 2,
    daysInStage: 10,
    priority: "normal",
    assignee: { name: "Emma Wilson" },
    stage: "offer",
  },
  {
    id: "7",
    position: "Stewardess",
    client: "M/Y Athena",
    salaryMin: 3500,
    salaryMax: 4000,
    currency: "EUR",
    startDate: new Date("2024-12-01"),
    candidatesCount: 1,
    daysInStage: 0,
    priority: "normal",
    assignee: { name: "Sarah Chen" },
    stage: "filled",
  },
  {
    id: "8",
    position: "Bosun",
    client: "M/Y Eclipse",
    salaryMin: 4500,
    salaryMax: 5500,
    currency: "EUR",
    startDate: new Date("2025-01-15"),
    candidatesCount: 6,
    daysInStage: 4,
    priority: "normal",
    assignee: { name: "Tom Harris" },
    stage: "shortlist",
  },
  {
    id: "9",
    position: "First Officer",
    client: "M/Y Northern Star",
    salaryMin: 8000,
    salaryMax: 10000,
    currency: "EUR",
    startDate: new Date("2025-02-01"),
    candidatesCount: 0,
    daysInStage: 1,
    priority: "normal",
    assignee: { name: "Emma Wilson" },
    stage: "draft",
  },
  {
    id: "10",
    position: "3rd Stewardess",
    client: "M/Y Serenity",
    salaryMin: 3000,
    salaryMax: 3500,
    currency: "EUR",
    startDate: new Date("2025-01-25"),
    candidatesCount: 22,
    daysInStage: 12,
    priority: "normal",
    assignee: { name: "Sarah Chen" },
    stage: "open",
  },
  {
    id: "11",
    position: "2nd Stewardess",
    client: "M/Y Horizon",
    salaryMin: 4000,
    salaryMax: 4500,
    currency: "EUR",
    startDate: new Date("2025-02-10"),
    candidatesCount: 4,
    daysInStage: 6,
    priority: "urgent",
    assignee: { name: "Emma Wilson" },
    stage: "interview",
  },
  {
    id: "12",
    position: "ETO",
    client: "M/Y Poseidon",
    salaryMin: 6000,
    salaryMax: 7000,
    currency: "EUR",
    startDate: new Date("2025-03-01"),
    candidatesCount: 2,
    daysInStage: 18,
    priority: "normal",
    assignee: { name: "Tom Harris" },
    stage: "shortlist",
  },
];

// Helper functions
function formatDate(date: Date): string {
  return date.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
  });
}

function formatSalary(min: number, max: number, currency: string): string {
  const formatter = new Intl.NumberFormat("en-US", {
    notation: "compact",
    maximumFractionDigits: 1,
  });
  return `${currency} ${formatter.format(min)}-${formatter.format(max)}`;
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase();
}

function getDaysColor(days: number): string {
  if (days > 14) return "border-l-error-500";
  if (days >= 7) return "border-l-warning-500";
  return "border-l-transparent";
}

// Job Card Component
function JobCard({
  job,
  isDragging,
  onDragStart,
  onDragEnd,
}: {
  job: Job;
  isDragging: boolean;
  onDragStart: () => void;
  onDragEnd: () => void;
}) {
  const [isHovered, setIsHovered] = React.useState(false);

  return (
    <div
      draggable
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={cn(
        "group relative cursor-grab rounded-lg border border-gray-200 bg-white p-3 shadow-sm transition-all",
        "border-l-4",
        getDaysColor(job.daysInStage),
        isDragging ? "rotate-2 scale-105 shadow-lg opacity-90" : "hover:shadow-md",
        "active:cursor-grabbing"
      )}
    >
      {/* Drag Handle */}
      <div className="absolute -left-0.5 top-1/2 -translate-y-1/2 opacity-0 transition-opacity group-hover:opacity-100">
        <GripVertical className="size-4 text-gray-400" />
      </div>

      {/* Priority Flag */}
      {job.priority === "urgent" && (
        <div className="absolute -right-1 -top-1">
          <div className="flex size-5 items-center justify-center rounded-full bg-error-500 shadow-sm">
            <Flag className="size-3 text-white" fill="currentColor" />
          </div>
        </div>
      )}

      {/* Card Content */}
      <div className="space-y-2">
        {/* Position & Client */}
        <div>
          <h4 className="font-semibold text-navy-900 leading-tight">{job.position}</h4>
          <p className="text-sm text-gray-600">{job.client}</p>
        </div>

        {/* Details Row */}
        <div className="flex items-center gap-3 text-xs text-gray-500">
          <span className="flex items-center gap-1">
            <DollarSign className="size-3" />
            {formatSalary(job.salaryMin, job.salaryMax, job.currency)}
          </span>
          <span className="flex items-center gap-1">
            <Calendar className="size-3" />
            {formatDate(job.startDate)}
          </span>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-1">
          <div className="flex items-center gap-2">
            {/* Candidates Badge */}
            <span
              className={cn(
                "flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium",
                job.candidatesCount > 0
                  ? "bg-navy-100 text-navy-700"
                  : "bg-gray-100 text-gray-500"
              )}
            >
              <Users className="size-3" />
              {job.candidatesCount}
            </span>

            {/* Days in Stage */}
            <span
              className={cn(
                "flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium",
                job.daysInStage > 14
                  ? "bg-error-100 text-error-700"
                  : job.daysInStage >= 7
                  ? "bg-warning-100 text-warning-700"
                  : "bg-gray-100 text-gray-500"
              )}
            >
              <Clock className="size-3" />
              {job.daysInStage}d
            </span>
          </div>

          {/* Assignee Avatar */}
          <div className="flex size-6 items-center justify-center rounded-full bg-gold-100 text-[10px] font-semibold text-gold-700">
            {getInitials(job.assignee.name)}
          </div>
        </div>
      </div>

      {/* Hover Actions */}
      <div
        className={cn(
          "absolute inset-x-0 bottom-0 flex items-center justify-center gap-1 rounded-b-lg bg-gradient-to-t from-white via-white to-transparent pb-2 pt-6 transition-opacity",
          isHovered ? "opacity-100" : "opacity-0 pointer-events-none"
        )}
      >
        <button className="flex items-center gap-1 rounded-md bg-navy-100 px-2 py-1 text-xs font-medium text-navy-700 hover:bg-navy-200">
          <Eye className="size-3" />
          View
        </button>
        <button className="flex items-center gap-1 rounded-md bg-gold-100 px-2 py-1 text-xs font-medium text-gold-700 hover:bg-gold-200">
          <UserPlus className="size-3" />
          Add
        </button>
        <button className="flex items-center gap-1 rounded-md bg-gray-100 px-2 py-1 text-xs font-medium text-gray-600 hover:bg-gray-200">
          <Archive className="size-3" />
        </button>
      </div>
    </div>
  );
}

// Kanban Column Component
function KanbanColumn({
  stage,
  jobs,
  isCollapsed,
  onToggleCollapse,
  dragOverStage,
  onDragOver,
  onDragLeave,
  onDrop,
  draggingJob,
  onDragStart,
  onDragEnd,
}: {
  stage: Stage;
  jobs: Job[];
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  dragOverStage: StageId | null;
  onDragOver: (e: React.DragEvent) => void;
  onDragLeave: () => void;
  onDrop: () => void;
  draggingJob: string | null;
  onDragStart: (jobId: string) => void;
  onDragEnd: () => void;
}) {
  const isDragOver = dragOverStage === stage.id;

  return (
    <div
      className={cn(
        "flex flex-col rounded-xl bg-gray-50 transition-all",
        isCollapsed ? "w-12" : "w-72 min-w-[288px]"
      )}
    >
      {/* Column Header */}
      <div
        className={cn(
          "flex items-center gap-2 rounded-t-xl border-b-2 px-3 py-3",
          stage.bgColor,
          stage.borderColor
        )}
      >
        <button
          onClick={onToggleCollapse}
          className={cn("rounded p-0.5 transition-colors hover:bg-white/50", stage.color)}
        >
          {isCollapsed ? (
            <ChevronRight className="size-4" />
          ) : (
            <ChevronDown className="size-4" />
          )}
        </button>

        {isCollapsed ? (
          <div className="flex flex-1 flex-col items-center gap-2">
            <span
              className={cn(
                "writing-mode-vertical text-sm font-semibold",
                stage.color
              )}
              style={{ writingMode: "vertical-rl", textOrientation: "mixed" }}
            >
              {stage.label}
            </span>
            <span
              className={cn(
                "flex size-5 items-center justify-center rounded-full text-xs font-bold",
                stage.bgColor,
                stage.color
              )}
            >
              {jobs.length}
            </span>
          </div>
        ) : (
          <>
            <span className={cn("flex-1 text-sm font-semibold", stage.color)}>
              {stage.label}
            </span>
            <span
              className={cn(
                "flex size-5 items-center justify-center rounded-full text-xs font-bold bg-white/60",
                stage.color
              )}
            >
              {jobs.length}
            </span>
            <button
              className={cn(
                "rounded p-1 transition-colors hover:bg-white/50",
                stage.color
              )}
            >
              <Plus className="size-4" />
            </button>
          </>
        )}
      </div>

      {/* Column Content */}
      {!isCollapsed && (
        <div
          onDragOver={(e) => {
            e.preventDefault();
            onDragOver(e);
          }}
          onDragLeave={onDragLeave}
          onDrop={onDrop}
          className={cn(
            "flex-1 space-y-3 overflow-y-auto p-3 transition-colors",
            isDragOver && "bg-gold-50 ring-2 ring-inset ring-gold-300"
          )}
          style={{ maxHeight: "calc(100vh - 220px)" }}
        >
          {/* Drop indicator when dragging */}
          {isDragOver && draggingJob && (
            <div className="h-1 rounded-full bg-gold-400 animate-pulse" />
          )}

          {jobs.map((job) => (
            <JobCard
              key={job.id}
              job={job}
              isDragging={draggingJob === job.id}
              onDragStart={() => onDragStart(job.id)}
              onDragEnd={onDragEnd}
            />
          ))}

          {jobs.length === 0 && !isDragOver && (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <div className="mb-2 rounded-full bg-gray-200 p-3">
                <LayoutGrid className="size-5 text-gray-400" />
              </div>
              <p className="text-sm text-gray-500">No jobs in this stage</p>
              <button className="mt-2 text-xs font-medium text-gold-600 hover:text-gold-700">
                + Add job
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// Filter Dropdown Component
function FilterDropdown({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: { value: string; label: string }[];
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-9 appearance-none rounded-lg border border-gray-300 bg-white pl-3 pr-8 text-sm font-medium text-gray-700 focus:border-gold-500 focus:outline-none focus:ring-1 focus:ring-gold-500"
      >
        <option value="">{label}</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <ChevronDown className="pointer-events-none absolute right-2 top-1/2 size-4 -translate-y-1/2 text-gray-400" />
    </div>
  );
}

// Main Component
export default function JobPipelinePage() {
  const [viewMode, setViewMode] = React.useState<"kanban" | "list" | "calendar">("kanban");
  const [jobs, setJobs] = React.useState<Job[]>(mockJobs);
  const [collapsedColumns, setCollapsedColumns] = React.useState<Set<StageId>>(new Set());
  const [draggingJob, setDraggingJob] = React.useState<string | null>(null);
  const [dragOverStage, setDragOverStage] = React.useState<StageId | null>(null);

  // Filters
  const [positionFilter, setPositionFilter] = React.useState("");
  const [clientFilter, setClientFilter] = React.useState("");
  const [searchQuery, setSearchQuery] = React.useState("");

  // Filter options from data
  const positionOptions = [...new Set(jobs.map((j) => j.position))].map((p) => ({
    value: p,
    label: p,
  }));
  const clientOptions = [...new Set(jobs.map((j) => j.client))].map((c) => ({
    value: c,
    label: c,
  }));

  // Filtered jobs
  const filteredJobs = jobs.filter((job) => {
    if (positionFilter && job.position !== positionFilter) return false;
    if (clientFilter && job.client !== clientFilter) return false;
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        job.position.toLowerCase().includes(query) ||
        job.client.toLowerCase().includes(query)
      );
    }
    return true;
  });

  // Group jobs by stage
  const jobsByStage = stages.reduce((acc, stage) => {
    acc[stage.id] = filteredJobs.filter((job) => job.stage === stage.id);
    return acc;
  }, {} as Record<StageId, Job[]>);

  const toggleColumnCollapse = (stageId: StageId) => {
    setCollapsedColumns((prev) => {
      const next = new Set(prev);
      if (next.has(stageId)) {
        next.delete(stageId);
      } else {
        next.add(stageId);
      }
      return next;
    });
  };

  const handleDragStart = (jobId: string) => {
    setDraggingJob(jobId);
  };

  const handleDragEnd = () => {
    setDraggingJob(null);
    setDragOverStage(null);
  };

  const handleDragOver = (stageId: StageId) => {
    setDragOverStage(stageId);
  };

  const handleDragLeave = () => {
    setDragOverStage(null);
  };

  const handleDrop = (targetStage: StageId) => {
    if (draggingJob) {
      setJobs((prev) =>
        prev.map((job) =>
          job.id === draggingJob
            ? { ...job, stage: targetStage, daysInStage: 0 }
            : job
        )
      );
    }
    setDraggingJob(null);
    setDragOverStage(null);
  };

  const clearFilters = () => {
    setPositionFilter("");
    setClientFilter("");
    setSearchQuery("");
  };

  const hasActiveFilters = positionFilter || clientFilter || searchQuery;

  return (
    <div className="flex h-screen flex-col bg-gray-100">
      {/* Header */}
      <header className="border-b border-gray-200 bg-white px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="text-4xl font-serif font-semibold text-navy-800">Job Pipeline</h1>

            {/* View Toggle */}
            <div className="flex rounded-lg border border-gray-300 p-0.5">
              <button
                onClick={() => setViewMode("kanban")}
                className={cn(
                  "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                  viewMode === "kanban"
                    ? "bg-navy-100 text-navy-700"
                    : "text-gray-500 hover:text-gray-700"
                )}
              >
                <LayoutGrid className="size-4" />
                Kanban
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={cn(
                  "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                  viewMode === "list"
                    ? "bg-navy-100 text-navy-700"
                    : "text-gray-500 hover:text-gray-700"
                )}
              >
                <List className="size-4" />
                List
              </button>
              <button
                onClick={() => setViewMode("calendar")}
                className={cn(
                  "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                  viewMode === "calendar"
                    ? "bg-navy-100 text-navy-700"
                    : "text-gray-500 hover:text-gray-700"
                )}
              >
                <Calendar className="size-4" />
                Calendar
              </button>
            </div>
          </div>

          <Button variant="primary" leftIcon={<Plus className="size-4" />}>
            Create Job
          </Button>
        </div>

        {/* Filters Row */}
        <div className="mt-4 flex items-center gap-3">
          {/* Search */}
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search jobs..."
              className="h-9 w-64 rounded-lg border border-gray-300 bg-white pl-9 pr-3 text-sm placeholder:text-gray-400 focus:border-gold-500 focus:outline-none focus:ring-1 focus:ring-gold-500"
            />
          </div>

          <div className="h-5 w-px bg-gray-300" />

          <FilterDropdown
            label="All Positions"
            options={positionOptions}
            value={positionFilter}
            onChange={setPositionFilter}
          />

          <FilterDropdown
            label="All Clients"
            options={clientOptions}
            value={clientFilter}
            onChange={setClientFilter}
          />

          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="flex items-center gap-1 rounded-lg px-2 py-1 text-sm font-medium text-gray-500 hover:bg-gray-100 hover:text-gray-700"
            >
              <X className="size-3" />
              Clear filters
            </button>
          )}

          <div className="flex-1" />

          {/* Stats */}
          <div className="flex items-center gap-4 text-sm">
            <span className="text-gray-500">
              <span className="font-semibold text-navy-900">{filteredJobs.length}</span> jobs
            </span>
            <span className="text-gray-500">
              <span className="font-semibold text-error-600">
                {filteredJobs.filter((j) => j.priority === "urgent").length}
              </span>{" "}
              urgent
            </span>
            <span className="text-gray-500">
              <span className="font-semibold text-warning-600">
                {filteredJobs.filter((j) => j.daysInStage > 7).length}
              </span>{" "}
              stale
            </span>
          </div>
        </div>
      </header>

      {/* Kanban Board */}
      {viewMode === "kanban" && (
        <main className="flex-1 overflow-x-auto p-6">
          <div className="flex gap-4 h-full">
            {stages.map((stage) => (
              <KanbanColumn
                key={stage.id}
                stage={stage}
                jobs={jobsByStage[stage.id]}
                isCollapsed={collapsedColumns.has(stage.id)}
                onToggleCollapse={() => toggleColumnCollapse(stage.id)}
                dragOverStage={dragOverStage}
                onDragOver={() => handleDragOver(stage.id)}
                onDragLeave={handleDragLeave}
                onDrop={() => handleDrop(stage.id)}
                draggingJob={draggingJob}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
              />
            ))}
          </div>
        </main>
      )}

      {/* List View Placeholder */}
      {viewMode === "list" && (
        <main className="flex-1 overflow-auto p-6">
          <div className="rounded-xl border border-gray-200 bg-white">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                    Position
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                    Client
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                    Stage
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                    Salary
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                    Start Date
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                    Candidates
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                    Days
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                    Assignee
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredJobs.map((job) => {
                  const stage = stages.find((s) => s.id === job.stage)!;
                  return (
                    <tr key={job.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          {job.priority === "urgent" && (
                            <Flag className="size-4 text-error-500" fill="currentColor" />
                          )}
                          <span className="font-medium text-navy-900">{job.position}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">{job.client}</td>
                      <td className="px-4 py-3">
                        <span
                          className={cn(
                            "rounded-full px-2.5 py-1 text-xs font-medium",
                            stage.bgColor,
                            stage.color
                          )}
                        >
                          {stage.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {formatSalary(job.salaryMin, job.salaryMax, job.currency)}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">{formatDate(job.startDate)}</td>
                      <td className="px-4 py-3">
                        <span className="flex items-center gap-1 text-sm text-gray-600">
                          <Users className="size-4" />
                          {job.candidatesCount}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={cn(
                            "text-sm font-medium",
                            job.daysInStage > 14
                              ? "text-error-600"
                              : job.daysInStage >= 7
                              ? "text-warning-600"
                              : "text-gray-600"
                          )}
                        >
                          {job.daysInStage}d
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex size-7 items-center justify-center rounded-full bg-gold-100 text-xs font-semibold text-gold-700">
                          {getInitials(job.assignee.name)}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </main>
      )}

      {/* Calendar View Placeholder */}
      {viewMode === "calendar" && (
        <main className="flex flex-1 items-center justify-center p-6">
          <div className="text-center">
            <Calendar className="mx-auto size-12 text-gray-300" />
            <h3 className="mt-4 font-semibold text-gray-600">Calendar View</h3>
            <p className="mt-1 text-sm text-gray-500">Coming soon...</p>
          </div>
        </main>
      )}
    </div>
  );
}
