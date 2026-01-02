"use client";

import * as React from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ChevronLeft,
  Loader2,
  Send,
  Clock,
  CheckCircle2,
  XCircle,
  Calendar,
  User,
  Eye,
  MessageSquare,
  Mail,
  Phone,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  Building2,
  Filter,
  Search,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { VerificationBadge, type VerificationTier } from "@/components/ui/verification-badge";
import { cn } from "@/lib/utils";

// Types
type ApplicationStage =
  | "shortlisted"
  | "submitted"
  | "reviewing"
  | "interview"
  | "offer"
  | "placed"
  | "rejected"
  | "withdrawn";

interface Application {
  id: string;
  candidate_id: string;
  stage: ApplicationStage;
  applied_at: string;
  submitted_at?: string;
  interview_date?: string;
  client_feedback?: string;
  internal_notes?: string;
  rejection_reason?: string;
  candidate: {
    id: string;
    first_name: string;
    last_name: string;
    email?: string;
    phone?: string;
    photo_url?: string;
    primary_position?: string;
    verification_tier: string;
  };
}

interface Job {
  id: string;
  title: string;
  vessel_name?: string;
  client?: {
    id: string;
    name: string;
  };
}

// Stage configuration
const stageConfig: Record<
  ApplicationStage,
  { label: string; color: string; bgColor: string; icon: React.ReactNode }
> = {
  shortlisted: {
    label: "Shortlisted",
    color: "text-blue-700",
    bgColor: "bg-blue-100",
    icon: <User className="size-4" />,
  },
  submitted: {
    label: "Submitted",
    color: "text-purple-700",
    bgColor: "bg-purple-100",
    icon: <Send className="size-4" />,
  },
  reviewing: {
    label: "Reviewing",
    color: "text-amber-700",
    bgColor: "bg-amber-100",
    icon: <Eye className="size-4" />,
  },
  interview: {
    label: "Interview",
    color: "text-gold-700",
    bgColor: "bg-gold-100",
    icon: <Calendar className="size-4" />,
  },
  offer: {
    label: "Offer Made",
    color: "text-emerald-700",
    bgColor: "bg-emerald-100",
    icon: <CheckCircle2 className="size-4" />,
  },
  placed: {
    label: "Placed",
    color: "text-success-700",
    bgColor: "bg-success-100",
    icon: <CheckCircle2 className="size-4" />,
  },
  rejected: {
    label: "Rejected",
    color: "text-error-700",
    bgColor: "bg-error-100",
    icon: <XCircle className="size-4" />,
  },
  withdrawn: {
    label: "Withdrawn",
    color: "text-gray-700",
    bgColor: "bg-gray-100",
    icon: <XCircle className="size-4" />,
  },
};

// Helper functions
function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatDateTime(dateString: string): string {
  return new Date(dateString).toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getTimeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (seconds < 60) return "Just now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
  return formatDate(dateString);
}

