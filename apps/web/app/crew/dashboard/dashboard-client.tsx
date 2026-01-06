"use client";

import * as React from "react";
import { useEffect, useState } from "react";
import {
  Camera,
  FileText,
  Shield,
  ChevronRight,
  MapPin,
  Ship,
  DollarSign,
  Sparkles,
  Calendar,
  Bell,
  AlertTriangle,
  MessageSquare,
  Briefcase,
  CheckCircle2,
  Circle,
  ArrowRight,
  Upload,
  Edit3,
  RefreshCw,
  Award,
  Clock,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { getPositionDisplayName } from "@/lib/utils/format-position";
import { cn } from "@/lib/utils";
import type {
  DashboardData,
  CandidateApplication,
  Alert,
} from "./actions";
import { updateAvailability } from "./actions";
import { PreferencesSummaryCard } from "@/components/preferences";

// Helper functions
function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return `${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`;
}

// Component to handle relative time safely without hydration issues
function RelativeTime({ dateStr }: { dateStr: string }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  let relativeTime = "";
  if (diffMins < 60) relativeTime = `${diffMins}m ago`;
  else if (diffHours < 24) relativeTime = `${diffHours}h ago`;
  else if (diffDays === 1) relativeTime = "Yesterday";
  else relativeTime = `${diffDays} days ago`;

  // Return formatted date until mounted to avoid hydration mismatch
  if (!mounted) {
    return <>{formatDate(dateStr)}</>;
  }

  return <>{relativeTime}</>;
}

function formatSalary(min: number | null, max: number | null, currency: string): string {
  const formatter = new Intl.NumberFormat("en-US");
  if (!min && !max) return "Competitive";
  if (min && max) {
    return `${currency} ${formatter.format(min)}-${formatter.format(max)}`;
  }
  if (min) return `From ${currency} ${formatter.format(min)}`;
  if (max) return `Up to ${currency} ${formatter.format(max)}`;
  return "Competitive";
}

// Get icon for profile action
function getProfileActionIcon(actionId: string): React.ReactNode {
  switch (actionId) {
    case "basic-info":
      return <Edit3 className="size-4" />;
    case "professional":
      return <Briefcase className="size-4" />;
    case "cv":
      return <FileText className="size-4" />;
    case "photo":
      return <Camera className="size-4" />;
    case "certs":
      return <Shield className="size-4" />;
    case "preferences":
      return <Sparkles className="size-4" />;
    default:
      return <Circle className="size-4" />;
  }
}

// Circular Progress Component
function CircularProgress({
  value,
  size = 80,
  strokeWidth = 6,
}: {
  value: number;
  size?: number;
  strokeWidth?: number;
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (value / 100) * circumference;

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg className="transform -rotate-90" width={size} height={size}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-gray-200"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="text-gold-500 transition-all duration-500"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-lg font-bold text-navy-900">{value}%</span>
      </div>
    </div>
  );
}

// Simple Application Status Component (per PRD: only "Applied" or "In Progress")
function ApplicationStatus({ status }: { status: CandidateApplication["status"] }) {
  if (status === "applied") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-navy-100 px-3 py-1 text-xs font-medium text-navy-700">
        <Circle className="size-2" fill="currentColor" />
        Applied
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-gold-100 px-3 py-1 text-xs font-medium text-gold-700">
      <Clock className="size-3" />
      In Progress
    </span>
  );
}

// Alert Icon Component
function AlertIcon({ type }: { type: Alert["type"] }) {
  switch (type) {
    case "certification":
      return (
        <div className="flex size-10 items-center justify-center rounded-full bg-warning-100">
          <AlertTriangle className="size-5 text-warning-600" />
        </div>
      );
    case "message":
      return (
        <div className="flex size-10 items-center justify-center rounded-full bg-navy-100">
          <MessageSquare className="size-5 text-navy-600" />
        </div>
      );
    case "application":
      return (
        <div className="flex size-10 items-center justify-center rounded-full bg-success-100">
          <Briefcase className="size-5 text-success-600" />
        </div>
      );
  }
}

// Match Badge Component
function MatchBadge({ percentage }: { percentage?: number }) {
  // Don't show badge if percentage is not provided
  if (percentage === undefined || percentage === null) return null;

  const color =
    percentage >= 90
      ? "bg-success-100 text-success-700"
      : percentage >= 80
      ? "bg-gold-100 text-gold-700"
      : "bg-gray-100 text-gray-600";

  return (
    <span className={cn("inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-bold", color)}>
      <Sparkles className="size-3" />
      {percentage}%
    </span>
  );
}

