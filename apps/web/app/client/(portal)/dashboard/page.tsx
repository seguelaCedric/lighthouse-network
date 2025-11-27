"use client";

import * as React from "react";
import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Search,
  Users,
  Calendar,
  Award,
  ChevronRight,
  Clock,
  Eye,
  MessageSquare,
  Video,
  Plus,
  FileText,
  TrendingUp,
  Briefcase,
  Ship,
  Phone,
  Mail,
  MapPin,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { VerificationBadge, type VerificationTier } from "@/components/ui/verification-badge";
import { cn } from "@/lib/utils";

// Types
interface DashboardData {
  client: {
    name: string;
    contactName: string | null;
    vesselName: string | null;
    vesselType: string | null;
    vesselSize: number | null;
  };
  stats: {
    activeSearches: number;
    candidatesShortlisted: number;
    interviewsScheduled: number;
    successfulPlacements: number;
  };
  activeSearches: {
    id: string;
    position: string;
    status: string;
    urgent: boolean;
    daysOpen: number;
    candidatesInPipeline: number;
    shortlisted: number;
  }[];
  shortlistedCandidates: {
    id: string;
    firstName: string;
    lastInitial: string;
    position: string;
    verificationTier: VerificationTier;
    matchPercentage: number;
    yearsExperience: number;
    currentLocation: string;
    sharedDate: string;
    status: string;
    recruiterNote?: string;
  }[];
  upcomingInterviews: {
    id: string;
    candidateName: string;
    position: string;
    dateTime: string;
    type: string;
    meetingLink?: string;
    notes?: string;
  }[];
}

// Helper functions
function formatDate(date: Date): string {
  return date.toLocaleDateString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatRelativeDate(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  return `${diffDays} days ago`;
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase();
}

// Status Badge Component
function SearchStatusBadge({ status }: { status: string }) {
  const config: Record<string, { label: string; className: string }> = {
    open: { label: "Open", className: "bg-blue-100 text-blue-700" },
    shortlisting: { label: "Shortlisting", className: "bg-purple-100 text-purple-700" },
    interviewing: { label: "Interviewing", className: "bg-warning-100 text-warning-700" },
    offer: { label: "Offer Stage", className: "bg-orange-100 text-orange-700" },
    filled: { label: "Filled", className: "bg-success-100 text-success-700" },
  };

  const { label, className } = config[status] || config.open;
  return (
    <span className={cn("rounded-full px-2.5 py-1 text-xs font-medium", className)}>{label}</span>
  );
}

// Candidate Status Badge Component
function CandidateStatusBadge({ status }: { status: string }) {
  const config: Record<string, { label: string; className: string }> = {
    pending_review: { label: "Pending Review", className: "bg-warning-100 text-warning-700" },
    interview_requested: { label: "Interview Requested", className: "bg-navy-100 text-navy-700" },
    feedback_given: { label: "Feedback Given", className: "bg-success-100 text-success-700" },
  };

  const { label, className } = config[status] || config.pending_review;
  return (
    <span className={cn("rounded-full px-2.5 py-1 text-xs font-medium", className)}>{label}</span>
  );
}

// Interview Type Icon Component
function InterviewTypeIcon({ type }: { type: string }) {
  switch (type) {
    case "video":
      return <Video className="size-4 text-navy-500" />;
    case "phone":
      return <Phone className="size-4 text-navy-500" />;
    case "in_person":
      return <Users className="size-4 text-navy-500" />;
    default:
      return <Video className="size-4 text-navy-500" />;
  }
}

// Stat Card Component
function StatCard({
  icon,
  label,
  value,
  trend,
  trendLabel,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  trend?: "up" | "down";
  trendLabel?: string;
}) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5">
      <div className="flex items-start justify-between">
        <div className="flex size-10 items-center justify-center rounded-lg bg-navy-100">
          {icon}
        </div>
        {trend && (
          <div
            className={cn(
              "flex items-center gap-1 text-xs font-medium",
              trend === "up" ? "text-success-600" : "text-error-600"
            )}
          >
            <TrendingUp className={cn("size-3", trend === "down" && "rotate-180")} />
            {trendLabel}
          </div>
        )}
      </div>
      <p className="mt-4 text-5xl font-bold text-navy-800">{value}</p>
      <p className="mt-1 text-sm text-gray-500">{label}</p>
    </div>
  );
}