// Submission Row Component
function SubmissionRow({
  application,
  onUpdateStage,
  onAddFeedback,
}: {
  application: Application;
  onUpdateStage: (stage: ApplicationStage) => void;
  onAddFeedback: (feedback: string) => void;
}) {
  const [isExpanded, setIsExpanded] = React.useState(false);
  const [feedback, setFeedback] = React.useState(application.client_feedback || "");
  const [isUpdating, setIsUpdating] = React.useState(false);

  const stage = stageConfig[application.stage];
  const candidate = application.candidate;
  const initials = `${candidate.first_name[0]}${candidate.last_name[0]}`;

  const verificationMap: Record<string, VerificationTier> = {
    basic: "basic",
    identity: "identity",
    verified: "verified",
    premium: "premium",
  };

  const handleStageChange = async (newStage: ApplicationStage) => {
    setIsUpdating(true);
    await onUpdateStage(newStage);
    setIsUpdating(false);
  };

  return (
    <div className="border-b border-gray-100 last:border-b-0">
      {/* Main Row */}
      <div className="p-4 flex items-center gap-4 hover:bg-gray-50">
        {/* Candidate Photo */}
        <div className="relative shrink-0">
          {candidate.photo_url ? (
            <img
              src={candidate.photo_url}
              alt={`${candidate.first_name} ${candidate.last_name}`}
              className="size-10 rounded-full object-cover"
            />
          ) : (
            <div className="flex size-10 items-center justify-center rounded-full bg-navy-100 text-sm font-semibold text-navy-600">
              {initials}
            </div>
          )}
          <div className="absolute -bottom-1 -right-1">
            <VerificationBadge
              tier={verificationMap[candidate.verification_tier] || "basic"}
              size="sm"
            />
          </div>
        </div>

        {/* Candidate Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <Link
              href={`/candidates/${candidate.id}`}
              className="font-medium text-navy-900 hover:text-navy-700"
            >
              {candidate.first_name} {candidate.last_name}
            </Link>
          </div>
          <p className="text-sm text-gray-600">{candidate.primary_position || "Crew"}</p>
        </div>

        {/* Stage Badge */}
        <div className="w-32">
          <span
            className={cn(
              "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium",
              stage.bgColor,
              stage.color
            )}
          >
            {stage.icon}
            {stage.label}
          </span>
        </div>

        {/* Timestamps */}
        <div className="w-40 text-sm text-gray-500">
          {application.submitted_at ? (
            <div className="flex items-center gap-1">
              <Send className="size-3.5" />
              {getTimeAgo(application.submitted_at)}
            </div>
          ) : (
            <div className="flex items-center gap-1">
              <Clock className="size-3.5" />
              {getTimeAgo(application.applied_at)}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <Link href={`/candidates/${candidate.id}`}>
            <Button variant="ghost" size="sm">
              <Eye className="size-4" />
            </Button>
          </Link>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-2 rounded hover:bg-gray-100"
          >
            {isExpanded ? (
              <ChevronUp className="size-4 text-gray-500" />
            ) : (
              <ChevronDown className="size-4 text-gray-500" />
            )}
          </button>
        </div>
      </div>

      {/* Expanded Details */}
      {isExpanded && (
        <div className="px-4 pb-4 bg-gray-50">
          <div className="ml-14 space-y-4">
            {/* Stage Update */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Update Status
              </label>
              <div className="flex flex-wrap gap-2">
                {(Object.keys(stageConfig) as ApplicationStage[]).map((s) => {
                  const config = stageConfig[s];
                  const isActive = s === application.stage;
                  return (
                    <button
                      key={s}
                      onClick={() => handleStageChange(s)}
                      disabled={isActive || isUpdating}
                      className={cn(
                        "inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-medium transition-colors",
                        isActive
                          ? cn(config.bgColor, config.color, "ring-2 ring-offset-1 ring-current")
                          : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-100"
                      )}
                    >
                      {config.icon}
                      {config.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Contact Info */}
            <div className="flex items-center gap-4">
              {candidate.email && (
                <a
                  href={`mailto:${candidate.email}`}
                  className="inline-flex items-center gap-1 text-sm text-navy-600 hover:text-navy-800"
                >
                  <Mail className="size-4" />
                  {candidate.email}
                </a>
              )}
              {candidate.phone && (
                <a
                  href={`tel:${candidate.phone}`}
                  className="inline-flex items-center gap-1 text-sm text-navy-600 hover:text-navy-800"
                >
                  <Phone className="size-4" />
                  {candidate.phone}
                </a>
              )}
            </div>

            {/* Client Feedback */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Client Feedback
              </label>
              <textarea
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                onBlur={() => {
                  if (feedback !== application.client_feedback) {
                    onAddFeedback(feedback);
                  }
                }}
                placeholder="Add client feedback..."
                rows={2}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-gold-500 focus:outline-none focus:ring-2 focus:ring-gold-500/20"
              />
            </div>

            {/* Timeline */}
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-2">Timeline</h4>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2 text-gray-600">
                  <Clock className="size-4 text-gray-400" />
                  Added to shortlist: {formatDateTime(application.applied_at)}
                </div>
                {application.submitted_at && (
                  <div className="flex items-center gap-2 text-gray-600">
                    <Send className="size-4 text-gray-400" />
                    Submitted to client: {formatDateTime(application.submitted_at)}
                  </div>
                )}
                {application.interview_date && (
                  <div className="flex items-center gap-2 text-gray-600">
                    <Calendar className="size-4 text-gray-400" />
                    Interview: {formatDateTime(application.interview_date)}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Main Page Component
export default function SubmissionsPage() {
  const params = useParams();
  const router = useRouter();
  const jobId = params.id as string;

  // State
  const [job, setJob] = React.useState<Job | null>(null);
  const [applications, setApplications] = React.useState<Application[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [stageFilter, setStageFilter] = React.useState<ApplicationStage | "all">("all");
  const [searchQuery, setSearchQuery] = React.useState("");

  // Fetch data
  React.useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        setError(null);

        // Fetch job and applications in parallel
        const [jobRes, appsRes] = await Promise.all([
          fetch(`/api/jobs/${jobId}`),
          fetch(`/api/jobs/${jobId}/applications?limit=100`),
        ]);

        if (!jobRes.ok) throw new Error("Failed to fetch job");
        if (!appsRes.ok) throw new Error("Failed to fetch applications");

        const jobData = await jobRes.json();
        const appsData = await appsRes.json();

        setJob(jobData.data);
        setApplications(appsData.data || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Something went wrong");
      } finally {
        setLoading(false);
      }
    }

    if (jobId) {
      fetchData();
    }
  }, [jobId]);

  // Update application stage
  const handleUpdateStage = async (applicationId: string, stage: ApplicationStage) => {
    try {
      const response = await fetch(`/api/applications/${applicationId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stage }),
      });

      if (!response.ok) {
        throw new Error("Failed to update stage");
      }

      // Update local state
      setApplications((prev) =>
        prev.map((app) =>
          app.id === applicationId ? { ...app, stage } : app
        )
      );
    } catch (err) {
      console.error("Failed to update stage:", err);
    }
  };

  // Add feedback
  const handleAddFeedback = async (applicationId: string, feedback: string) => {
    try {
      const response = await fetch(`/api/applications/${applicationId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ client_feedback: feedback }),
      });

      if (!response.ok) {
        throw new Error("Failed to add feedback");
      }

      // Update local state
      setApplications((prev) =>
        prev.map((app) =>
          app.id === applicationId ? { ...app, client_feedback: feedback } : app
        )
      );
    } catch (err) {
      console.error("Failed to add feedback:", err);
    }
  };

  // Filter applications
  const filteredApplications = applications.filter((app) => {
    // Stage filter
    if (stageFilter !== "all" && app.stage !== stageFilter) {
      return false;
    }

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const candidate = app.candidate;
      const fullName = `${candidate.first_name} ${candidate.last_name}`.toLowerCase();
      const position = (candidate.primary_position || "").toLowerCase();
      return fullName.includes(query) || position.includes(query);
    }

    return true;
  });

  // Stage counts
  const stageCounts = applications.reduce((acc, app) => {
    acc[app.stage] = (acc[app.stage] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="size-8 animate-spin text-gold-500 mx-auto mb-4" />
          <p className="text-gray-600">Loading submissions...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="size-12 text-error-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-navy-900 mb-2">Error</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <Button variant="secondary" onClick={() => router.back()}>
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto max-w-6xl px-6 py-6">
          <Link
            href={`/jobs/${jobId}`}
            className="inline-flex items-center gap-1 text-sm text-gray-600 hover:text-navy-800 mb-4"
          >
            <ChevronLeft className="size-4" />
            Back to Job
          </Link>

          <div className="flex items-start justify-between">
            <div>
              <h1 className="font-serif text-3xl font-semibold text-navy-900">
                Submissions
              </h1>
              {job && (
                <p className="mt-1 text-sm text-gray-600">
                  {job.title}
                  {job.vessel_name && <> • {job.vessel_name}</>}
                  {job.client && <> • {job.client.name}</>}
                </p>
              )}
            </div>

            <div className="flex items-center gap-3">
              <Link href={`/jobs/match?jobId=${jobId}`}>
                <Button variant="secondary">Run AI Match</Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Filters */}
      <div className="border-b border-gray-200 bg-white">
        <div className="mx-auto max-w-6xl px-6 py-4">
          <div className="flex flex-wrap items-center gap-4">
            {/* Search */}
            <div className="relative flex-1 min-w-[200px] max-w-md">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search candidates..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-10 w-full rounded-lg border border-gray-300 pl-10 pr-4 text-sm focus:border-gold-500 focus:outline-none focus:ring-2 focus:ring-gold-500/20"
              />
            </div>

            {/* Stage Filters */}
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setStageFilter("all")}
                className={cn(
                  "rounded-full px-3 py-1.5 text-sm font-medium transition-colors",
                  stageFilter === "all"
                    ? "bg-navy-100 text-navy-800"
                    : "text-gray-600 hover:bg-gray-100"
                )}
              >
                All ({applications.length})
              </button>
              {(Object.keys(stageConfig) as ApplicationStage[]).map((stage) => {
                const count = stageCounts[stage] || 0;
                if (count === 0) return null;
                const config = stageConfig[stage];
                return (
                  <button
                    key={stage}
                    onClick={() => setStageFilter(stage)}
                    className={cn(
                      "rounded-full px-3 py-1.5 text-sm font-medium transition-colors",
                      stageFilter === stage
                        ? cn(config.bgColor, config.color)
                        : "text-gray-600 hover:bg-gray-100"
                    )}
                  >
                    {config.label} ({count})
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <main className="mx-auto max-w-6xl px-6 py-6">
        {filteredApplications.length === 0 ? (
          <div className="rounded-xl border border-dashed border-gray-300 bg-white p-12 text-center">
            <User className="mx-auto size-12 text-gray-300 mb-4" />
            <h3 className="text-lg font-semibold text-navy-900 mb-2">
              {applications.length === 0
                ? "No submissions yet"
                : "No matching submissions"}
            </h3>
            <p className="text-sm text-gray-600 mb-6">
              {applications.length === 0
                ? "Run AI matching to find candidates or search manually"
                : "Try adjusting your filters"}
            </p>
            {applications.length === 0 && (
              <div className="flex items-center justify-center gap-3">
                <Link href={`/jobs/match?jobId=${jobId}`}>
                  <Button variant="primary">Run AI Match</Button>
                </Link>
                <Link href="/candidates/search">
                  <Button variant="secondary">Search Candidates</Button>
                </Link>
              </div>
            )}
          </div>
        ) : (
          <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
            {/* Table Header */}
            <div className="flex items-center gap-4 border-b border-gray-200 bg-gray-50 px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
              <div className="flex-1">Candidate</div>
              <div className="w-32">Status</div>
              <div className="w-40">Submitted</div>
              <div className="w-20"></div>
            </div>

            {/* Rows */}
            {filteredApplications.map((application) => (
              <SubmissionRow
                key={application.id}
                application={application}
                onUpdateStage={(stage) => handleUpdateStage(application.id, stage)}
                onAddFeedback={(feedback) => handleAddFeedback(application.id, feedback)}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
