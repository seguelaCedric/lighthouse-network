"use client";

import * as React from "react";
import Link from "next/link";
import {
  Briefcase,
  Users,
  FileText,
  TrendingUp,
  Plus,
  Search,
  UserPlus,
  Clock,
  Eye,
  ArrowRight,
  AlertTriangle,
  CheckCircle2,
  UserCheck,
  Ship,
  BookOpen,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { StatCard } from "@/components/ui/stat-card";
import { cn } from "@/lib/utils";
import type {
  DashboardStats,
  DashboardBrief,
  DashboardJob,
  DashboardApplication,
} from "./dashboard-types";
import type { BriefStatus } from "@lighthouse/database";

interface DashboardClientProps {
  stats: DashboardStats;
  recentBriefs: DashboardBrief[];
  staleJobs: DashboardJob[];
  recentApplications: DashboardApplication[];
  userName: string;
}

// Helper Components
const briefStatusConfig: Record<
  BriefStatus,
  { label: string; color: string; bgColor: string; icon: string }
> = {
  new: { label: "New", color: "text-warning-600", bgColor: "bg-warning-100", icon: "🟡" },
  parsing: { label: "Parsing", color: "text-blue-600", bgColor: "bg-blue-100", icon: "🔵" },
  parsed: { label: "Parsed", color: "text-success-600", bgColor: "bg-success-100", icon: "🟢" },
  converted: { label: "Converted", color: "text-gray-600", bgColor: "bg-gray-100", icon: "⚫" },
  needs_clarification: {
    label: "Needs Clarification",
    color: "text-error-600",
    bgColor: "bg-error-100",
    icon: "🔴",
  },
  abandoned: { label: "Abandoned", color: "text-gray-400", bgColor: "bg-gray-50", icon: "⚪" },
};

function formatTimeAgo(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  return `${diffDays}d ago`;
}

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

// Brief Inbox Component
function BriefInbox({ briefs }: { briefs: DashboardBrief[] }) {
  const [activeFilter, setActiveFilter] = React.useState<BriefStatus | "all">("all");

  const filters: { value: BriefStatus | "all"; label: string; count: number }[] = [
    { value: "all", label: "All", count: briefs.length },
    { value: "new", label: "New", count: briefs.filter((b) => b.status === "new").length },
    { value: "parsing", label: "Parsing", count: briefs.filter((b) => b.status === "parsing").length },
    {
      value: "needs_clarification",
      label: "Needs Clarification",
      count: briefs.filter((b) => b.status === "needs_clarification").length,
    },
  ];

  const filteredBriefs =
    activeFilter === "all" ? briefs : briefs.filter((b) => b.status === activeFilter);

  return (
    <div className="rounded-xl border border-gray-200 bg-white">
      {/* Header */}
      <div className="border-b border-gray-100 p-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-serif font-medium text-navy-800">Brief Inbox</h2>
          <Link href="/briefs">
            <Button variant="ghost" size="sm" rightIcon={<ArrowRight className="size-4" />}>
              View All
            </Button>
          </Link>
        </div>
        {/* Filter Tabs */}
        <div className="mt-3 flex gap-2 overflow-x-auto">
          {filters.map((filter) => (
            <button
              key={filter.value}
              onClick={() => setActiveFilter(filter.value)}
              className={cn(
                "flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium transition-colors whitespace-nowrap",
                activeFilter === filter.value
                  ? "bg-navy-100 text-navy-800"
                  : "text-gray-600 hover:bg-gray-100"
              )}
            >
              {filter.label}
              <span
                className={cn(
                  "rounded-full px-1.5 py-0.5 text-xs",
                  activeFilter === filter.value ? "bg-navy-200" : "bg-gray-200"
                )}
              >
                {filter.count}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Brief List */}
      <div className="divide-y divide-gray-100">
        {filteredBriefs.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <FileText className="mx-auto mb-2 size-8 text-gray-300" />
            <p>No briefs to display</p>
          </div>
        ) : (
          filteredBriefs.map((brief) => {
            const status = briefStatusConfig[brief.status] || briefStatusConfig.new;
            return (
              <Link
                key={brief.id}
                href={`/briefs/parse?id=${brief.id}`}
                className="flex items-center justify-between gap-4 p-4 hover:bg-gray-50 transition-colors cursor-pointer"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-base">{status.icon}</span>
                    <h3 className="font-medium text-navy-900 truncate">{brief.clientName}</h3>
                    <span
                      className={cn(
                        "rounded-full px-2 py-0.5 text-xs font-medium",
                        status.bgColor,
                        status.color
                      )}
                    >
                      {status.label}
                    </span>
                  </div>
                  <div className="mt-1 flex items-center gap-3 text-sm text-gray-500">
                    <span className="truncate">{brief.position}</span>
                    <span className="shrink-0">•</span>
                    <span className="shrink-0 flex items-center gap-1">
                      <Clock className="size-3" />
                      {formatTimeAgo(brief.receivedAt)}
                    </span>
                  </div>
                  {/* Confidence Score */}
                  {brief.confidenceScore !== undefined && (
                    <div className="mt-2 flex items-center gap-2">
                      <div className="h-1.5 w-24 overflow-hidden rounded-full bg-gray-200">
                        <div
                          className={cn(
                            "h-full rounded-full transition-all",
                            brief.confidenceScore >= 80
                              ? "bg-success-500"
                              : brief.confidenceScore >= 50
                                ? "bg-gold-500"
                                : "bg-error-500"
                          )}
                          style={{ width: `${brief.confidenceScore}%` }}
                        />
                      </div>
                      <span className="text-xs text-gray-500">{brief.confidenceScore}%</span>
                    </div>
                  )}
                </div>
                {/* Actions */}
                <div className="flex items-center gap-2 shrink-0">
                  <Button variant="ghost" size="sm" leftIcon={<Eye className="size-4" />}>
                    View
                  </Button>
                  {brief.status === "parsed" && (
                    <Button variant="primary" size="sm" leftIcon={<ArrowRight className="size-4" />}>
                      Convert
                    </Button>
                  )}
                </div>
              </Link>
            );
          })
        )}
      </div>
    </div>
  );
}

// Jobs Needing Attention Component
function JobsNeedingAttention({ jobs }: { jobs: DashboardJob[] }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white">
      <div className="border-b border-gray-100 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-serif font-medium text-navy-800">Jobs Needing Attention</h2>
            <span className="rounded-full bg-error-100 px-2 py-0.5 text-xs font-medium text-error-700">
              {jobs.filter((j) => j.daysSinceActivity > 7).length} urgent
            </span>
          </div>
          <Link href="/jobs">
            <Button variant="ghost" size="sm" rightIcon={<ArrowRight className="size-4" />}>
              View All
            </Button>
          </Link>
        </div>
      </div>

      <div className="divide-y divide-gray-100">
        {jobs.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <CheckCircle2 className="mx-auto mb-2 size-8 text-success-300" />
            <p>All jobs are up to date!</p>
          </div>
        ) : (
          jobs.map((job) => {
            const isStale = job.daysSinceActivity > 7;
            return (
              <Link
                key={job.id}
                href={`/jobs/${job.id}`}
                className={cn(
                  "block p-4 transition-colors hover:bg-gray-50 cursor-pointer",
                  isStale && "border-l-4 border-l-error-500"
                )}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium text-navy-900 truncate">{job.title}</h3>
                      {isStale && (
                        <AlertTriangle className="size-4 text-error-500 shrink-0" />
                      )}
                    </div>
                    <p className="mt-0.5 text-sm text-gray-600 truncate">{job.client}</p>
                    <div className="mt-2 flex flex-wrap items-center gap-3 text-sm">
                      <span
                        className={cn(
                          "flex items-center gap-1",
                          isStale ? "text-error-600 font-medium" : "text-gray-500"
                        )}
                      >
                        <Clock className="size-3.5" />
                        {job.daysSinceActivity}d since activity
                      </span>
                      <span className="flex items-center gap-1 text-gray-500">
                        <Users className="size-3.5" />
                        {job.candidateCount} candidates
                      </span>
                      {job.salary && (
                        <span className="text-navy-700 font-medium">{job.salary}</span>
                      )}
                    </div>
                  </div>
                  <Button variant="secondary" size="sm">
                    Review
                  </Button>
                </div>
              </Link>
            );
          })
        )}
      </div>
    </div>
  );
}