// Main Component
export function DashboardClient({ data }: { data: DashboardData }) {
  const { candidate, profileCompleteness, profileActions, matchedJobs, applications, alerts, preferences, isIdentityVerified } = data;

  const [isAvailable, setIsAvailable] = React.useState(
    candidate.availabilityStatus === "available" || candidate.availabilityStatus === "looking"
  );
  const [availableFrom, setAvailableFrom] = React.useState(
    candidate.availableFrom ? candidate.availableFrom.split("T")[0] : ""
  );
  const [isUpdating, setIsUpdating] = React.useState(false);

  useEffect(() => {
    if (!candidate.availableFrom) {
      setAvailableFrom(new Date().toISOString().split("T")[0]);
    }
  }, [candidate.availableFrom]);

  const handleAvailabilityToggle = async () => {
    setIsUpdating(true);
    const newStatus = isAvailable ? "unavailable" : "available";
    const result = await updateAvailability(newStatus as any, availableFrom);
    if (result.success) {
      setIsAvailable(!isAvailable);
    }
    setIsUpdating(false);
  };

  const handleDateChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const newDate = e.target.value;
    setAvailableFrom(newDate);
    setIsUpdating(true);
    await updateAvailability(isAvailable ? "available" : "unavailable", newDate);
    setIsUpdating(false);
  };

  // Count applications by status
  const appliedCount = applications.filter((a) => a.status === "applied").length;
  const inProgressCount = applications.filter((a) => a.status === "in_progress").length;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto max-w-6xl px-4 py-4 sm:px-6 sm:py-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3 sm:gap-6">
              {/* Profile Photo */}
              <div className="relative flex-shrink-0">
                {candidate.profilePhotoUrl ? (
                  <Image
                    src={candidate.profilePhotoUrl}
                    alt={`${candidate.firstName} ${candidate.lastName}`}
                    width={64}
                    height={64}
                    className="size-12 sm:size-16 rounded-full object-cover"
                  />
                ) : (
                  <div className="flex size-12 sm:size-16 items-center justify-center rounded-full bg-gradient-to-br from-navy-100 to-navy-200 text-lg sm:text-xl font-bold text-navy-600">
                    {candidate.firstName[0]}
                  </div>
                )}
                <Link
                  href="/crew/profile/edit#photo"
                  className="absolute -bottom-1 -right-1 flex size-5 sm:size-6 items-center justify-center rounded-full bg-gold-500 text-white shadow-sm hover:bg-gold-600"
                >
                  <Camera className="size-2.5 sm:size-3" />
                </Link>
              </div>

              <div className="min-w-0 flex-1">
                <h1 className="text-xl sm:text-2xl md:text-4xl font-serif font-semibold text-navy-800">
                  Welcome back, {candidate.firstName}!
                </h1>
                <p className="mt-0.5 sm:mt-1 text-sm sm:text-base text-gray-600">
                  {(() => {
                    // Prioritize preference positions (what they WANT) over profile position (what they DO)
                    const seekingPosition = preferences?.yachtPrimaryPosition || preferences?.householdPrimaryPosition;
                    if (seekingPosition) {
                      return <>Looking for <span className="font-medium">{getPositionDisplayName(seekingPosition)}</span> roles</>;
                    }
                    if (candidate.primaryPosition) {
                      return <>Your profile is set to <span className="font-medium">{getPositionDisplayName(candidate.primaryPosition)}</span></>;
                    }
                    return "Here's what's happening with your job search";
                  })()}
                </p>
              </div>
            </div>

            {/* Profile Completeness - Hidden on mobile, shown in sidebar */}
            <div className="hidden sm:flex items-center gap-4">
              <CircularProgress value={profileCompleteness} />
              <div>
                <p className="text-sm font-medium text-navy-900">Profile Strength</p>
                <p className="text-xs text-gray-500">Complete to get more matches</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-4 sm:px-6 sm:py-6">
        <div className="grid grid-cols-1 gap-4 sm:gap-6 lg:grid-cols-3">
          {/* Left Column */}
          <div className="space-y-4 sm:space-y-6 lg:col-span-2">
            {/* Availability Toggle */}
            <div id="availability" className="scroll-mt-24 rounded-xl border border-gray-200 bg-white p-4 sm:p-6">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-lg sm:text-2xl font-serif font-medium text-navy-800">Your Availability</h2>
                  <p className="mt-0.5 sm:mt-1 text-xs sm:text-sm text-gray-500">
                    Let employers know when you're available
                  </p>
                </div>

                {/* Toggle Switch */}
                <button
                  onClick={handleAvailabilityToggle}
                  disabled={isUpdating}
                  className={cn(
                    "relative h-9 sm:h-10 w-full sm:w-48 rounded-full transition-colors flex-shrink-0",
                    isAvailable ? "bg-success-500" : "bg-gray-300",
                    isUpdating && "opacity-70"
                  )}
                >
                  <span
                    className={cn(
                      "absolute inset-y-1 w-[calc(50%-4px)] rounded-full bg-white shadow-sm transition-all flex items-center justify-center text-sm font-semibold",
                      isAvailable ? "left-1" : "left-[calc(50%+2px)]"
                    )}
                  >
                    {isAvailable ? (
                      <span className="text-success-600">Available</span>
                    ) : (
                      <span className="text-gray-500">Not Looking</span>
                    )}
                  </span>
                  <span
                    className={cn(
                      "absolute inset-y-0 flex w-1/2 items-center justify-center text-sm font-medium",
                      isAvailable ? "right-0 text-white/80" : "left-0 text-gray-500"
                    )}
                  >
                    {isAvailable ? "Not Looking" : "Available"}
                  </span>
                </button>
              </div>

              {isAvailable && (
                <div className="mt-4 flex items-center gap-3 rounded-lg bg-success-50 p-3">
                  <Calendar className="size-5 text-success-600" />
                  <span className="text-sm text-success-700">Available from:</span>
                  <input
                    type="date"
                    value={availableFrom}
                    onChange={handleDateChange}
                    disabled={isUpdating}
                    className="rounded-lg border border-success-200 bg-white px-3 py-1.5 text-sm font-medium text-success-700 focus:border-success-500 focus:outline-none focus:ring-1 focus:ring-success-500"
                  />
                </div>
              )}
            </div>

            {/* Matched Jobs */}
            <div className="rounded-xl border border-gray-200 bg-white p-6">
              <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles className="size-5 text-gold-500" />
                  <h2 className="text-2xl font-serif font-medium text-navy-800">Jobs For You</h2>
                </div>
                <Link
                  href="/crew/jobs"
                  className="flex items-center gap-1 text-sm font-medium text-gold-600 hover:text-gold-700"
                >
                  View all jobs
                  <ChevronRight className="size-4" />
                </Link>
              </div>

              {matchedJobs.length === 0 ? (
                <div className="py-8 text-center">
                  <Ship className="mx-auto size-12 text-gray-300" />
                  <p className="mt-3 text-gray-500">No job matches yet</p>
                  <p className="text-sm text-gray-400">Complete your profile to get personalized matches</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  {matchedJobs.map((job) => (
                    <Link
                      key={job.id}
                      href={`/crew/jobs/${job.id}`}
                      className="group relative rounded-lg border border-gray-200 p-4 transition-all hover:border-gold-300 hover:shadow-md"
                    >
                      {job.urgent && (
                        <span className="absolute -right-2 -top-2 rounded-full bg-error-500 px-2 py-0.5 text-[10px] font-bold text-white">
                          URGENT
                        </span>
                      )}

                      <div className="mb-3 flex items-start justify-between">
                        <div>
                          <h3 className="font-semibold text-navy-900">{job.position}</h3>
                          <p className="text-sm text-gray-600">{job.vesselName || "Employer TBA"}</p>
                        </div>
                        <MatchBadge percentage={job.matchPercentage} />
                      </div>

                      <div className="mb-4 space-y-1.5 text-sm text-gray-500">
                        {job.vesselSize && (
                          <div className="flex items-center gap-2">
                            <Ship className="size-4" />
                            <span>{job.vesselSize}m</span>
                          </div>
                        )}
                        {job.location && (
                          <div className="flex items-center gap-2">
                            <MapPin className="size-4" />
                            <span>{job.location}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-2">
                          <DollarSign className="size-4" />
                          <span>{formatSalary(job.salaryMin, job.salaryMax, job.currency)}/mo</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-400">
                          {job.postedDays === 0
                            ? "Posted today"
                            : job.postedDays === 1
                            ? "Posted yesterday"
                            : `Posted ${job.postedDays} days ago`}
                        </span>
                        <Button variant="primary" size="sm">
                          View Job
                        </Button>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>

            {/* My Applications (Simplified per PRD) */}
            <div className="rounded-xl border border-gray-200 bg-white">
              <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
                <h2 className="text-2xl font-serif font-medium text-navy-800">My Applications</h2>
                <div className="flex items-center gap-4 text-sm text-gray-500">
                  <span className="flex items-center gap-1.5">
                    <div className="size-2 rounded-full bg-navy-400" />
                    Applied: {appliedCount}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <div className="size-2 rounded-full bg-gold-400" />
                    In Progress: {inProgressCount}
                  </span>
                </div>
              </div>

              {/* Application List */}
              <div className="divide-y divide-gray-100">
                {applications.length === 0 ? (
                  <div className="py-12 text-center">
                    <Briefcase className="mx-auto size-10 text-gray-300" />
                    <p className="mt-3 text-gray-500">No applications yet</p>
                    <p className="mt-1 text-sm text-gray-400">Browse jobs to start applying</p>
                    <Link href="/crew/jobs">
                      <Button variant="primary" className="mt-4">
                        Browse Jobs
                      </Button>
                    </Link>
                  </div>
                ) : (
                  applications.slice(0, 5).map((app) => {
                    const href = app.jobId ? `/crew/jobs/${app.jobId}` : "/crew/jobs";
                    return (
                      <Link
                        key={app.id}
                        href={href}
                        className="flex flex-col gap-2 px-4 py-3 transition-colors hover:bg-gray-50 sm:flex-row sm:items-center sm:justify-between sm:px-6 sm:py-4"
                      >
                        <div className="flex min-w-0 flex-1 items-center gap-3 sm:gap-4">
                          <div className="flex size-8 sm:size-10 items-center justify-center rounded-full bg-navy-100 flex-shrink-0">
                            <Ship className="size-4 sm:size-5 text-navy-600" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <h4 className="font-medium text-navy-900 text-sm sm:text-base truncate" title={app.position}>
                              {app.position}
                            </h4>
                            <p
                              className="text-xs sm:text-sm text-gray-500 truncate"
                              title={app.vesselName || "Employer TBA"}
                            >
                              {app.vesselName || "Employer TBA"}
                            </p>
                          </div>
                        </div>

                        <div className="flex shrink-0 items-center justify-between gap-3 pl-11 sm:justify-end sm:gap-6 sm:pl-0">
                          <p className="text-xs text-gray-400">Applied {formatDate(app.appliedDate)}</p>
                          <ApplicationStatus status={app.status} />
                        </div>
                      </Link>
                    );
                  })
                )}
              </div>

              {applications.length > 5 && (
                <div className="border-t border-gray-100 px-6 py-3">
                  <Link
                    href="/crew/applications"
                    className="flex items-center justify-center gap-1 text-sm font-medium text-gold-600 hover:text-gold-700"
                  >
                    View all {applications.length} applications
                    <ChevronRight className="size-4" />
                  </Link>
                </div>
              )}
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-4 sm:space-y-6">
            {/* Job Preferences Card */}
            <PreferencesSummaryCard preferences={preferences} />

            {/* Profile Strength Card */}
            <div className="rounded-xl border border-gray-200 bg-white p-4 sm:p-6">
              <div className="mb-3 sm:mb-4 flex items-center gap-2 sm:gap-3">
                <Award className="size-5 sm:size-6 text-gold-500" />
                <div>
                  <h2 className="text-lg sm:text-2xl font-serif font-medium text-navy-800">Profile Strength</h2>
                  <p className="text-xs text-gray-500">Complete to get better matches</p>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="mb-4">
                <div className="mb-2 flex items-center justify-between text-sm">
                  <span className="font-medium text-navy-900">{profileCompleteness}% Complete</span>
                  <span className="text-gray-500">100%</span>
                </div>
                <div className="h-3 overflow-hidden rounded-full bg-gray-200">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-gold-400 to-gold-500 transition-all duration-500"
                    style={{ width: `${profileCompleteness}%` }}
                  />
                </div>
              </div>

              {/* Action Items */}
              {profileActions.length > 0 && (
                <div className="space-y-2">
                  {profileActions.map((action) => (
                    <Link
                      key={action.id}
                      href={action.href}
                      className="flex w-full items-center justify-between rounded-lg border border-gray-200 bg-white p-3 text-left transition-colors hover:border-gold-300 hover:bg-gold-50"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex size-8 items-center justify-center rounded-full bg-gray-100 text-gray-500">
                          {getProfileActionIcon(action.id)}
                        </div>
                        <span className="text-sm font-medium text-navy-900">{action.label}</span>
                      </div>
                      <span className="rounded-full bg-gold-100 px-2 py-0.5 text-xs font-bold text-gold-700">
                        +{action.percentageBoost}%
                      </span>
                    </Link>
                  ))}
                </div>
              )}

              {profileCompleteness >= 95 && (
                <div className="flex items-center gap-2 rounded-lg bg-success-50 p-3">
                  <CheckCircle2 className="size-5 text-success-600" />
                  <span className="text-sm font-medium text-success-700">Your profile is complete!</span>
                </div>
              )}
            </div>

            {/* Alerts Section */}
            <div className="rounded-xl border border-gray-200 bg-white p-6">
              <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Bell className="size-5 text-navy-600" />
                  <h2 className="text-2xl font-serif font-medium text-navy-800">Alerts</h2>
                </div>
                {alerts.length > 0 && (
                  <span className="flex size-5 items-center justify-center rounded-full bg-error-500 text-xs font-bold text-white">
                    {alerts.length}
                  </span>
                )}
              </div>

              {alerts.length === 0 ? (
                <div className="py-4 text-center">
                  <CheckCircle2 className="mx-auto size-8 text-success-400" />
                  <p className="mt-2 text-sm text-gray-500">All caught up! No alerts.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {alerts.map((alert) => (
                    <div
                      key={alert.id}
                      className={cn(
                        "flex items-start gap-3 rounded-lg p-3",
                        alert.urgent ? "bg-warning-50" : "bg-gray-50"
                      )}
                    >
                      <AlertIcon type={alert.type} />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-2">
                          <h4 className="text-sm font-medium text-navy-900">{alert.title}</h4>
                          <span className="shrink-0 text-xs text-gray-400">
                            <RelativeTime dateStr={alert.date} />
                          </span>
                        </div>
                        <p className="mt-0.5 text-xs text-gray-600">{alert.description}</p>
                        {alert.actionLabel && alert.actionHref && (
                          <Link
                            href={alert.actionHref}
                            className="mt-2 flex items-center gap-1 text-xs font-medium text-gold-600 hover:text-gold-700"
                          >
                            {alert.actionLabel}
                            <ArrowRight className="size-3" />
                          </Link>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Quick Actions */}
            <div className="rounded-xl border border-gray-200 bg-white p-6">
              <h2 className="mb-4 text-2xl font-serif font-medium text-navy-800">Quick Actions</h2>
              <div className="space-y-2">
                <a
                  href="#availability"
                  className="flex w-full items-center gap-3 rounded-lg border border-gray-200 p-3 text-left transition-colors hover:border-gold-300 hover:bg-gold-50"
                >
                  <div className="flex size-10 items-center justify-center rounded-full bg-success-100">
                    <RefreshCw className="size-5 text-success-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-navy-900">Update Availability</p>
                    <p className="text-xs text-gray-500">Let employers know when you're free</p>
                  </div>
                </a>

                <Link
                  href="/crew/documents#cv"
                  className="flex w-full items-center gap-3 rounded-lg border border-gray-200 p-3 text-left transition-colors hover:border-gold-300 hover:bg-gold-50"
                >
                  <div className="flex size-10 items-center justify-center rounded-full bg-navy-100">
                    <Upload className="size-5 text-navy-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-navy-900">Upload New CV</p>
                    <p className="text-xs text-gray-500">Keep your resume up to date</p>
                  </div>
                </Link>

                <Link
                  href="/crew/profile/edit"
                  className="flex w-full items-center gap-3 rounded-lg border border-gray-200 p-3 text-left transition-colors hover:border-gold-300 hover:bg-gold-50"
                >
                  <div className="flex size-10 items-center justify-center rounded-full bg-gold-100">
                    <Edit3 className="size-5 text-gold-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-navy-900">Edit Profile</p>
                    <p className="text-xs text-gray-500">Update your experience and skills</p>
                  </div>
                </Link>
              </div>
            </div>

          </div>
        </div>
      </main>
    </div>
  );
}