// Active Search Card Component
function ActiveSearchCard({
  search,
}: {
  search: DashboardData["activeSearches"][0];
}) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 transition-all hover:border-gray-300 hover:shadow-sm">
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-navy-900">{search.position}</h3>
            {search.urgent && (
              <span className="rounded-full bg-error-100 px-2 py-0.5 text-xs font-bold text-error-600">
                URGENT
              </span>
            )}
          </div>
        </div>
        <SearchStatusBadge status={search.status} />
      </div>

      <div className="mt-4 grid grid-cols-3 gap-4 rounded-lg bg-gray-50 p-3">
        <div className="text-center">
          <p className="text-2xl font-bold text-navy-900">{search.candidatesInPipeline}</p>
          <p className="text-xs text-gray-500">In Pipeline</p>
        </div>
        <div className="text-center border-x border-gray-200">
          <p className="text-2xl font-bold text-gold-600">{search.shortlisted}</p>
          <p className="text-xs text-gray-500">Shortlisted</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-navy-900">{search.daysOpen}</p>
          <p className="text-xs text-gray-500">Days Open</p>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between">
        <div className="flex items-center gap-1 text-xs text-gray-400">
          <Clock className="size-3" />
          Opened {search.daysOpen} days ago
        </div>
        <Link href={`/client/shortlist/${search.id}`}>
          <Button variant="primary" size="sm">
            View Candidates
            <ChevronRight className="ml-1 size-4" />
          </Button>
        </Link>
      </div>
    </div>
  );
}

// Shortlisted Candidate Card Component
function ShortlistedCandidateCard({
  candidate,
}: {
  candidate: DashboardData["shortlistedCandidates"][0];
}) {
  const initials = `${candidate.firstName[0]}${candidate.lastInitial}`;

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 transition-all hover:border-gray-300 hover:shadow-sm">
      <div className="flex items-start gap-4">
        {/* Photo */}
        <div className="relative shrink-0">
          <div className="flex size-14 items-center justify-center rounded-full bg-gradient-to-br from-navy-100 to-navy-200 text-lg font-semibold text-navy-600 ring-2 ring-gray-100">
            {initials}
          </div>
          <div className="absolute -bottom-1 -right-1">
            <VerificationBadge tier={candidate.verificationTier} size="sm" />
          </div>
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between">
            <div>
              <h4 className="font-semibold text-navy-900">
                {candidate.firstName} {candidate.lastInitial}.
              </h4>
              <p className="text-sm text-gray-600">{candidate.position}</p>
            </div>
            <div className="flex items-center gap-1 rounded-full bg-gold-100 px-2 py-0.5 text-xs font-bold text-gold-700">
              <TrendingUp className="size-3" />
              {candidate.matchPercentage}%
            </div>
          </div>

          <div className="mt-2 flex items-center gap-4 text-xs text-gray-500">
            <span>{candidate.yearsExperience} years exp</span>
            <span className="flex items-center gap-1">
              <MapPin className="size-3" />
              {candidate.currentLocation}
            </span>
          </div>
        </div>
      </div>

      {/* Recruiter Note */}
      {candidate.recruiterNote && (
        <div className="mt-3 rounded-lg bg-navy-50 p-3">
          <p className="text-xs font-medium text-navy-700">Recruiter's Note:</p>
          <p className="mt-1 text-sm text-navy-600">{candidate.recruiterNote}</p>
        </div>
      )}

      {/* Footer */}
      <div className="mt-4 flex items-center justify-between border-t border-gray-100 pt-4">
        <div className="flex items-center gap-2">
          <CandidateStatusBadge status={candidate.status} />
          <span className="text-xs text-gray-400">
            Shared {formatRelativeDate(candidate.sharedDate)}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm">
            <Eye className="size-4" />
          </Button>
          {candidate.status === "pending_review" && (
            <>
              <Button variant="secondary" size="sm">
                <Calendar className="mr-1 size-4" />
                Interview
              </Button>
              <Button variant="ghost" size="sm">
                <MessageSquare className="size-4" />
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// Interview Card Component
function InterviewCard({ interview }: { interview: DashboardData["upcomingInterviews"][0] }) {
  const dateTime = new Date(interview.dateTime);
  const isToday = new Date().toDateString() === dateTime.toDateString();
  const isTomorrow =
    new Date(Date.now() + 86400000).toDateString() === dateTime.toDateString();

  return (
    <div
      className={cn(
        "rounded-xl border p-4 transition-all",
        isToday
          ? "border-gold-300 bg-gold-50"
          : "border-gray-200 bg-white hover:border-gray-300"
      )}
    >
      <div className="flex items-center gap-3">
        <div className="shrink-0 text-center">
          <p
            className={cn(
              "text-xs font-medium",
              isToday ? "text-gold-600" : isTomorrow ? "text-navy-600" : "text-gray-500"
            )}
          >
            {isToday ? "TODAY" : isTomorrow ? "TOMORROW" : formatDate(dateTime)}
          </p>
          <p className="text-lg font-bold text-navy-900">{formatTime(dateTime)}</p>
        </div>

        <div className="h-10 w-px bg-gray-200" />

        <div className="flex flex-1 items-center gap-2 min-w-0">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-navy-100 text-sm font-semibold text-navy-600">
            {getInitials(interview.candidateName)}
          </div>
          <div className="min-w-0">
            <h4 className="truncate font-medium text-navy-900">{interview.candidateName}</h4>
            <p className="truncate text-xs text-gray-500">{interview.position}</p>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-1.5 rounded-full bg-gray-100 px-2 py-1">
          <InterviewTypeIcon type={interview.type} />
          <span className="text-xs font-medium capitalize text-gray-700">
            {interview.type.replace("_", " ")}
          </span>
        </div>
      </div>

      {interview.meetingLink && (
        <div className="mt-3 flex items-center justify-end gap-2 border-t border-gray-100 pt-3">
          <a
            href={interview.meetingLink}
            target="_blank"
            rel="noopener noreferrer"
          >
            <Button variant="primary" size="sm">
              <Video className="mr-1 size-4" />
              Join
            </Button>
          </a>
        </div>
      )}
    </div>
  );
}

// Loading skeleton
function DashboardSkeleton() {
  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 h-20 animate-pulse rounded-xl bg-gray-200" />
        <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-32 animate-pulse rounded-xl bg-gray-200" />
          ))}
        </div>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            <div className="h-96 animate-pulse rounded-xl bg-gray-200" />
          </div>
          <div className="h-96 animate-pulse rounded-xl bg-gray-200" />
        </div>
      </div>
    </div>
  );
}