// Recent Applications Component
function RecentApplications({ applications }: { applications: DashboardApplication[] }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white">
      <div className="border-b border-gray-100 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-serif font-medium text-navy-800">Recent Applications</h2>
            {applications.length > 0 && (
              <span className="rounded-full bg-success-100 px-2 py-0.5 text-xs font-medium text-success-700">
                {applications.length} new
              </span>
            )}
          </div>
          <Link href="/jobs">
            <Button variant="ghost" size="sm" rightIcon={<ArrowRight className="size-4" />}>
              View All
            </Button>
          </Link>
        </div>
      </div>

      <div className="divide-y divide-gray-100">
        {applications.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <UserCheck className="mx-auto mb-2 size-8 text-gray-300" />
            <p>No recent applications</p>
            <p className="mt-1 text-xs">Applications from the job board will appear here</p>
          </div>
        ) : (
          applications.map((app) => (
            <Link
              key={app.id}
              href={`/jobs/${app.jobId}`}
              className="block p-4 transition-colors hover:bg-gray-50 cursor-pointer border-l-4 border-l-success-500"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-base">🆕</span>
                    <h3 className="font-medium text-navy-900 truncate">
                      {app.candidateName} applied for {app.jobTitle}
                    </h3>
                  </div>
                  <div className="mt-1 flex items-center gap-3 text-sm text-gray-500">
                    {app.vesselName && (
                      <span className="flex items-center gap-1">
                        <Ship className="size-3.5" />
                        {app.vesselName}
                      </span>
                    )}
                    <span className="shrink-0">•</span>
                    <span>Via job board</span>
                    <span className="shrink-0">•</span>
                    <span className="shrink-0 flex items-center gap-1">
                      <Clock className="size-3" />
                      {formatTimeAgo(app.appliedAt)}
                    </span>
                  </div>
                </div>
                <Button variant="primary" size="sm">
                  Review
                </Button>
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}

// Main Dashboard Client Component
export function DashboardClient({
  stats,
  recentBriefs,
  staleJobs,
  recentApplications,
  userName,
}: DashboardClientProps) {
  const [greeting, setGreeting] = React.useState("");

  // Compute greeting on client only to avoid hydration mismatch
  React.useEffect(() => {
    setGreeting(getGreeting());
  }, []);

  return (
    <div className="p-6">
      <div className="mx-auto max-w-7xl space-y-6">
            {/* Header */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h1 className="text-4xl font-serif font-semibold text-navy-800">
                  {greeting || "Welcome"}, {userName}
                </h1>
                <p className="mt-1 text-gray-600">
                  Here&apos;s what&apos;s happening with your recruitment pipeline today.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Link href="/briefs/new">
                  <Button variant="primary" leftIcon={<Plus className="size-4" />}>
                    New Brief
                  </Button>
                </Link>
                <Link href="/candidates/new">
                  <Button variant="secondary" leftIcon={<UserPlus className="size-4" />}>
                    Add Candidate
                  </Button>
                </Link>
                <Button variant="ghost" leftIcon={<Search className="size-4" />}>
                  Quick Search
                </Button>
              </div>
            </div>

            {/* Stats Row */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <StatCard
                icon={<FileText className="size-5" />}
                value={stats.newBriefsCount}
                label="New Briefs"
              />
              <StatCard
                icon={<Briefcase className="size-5" />}
                value={stats.openJobsCount}
                label="Open Jobs"
              />
              <StatCard
                icon={<TrendingUp className="size-5" />}
                value={stats.placementsThisMonth}
                label="Placements This Month"
              />
              <StatCard
                icon={<Users className="size-5" />}
                value={staleJobs.length}
                label="Jobs Needing Attention"
              />
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
              {/* Left Column - Brief Inbox (2/3 width) */}
              <div className="lg:col-span-2 space-y-6">
                <RecentApplications applications={recentApplications} />
                <BriefInbox briefs={recentBriefs} />
                <JobsNeedingAttention jobs={staleJobs} />
              </div>

              {/* Right Column - Quick Actions (1/3 width) */}
              <div className="lg:col-span-1">
                <div className="rounded-xl border border-gray-200 bg-white p-4">
                  <h2 className="text-2xl font-serif font-medium text-navy-800 mb-4">Quick Actions</h2>
                  <div className="space-y-2">
                    <Link href="/briefs/new" className="block">
                      <Button variant="ghost" className="w-full justify-start" leftIcon={<Plus className="size-4" />}>
                        Create New Brief
                      </Button>
                    </Link>
                    <Link href="/jobs/new" className="block">
                      <Button variant="ghost" className="w-full justify-start" leftIcon={<Briefcase className="size-4" />}>
                        Post New Job
                      </Button>
                    </Link>
                    <Link href="/candidates" className="block">
                      <Button variant="ghost" className="w-full justify-start" leftIcon={<Search className="size-4" />}>
                        Search Candidates
                      </Button>
                    </Link>
                    <Link href="/jobs/match" className="block">
                      <Button variant="ghost" className="w-full justify-start" leftIcon={<Users className="size-4" />}>
                        AI Matching
                      </Button>
                    </Link>
                    <div className="my-2 border-t border-gray-200" />
                    <Link href="/dashboard/seo-pages/blog" className="block">
                      <Button variant="ghost" className="w-full justify-start" leftIcon={<BookOpen className="size-4" />}>
                        Blog Posts
                      </Button>
                    </Link>
                    <Link href="/dashboard/seo-pages/blog/new" className="block">
                      <Button variant="ghost" className="w-full justify-start" leftIcon={<Sparkles className="size-4" />}>
                        Generate Blog Post
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            </div>
      </div>
    </div>
  );
}
