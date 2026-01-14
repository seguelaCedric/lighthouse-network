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
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Toast } from "@/components/ui/toast";
import { getPositionDisplayName } from "@/lib/utils/format-position";
import { cn } from "@/lib/utils";
import type {
  DashboardData,
  CandidateApplication,
  Alert,
} from "./actions";
import { updateAvailability } from "./actions";
import { PreferencesSummaryCard } from "@/components/preferences";
import { DocumentsSummaryCard } from "@/components/documents";

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
  // Handle granular field-level actions
  if (actionId.startsWith("personal-")) {
    return <Edit3 className="size-4" />;
  }
  if (actionId.startsWith("professional-") || actionId.startsWith("experience-") || actionId.startsWith("availability-")) {
    return <Briefcase className="size-4" />;
  }
  if (actionId.startsWith("enhancement-")) {
    if (actionId.includes("photo") || actionId.includes("avatarUrl")) {
      return <Camera className="size-4" />;
    }
    return <Edit3 className="size-4" />;
  }
  
  // Handle legacy/grouped actions
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
    case "job":
      return (
        <div className="flex size-10 items-center justify-center rounded-full bg-gold-100">
          <Ship className="size-5 text-gold-600" />
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
  const { candidate, profileCompleteness, profileActions, matchedJobs, applications, alerts, preferences, documents, isIdentityVerified } = data;
  const searchParams = useSearchParams();
  const [showRedirectToast, setShowRedirectToast] = React.useState(false);

  const [isAvailable, setIsAvailable] = React.useState(
    candidate.availabilityStatus === "available"
  );
  const [availableFrom, setAvailableFrom] = React.useState(
    candidate.availableFrom ? candidate.availableFrom.split("T")[0] : ""
  );
  const [isUpdating, setIsUpdating] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);

  // Check if user was redirected from agency dashboard
  useEffect(() => {
    if (searchParams.get("redirected") === "agency_access") {
      setShowRedirectToast(true);
      // Clean up URL without page reload
      const url = new URL(window.location.href);
      url.searchParams.delete("redirected");
      window.history.replaceState({}, "", url.toString());
    }
  }, [searchParams]);

  useEffect(() => {
    if (!candidate.availableFrom) {
      setAvailableFrom(new Date().toISOString().split("T")[0]);
    }
  }, [candidate.availableFrom]);

  // Sync state when candidate data changes
  useEffect(() => {
    setIsAvailable(candidate.availabilityStatus === "available");
    if (candidate.availableFrom) {
      setAvailableFrom(candidate.availableFrom.split("T")[0]);
    }
  }, [candidate.availabilityStatus, candidate.availableFrom]);

  const handleAvailabilityToggle = async () => {
    if (isUpdating) return; // Prevent double-clicks
    
    setIsUpdating(true);
    setErrorMessage(null); // Clear any previous errors
    const newStatus = isAvailable ? "not_looking" : "available";
    const newAvailableState = !isAvailable;
    
    // Optimistically update UI
    setIsAvailable(newAvailableState);
    
    const result = await updateAvailability(newStatus, availableFrom);
    if (!result.success) {
      // Revert on error
      setIsAvailable(!newAvailableState);
      setErrorMessage(result.error || "Failed to update availability. Please try again.");
      console.error("Failed to update availability:", result.error);
    }
    setIsUpdating(false);
  };

  const handleDateChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const newDate = e.target.value;
    setAvailableFrom(newDate);
    setIsUpdating(true);
    setErrorMessage(null); // Clear any previous errors
    const result = await updateAvailability(isAvailable ? "available" : "not_looking", newDate);
    if (!result.success) {
      setErrorMessage(result.error || "Failed to update availability date. Please try again.");
      console.error("Failed to update availability date:", result.error);
    }
    setIsUpdating(false);
  };

  // Count applications by status
  const appliedCount = applications.filter((a) => a.status === "applied").length;
  const inProgressCount = applications.filter((a) => a.status === "in_progress").length;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Toast Notification for Redirect */}
      {showRedirectToast && (
        <Toast
          message="This area is for agency staff only. You've been redirected to your candidate dashboard."
          type="info"
          onClose={() => setShowRedirectToast(false)}
          duration={6000}
        />
      )}

      {/* Header */}
      <header className="bg-gray-50">
        <div className="mx-auto max-w-6xl px-4 py-3 sm:px-6 sm:py-6">
          <div className="border-b border-gray-200 pb-3 sm:pb-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-2.5 sm:gap-6">
                {/* Profile Photo */}
                <Link
                  href="/crew/profile/edit#photo"
                  className="relative flex-shrink-0 transition-transform active:scale-95 focus:outline-none focus:ring-2 focus:ring-gold-500 focus:ring-offset-2 rounded-full"
                >
                  {candidate.profilePhotoUrl ? (
                    <Image
                      src={candidate.profilePhotoUrl}
                      alt={`${candidate.firstName} ${candidate.lastName}`}
                      width={64}
                      height={64}
                      className="size-14 sm:size-16 rounded-full object-cover ring-2 ring-gold-200 transition-shadow hover:ring-gold-300"
                    />
                  ) : (
                    <div className="flex size-14 sm:size-16 items-center justify-center rounded-full bg-gradient-to-br from-navy-100 to-navy-200 text-lg sm:text-xl font-bold text-navy-600 ring-2 ring-gold-200 transition-shadow hover:ring-gold-300">
                      {candidate.firstName[0]}
                    </div>
                  )}
                  <div className="absolute -bottom-0.5 -right-0.5 sm:-bottom-1 sm:-right-1 flex size-5 sm:size-6 items-center justify-center rounded-full bg-gold-500 text-white shadow-md hover:bg-gold-600 transition-all active:scale-90">
                    <Camera className="size-3 sm:size-3.5" />
                  </div>
                </Link>

                <div className="min-w-0 flex-1">
                <h1 className="flex flex-wrap items-center gap-2 text-xl sm:text-3xl font-serif font-semibold text-navy-800">
                  <Sparkles className="size-5 sm:size-7 text-gold-500 flex-shrink-0" />
                  <span className="break-words">Welcome back, {candidate.firstName}!</span>
                </h1>
                <p className="mt-1 sm:mt-2 text-sm sm:text-base text-gray-600">
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
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-3 sm:px-6 sm:py-6">
        <div className="grid grid-cols-1 gap-3 sm:gap-6 lg:grid-cols-3">
          {/* Left Column */}
          <div className="space-y-3 sm:space-y-6 lg:col-span-2">
            {/* Availability Toggle */}
            <div id="availability" className="scroll-mt-24 rounded-xl border border-gray-200 bg-white p-4 sm:p-6">
              <div className="mb-4">
                <h2 className="text-lg sm:text-2xl font-serif font-medium text-navy-800">Your Availability</h2>
                <p className="mt-0.5 sm:mt-1 text-xs sm:text-sm text-gray-500">
                  Let employers know when you're available
                </p>
              </div>

              {errorMessage && (
                <div className="mb-4 rounded-lg bg-error-50 border border-error-200 p-3">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="size-4 sm:size-5 text-error-600 flex-shrink-0 mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs sm:text-sm font-medium text-error-800">Update Failed</p>
                      <p className="text-xs text-error-700 mt-0.5">{errorMessage}</p>
                    </div>
                    <button
                      onClick={() => setErrorMessage(null)}
                      className="text-error-600 hover:text-error-800 flex-shrink-0"
                      aria-label="Dismiss error"
                    >
                      <span className="text-lg leading-none">&times;</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Segmented Control Toggle */}
              <div className="relative inline-flex w-full rounded-lg border border-gray-200 bg-gray-50 p-1" role="group">
                <button
                  type="button"
                  onClick={() => {
                    if (!isAvailable && !isUpdating) {
                      handleAvailabilityToggle();
                    }
                  }}
                  disabled={isUpdating || isAvailable}
                  className={cn(
                    "relative flex-1 rounded-md px-4 py-2.5 text-sm font-semibold transition-all focus:outline-none focus:ring-2 focus:ring-success-500 focus:ring-offset-2",
                    isAvailable
                      ? "bg-success-500 text-white shadow-sm cursor-default"
                      : "text-gray-600 hover:text-gray-900 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                  )}
                  aria-pressed={isAvailable}
                >
                  <span className="flex items-center justify-center gap-2">
                    <CheckCircle2 className={cn("size-4", isAvailable ? "text-white" : "text-gray-400")} />
                    Available
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (isAvailable && !isUpdating) {
                      handleAvailabilityToggle();
                    }
                  }}
                  disabled={isUpdating || !isAvailable}
                  className={cn(
                    "relative flex-1 rounded-md px-4 py-2.5 text-sm font-semibold transition-all focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2",
                    !isAvailable
                      ? "bg-gray-700 text-white shadow-sm cursor-default"
                      : "text-gray-600 hover:text-gray-900 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                  )}
                  aria-pressed={!isAvailable}
                >
                  <span className="flex items-center justify-center gap-2">
                    <Circle className={cn("size-4", !isAvailable ? "text-white" : "text-gray-400")} />
                    Not Looking
                  </span>
                </button>
              </div>

              {isAvailable && (
                <div className="mt-4 flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3 rounded-lg bg-success-50 border border-success-200 p-3 sm:p-4">
                  <div className="flex items-center gap-2 sm:gap-3">
                    <Calendar className="size-4 sm:size-5 text-success-600 flex-shrink-0" />
                    <label htmlFor="available-from" className="text-xs sm:text-sm font-medium text-success-700 whitespace-nowrap">
                      Available from:
                    </label>
                  </div>
                  <input
                    id="available-from"
                    type="date"
                    value={availableFrom}
                    onChange={handleDateChange}
                    disabled={isUpdating}
                    className="flex-1 rounded-lg border border-success-300 bg-white px-3 py-2 text-xs sm:text-sm font-medium text-navy-900 focus:border-success-500 focus:outline-none focus:ring-2 focus:ring-success-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                </div>
              )}
            </div>

            {/* Matched Jobs */}
            <div className="rounded-xl border border-gray-200 bg-white p-4 sm:p-6">
              <div className="mb-3 sm:mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles className="size-4 text-gold-500 sm:size-5 flex-shrink-0" />
                  <h2 className="text-lg sm:text-2xl font-serif font-medium text-navy-800">Jobs For You</h2>
                </div>
                <Link
                  href="/crew/jobs"
                  className="flex items-center gap-1 text-xs font-medium text-gold-600 hover:text-gold-700 sm:text-sm whitespace-nowrap"
                >
                  View all jobs
                  <ChevronRight className="size-3 sm:size-4" />
                </Link>
              </div>

              {matchedJobs.length === 0 ? (
                <div className="py-6 text-center sm:py-8">
                  <Ship className="mx-auto size-10 text-gray-300 sm:size-12" />
                  <p className="mt-3 text-sm text-gray-500 sm:text-base">No job matches yet</p>
                  <p className="mt-1 text-xs text-gray-400 sm:text-sm">Complete your profile to get personalized matches</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-3 sm:gap-4 sm:grid-cols-2">
                  {matchedJobs.map((job) => (
                    <Link
                      key={job.id}
                      href={`/crew/jobs/${job.id}`}
                      className="group relative rounded-lg border border-gray-200 p-3 transition-all hover:border-gold-300 hover:shadow-md sm:p-4"
                    >
                      {job.urgent && (
                        <span className="absolute -right-1 -top-1 rounded-full bg-error-500 px-1.5 py-0.5 text-[9px] font-bold text-white sm:-right-2 sm:-top-2 sm:px-2 sm:text-[10px]">
                          URGENT
                        </span>
                      )}

                      <div className="mb-2 flex items-start justify-between gap-2 sm:mb-3">
                        <div className="min-w-0 flex-1 pr-2">
                          <h3 className="text-sm font-semibold text-navy-900 sm:text-base line-clamp-2 break-words">{job.position}</h3>
                          <p className="mt-0.5 text-xs text-gray-600 sm:text-sm line-clamp-1">{job.vesselName || "Employer TBA"}</p>
                        </div>
                        <MatchBadge percentage={job.matchPercentage} />
                      </div>

                      <div className="mb-3 space-y-1.5 text-xs text-gray-500 sm:mb-4 sm:space-y-1.5 sm:text-sm">
                        {job.vesselSize && (
                          <div className="flex items-center gap-2">
                            <Ship className="size-3.5 sm:size-4 flex-shrink-0" />
                            <span className="truncate">{job.vesselSize}m</span>
                          </div>
                        )}
                        {job.location && (
                          <div className="flex items-center gap-2">
                            <MapPin className="size-3.5 sm:size-4 flex-shrink-0" />
                            <span className="truncate">{job.location}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-2">
                          <DollarSign className="size-3.5 sm:size-4 flex-shrink-0" />
                          <span className="truncate">{formatSalary(job.salaryMin, job.salaryMax, job.currency)}/mo</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between gap-2 pt-1 border-t border-gray-100">
                        <span className="text-[10px] text-gray-400 sm:text-xs whitespace-nowrap">
                          {job.postedDays === 0
                            ? "Posted today"
                            : job.postedDays === 1
                            ? "Posted yesterday"
                            : `Posted ${job.postedDays} days ago`}
                        </span>
                        <Button variant="primary" size="sm" className="text-xs sm:text-sm flex-shrink-0">
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
              <div className="flex flex-col gap-2 border-b border-gray-100 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-6 sm:py-4">
                <h2 className="text-lg sm:text-2xl font-serif font-medium text-navy-800">My Applications</h2>
                <div className="flex items-center gap-3 text-xs text-gray-500 sm:gap-4 sm:text-sm">
                  <span className="flex items-center gap-1.5 whitespace-nowrap">
                    <div className="size-2 rounded-full bg-navy-400 flex-shrink-0" />
                    <span>Applied: {appliedCount}</span>
                  </span>
                  <span className="flex items-center gap-1.5 whitespace-nowrap">
                    <div className="size-2 rounded-full bg-gold-400 flex-shrink-0" />
                    <span>In Progress: {inProgressCount}</span>
                  </span>
                </div>
              </div>

              {/* Application List */}
              <div className="divide-y divide-gray-100">
                {applications.length === 0 ? (
                  <div className="py-8 text-center sm:py-12">
                    <Briefcase className="mx-auto size-8 text-gray-300 sm:size-10" />
                    <p className="mt-3 text-sm text-gray-500 sm:text-base">No applications yet</p>
                    <p className="mt-1 text-xs text-gray-400 sm:text-sm">Browse jobs to start applying</p>
                    <Link href="/crew/jobs">
                      <Button variant="primary" size="sm" className="mt-4 sm:mt-4">
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
                            <h4 className="font-medium text-navy-900 text-sm sm:text-base line-clamp-2 break-words" title={app.position}>
                              {app.position}
                            </h4>
                            <p
                              className="mt-0.5 text-xs sm:text-sm text-gray-500 line-clamp-1"
                              title={app.vesselName || "Employer TBA"}
                            >
                              {app.vesselName || "Employer TBA"}
                            </p>
                          </div>
                        </div>

                        <div className="flex shrink-0 items-center justify-between gap-2 pl-11 sm:justify-end sm:gap-6 sm:pl-0">
                          <p className="text-xs text-gray-400 whitespace-nowrap">Applied {formatDate(app.appliedDate)}</p>
                          <ApplicationStatus status={app.status} />
                        </div>
                      </Link>
                    );
                  })
                )}
              </div>

              {applications.length > 5 && (
                <div className="border-t border-gray-100 px-4 py-3 sm:px-6">
                  <Link
                    href="/crew/applications"
                    className="flex items-center justify-center gap-1 text-xs font-medium text-gold-600 hover:text-gold-700 sm:text-sm"
                  >
                    View all {applications.length} applications
                    <ChevronRight className="size-3 sm:size-4" />
                  </Link>
                </div>
              )}
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-3 sm:space-y-6">
            {/* Job Preferences Card */}
            <PreferencesSummaryCard preferences={preferences} />

            {/* Documents Summary Card */}
            <DocumentsSummaryCard documents={documents} />

            {/* Profile Strength Card */}
            <div className="rounded-xl border border-gray-200 bg-white p-4 sm:p-6">
              <div className="mb-3 sm:mb-4 flex items-center gap-2 sm:gap-3">
                <Award className="size-5 sm:size-6 text-gold-500 flex-shrink-0" />
                <div className="min-w-0 flex-1">
                  <h2 className="text-lg sm:text-2xl font-serif font-medium text-navy-800">Profile Strength</h2>
                  <p className="text-xs text-gray-500">Complete to get better matches</p>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="mb-4">
                <div className="mb-2 flex items-center justify-between text-xs sm:text-sm">
                  <span className="font-medium text-navy-900">{profileCompleteness}% Complete</span>
                  <span className="text-gray-500">100%</span>
                </div>
                <div className="h-2.5 sm:h-3 overflow-hidden rounded-full bg-gray-200">
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
                      className="flex w-full items-center justify-between rounded-lg border border-gray-200 bg-white p-2.5 sm:p-3 text-left transition-colors hover:border-gold-300 hover:bg-gold-50"
                    >
                      <div className="flex items-center gap-2.5 sm:gap-3 min-w-0 flex-1">
                        <div className="flex size-7 sm:size-8 items-center justify-center rounded-full bg-gray-100 text-gray-500 flex-shrink-0">
                          {getProfileActionIcon(action.id)}
                        </div>
                        <span className="text-xs sm:text-sm font-medium text-navy-900 truncate">{action.label}</span>
                      </div>
                      <span className="rounded-full bg-gold-100 px-2 py-0.5 text-xs font-bold text-gold-700 flex-shrink-0 ml-2">
                        +{action.percentageBoost}%
                      </span>
                    </Link>
                  ))}
                </div>
              )}

              {profileCompleteness >= 95 && (
                <div className="flex items-center gap-2 rounded-lg bg-success-50 p-3">
                  <CheckCircle2 className="size-4 sm:size-5 text-success-600 flex-shrink-0" />
                  <span className="text-xs sm:text-sm font-medium text-success-700">Your profile is complete!</span>
                </div>
              )}
            </div>

            {/* Alerts Section */}
            <div className="rounded-xl border border-gray-200 bg-white p-4 sm:p-6">
              <div className="mb-3 sm:mb-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Bell className="size-4 sm:size-5 text-navy-600 flex-shrink-0" />
                  <h2 className="text-lg sm:text-2xl font-serif font-medium text-navy-800">Alerts</h2>
                </div>
                {alerts.length > 0 && (
                  <span className="flex size-5 items-center justify-center rounded-full bg-error-500 text-xs font-bold text-white flex-shrink-0">
                    {alerts.length}
                  </span>
                )}
              </div>

              {alerts.length === 0 ? (
                <div className="py-4 text-center">
                  <CheckCircle2 className="mx-auto size-6 sm:size-8 text-success-400" />
                  <p className="mt-2 text-xs sm:text-sm text-gray-500">All caught up! No alerts.</p>
                </div>
              ) : (
                <div className="space-y-2 sm:space-y-3">
                  {alerts.map((alert) => (
                    <div
                      key={alert.id}
                      className={cn(
                        "flex items-start gap-2.5 sm:gap-3 rounded-lg p-2.5 sm:p-3",
                        alert.urgent ? "bg-warning-50" : "bg-gray-50"
                      )}
                    >
                      <AlertIcon type={alert.type} />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-2">
                          <h4 className="text-xs sm:text-sm font-medium text-navy-900 break-words">{alert.title}</h4>
                          <span className="shrink-0 text-[10px] sm:text-xs text-gray-400 ml-2">
                            <RelativeTime dateStr={alert.date} />
                          </span>
                        </div>
                        <p className="mt-0.5 text-xs text-gray-600 break-words">{alert.description}</p>
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
            <div className="rounded-xl border border-gray-200 bg-white p-4 sm:p-6">
              <h2 className="mb-3 sm:mb-4 text-lg sm:text-2xl font-serif font-medium text-navy-800">Quick Actions</h2>
              <div className="space-y-2">
                <a
                  href="#availability"
                  className="flex w-full items-center gap-2.5 sm:gap-3 rounded-lg border border-gray-200 p-2.5 sm:p-3 text-left transition-colors hover:border-gold-300 hover:bg-gold-50"
                >
                  <div className="flex size-9 sm:size-10 items-center justify-center rounded-full bg-success-100 flex-shrink-0">
                    <RefreshCw className="size-4 sm:size-5 text-success-600" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs sm:text-sm font-medium text-navy-900">Update Availability</p>
                    <p className="text-[10px] sm:text-xs text-gray-500 line-clamp-1">Let employers know when you're free</p>
                  </div>
                </a>

                <Link
                  href="/crew/documents#cv"
                  className="flex w-full items-center gap-2.5 sm:gap-3 rounded-lg border border-gray-200 p-2.5 sm:p-3 text-left transition-colors hover:border-gold-300 hover:bg-gold-50"
                >
                  <div className="flex size-9 sm:size-10 items-center justify-center rounded-full bg-navy-100 flex-shrink-0">
                    <Upload className="size-4 sm:size-5 text-navy-600" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs sm:text-sm font-medium text-navy-900">Upload New CV</p>
                    <p className="text-[10px] sm:text-xs text-gray-500 line-clamp-1">Keep your resume up to date</p>
                  </div>
                </Link>

                <Link
                  href="/crew/profile/edit"
                  className="flex w-full items-center gap-2.5 sm:gap-3 rounded-lg border border-gray-200 p-2.5 sm:p-3 text-left transition-colors hover:border-gold-300 hover:bg-gold-50"
                >
                  <div className="flex size-9 sm:size-10 items-center justify-center rounded-full bg-gold-100 flex-shrink-0">
                    <Edit3 className="size-4 sm:size-5 text-gold-600" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs sm:text-sm font-medium text-navy-900">Edit Profile</p>
                    <p className="text-[10px] sm:text-xs text-gray-500 line-clamp-1">Update your experience and skills</p>
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