// Main Component
export default function ClientDashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const response = await fetch("/api/client/dashboard");
        if (!response.ok) {
          throw new Error("Failed to fetch dashboard data");
        }
        const result = await response.json();
        setData(result.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();
  }, []);

  if (loading) {
    return <DashboardSkeleton />;
  }

  if (error || !data) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500">{error || "Failed to load dashboard"}</p>
          <Button
            variant="secondary"
            className="mt-4"
            onClick={() => window.location.reload()}
          >
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50">
      {/* Header */}
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto max-w-7xl px-6 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex size-14 items-center justify-center rounded-xl bg-gradient-to-br from-navy-600 to-navy-800 text-xl font-bold text-white">
                <Ship className="size-7" />
              </div>
              <div>
                <div className="flex items-center gap-3">
                  <h1 className="text-4xl font-serif font-semibold text-navy-800">
                    {data.client.vesselName || data.client.name}
                  </h1>
                </div>
                {data.client.contactName && (
                  <p className="text-sm text-gray-500">
                    Welcome back, {data.client.contactName}
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Link href="/client/briefs/new">
                <Button variant="primary" leftIcon={<Plus className="size-4" />}>
                  Submit New Brief
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 py-6">
        {/* Stats Row */}
        <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            icon={<Search className="size-5 text-navy-600" />}
            label="Active Searches"
            value={data.stats.activeSearches}
          />
          <StatCard
            icon={<Users className="size-5 text-navy-600" />}
            label="Candidates Shortlisted"
            value={data.stats.candidatesShortlisted}
          />
          <StatCard
            icon={<Calendar className="size-5 text-navy-600" />}
            label="Interviews Scheduled"
            value={data.stats.interviewsScheduled}
          />
          <StatCard
            icon={<Award className="size-5 text-navy-600" />}
            label="Successful Placements"
            value={data.stats.successfulPlacements}
          />
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Left Column - Active Searches */}
          <div className="lg:col-span-2 space-y-6">
            {/* Active Searches Section */}
            <div>
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-2xl font-serif font-medium text-navy-800">Active Searches</h2>
                <Link
                  href="/client/searches"
                  className="flex items-center gap-1 text-sm font-medium text-gold-600 hover:text-gold-700"
                >
                  View all
                  <ChevronRight className="size-4" />
                </Link>
              </div>

              {data.activeSearches.length > 0 ? (
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
                  {data.activeSearches.map((search) => (
                    <ActiveSearchCard key={search.id} search={search} />
                  ))}
                </div>
              ) : (
                <div className="rounded-xl border border-dashed border-gray-300 bg-white p-8 text-center">
                  <Search className="mx-auto size-12 text-gray-300" />
                  <h3 className="mt-4 font-medium text-navy-900">No active searches</h3>
                  <p className="mt-2 text-sm text-gray-500">
                    Submit a brief to start finding your perfect crew
                  </p>
                  <Link href="/client/briefs/new">
                    <Button variant="primary" className="mt-4">
                      <Plus className="mr-2 size-4" />
                      Submit New Brief
                    </Button>
                  </Link>
                </div>
              )}
            </div>

            {/* Recent Shortlists Section */}
            {data.shortlistedCandidates.length > 0 && (
              <div>
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="text-2xl font-serif font-medium text-navy-800">Recent Shortlists</h2>
                  <button className="flex items-center gap-1 text-sm font-medium text-gold-600 hover:text-gold-700">
                    View all candidates
                    <ChevronRight className="size-4" />
                  </button>
                </div>

                <div className="space-y-4">
                  {data.shortlistedCandidates.map((candidate) => (
                    <ShortlistedCandidateCard key={candidate.id} candidate={candidate} />
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right Column - Interviews & Quick Actions */}
          <div className="space-y-6">
            {/* Upcoming Interviews */}
            <div className="rounded-xl border border-gray-200 bg-white">
              <div className="border-b border-gray-100 px-5 py-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-serif font-medium text-navy-800">Upcoming Interviews</h2>
                  <span className="rounded-full bg-gold-100 px-2.5 py-0.5 text-xs font-bold text-gold-700">
                    {data.upcomingInterviews.length}
                  </span>
                </div>
              </div>

              <div className="space-y-3 p-4">
                {data.upcomingInterviews.length > 0 ? (
                  data.upcomingInterviews.map((interview) => (
                    <InterviewCard key={interview.id} interview={interview} />
                  ))
                ) : (
                  <p className="py-6 text-center text-sm text-gray-500">
                    No upcoming interviews
                  </p>
                )}
              </div>

              <div className="border-t border-gray-100 p-4">
                <Link href="/client/interviews">
                  <button className="flex w-full items-center justify-center gap-2 rounded-lg border border-gray-200 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50">
                    <Calendar className="size-4" />
                    View Full Calendar
                  </button>
                </Link>
              </div>
            </div>

            {/* Quick Actions Card */}
            <div className="rounded-xl border border-gray-200 bg-white p-5">
              <h2 className="text-2xl font-serif font-medium text-navy-800 mb-4">Quick Actions</h2>
              <div className="space-y-3">
                <Link href="/client/briefs/new">
                  <Button
                    variant="primary"
                    className="w-full justify-start"
                    leftIcon={<FileText className="size-4" />}
                  >
                    Submit New Brief
                  </Button>
                </Link>
                <Button
                  variant="secondary"
                  className="w-full justify-start"
                  leftIcon={<MessageSquare className="size-4" />}
                >
                  Message Recruiter
                </Button>
                <Button
                  variant="secondary"
                  className="w-full justify-start"
                  leftIcon={<Users className="size-4" />}
                >
                  View All Candidates
                </Button>
                <Button
                  variant="ghost"
                  className="w-full justify-start"
                  leftIcon={<Briefcase className="size-4" />}
                >
                  View Past Placements
                </Button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
