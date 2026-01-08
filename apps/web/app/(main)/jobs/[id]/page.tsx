"use client";

import * as React from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ChevronLeft,
  Sparkles,
  Users,
  Clock,
  Ship,
  MapPin,
  Calendar,
  DollarSign,
  CheckCircle2,
  XCircle,
  Loader2,
  Edit3,
  Trash2,
  Eye,
  AlertTriangle,
  UserPlus,
  Inbox,
  Globe,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { VerificationBadge, type VerificationTier } from "@/components/ui/verification-badge";
import { AvailabilityBadge, type AvailabilityStatus } from "@/components/ui/availability-badge";
import { cn } from "@/lib/utils";
import type {
  JobWithStats,
  JobStatus,
  ApplicationStage,
  JobRequirements,
} from "@lighthouse/database";

// Extended types for applications with candidate
interface ApplicationWithCandidate {
  id: string;
  candidate_id: string;
  job_id: string;
  stage: ApplicationStage;
  match_score: number | null;
  ai_assessment: string | null;
  source: string | null;
  applied_at: string;
  candidate: {
    id: string;
    first_name: string;
    last_name: string;
    email: string | null;
    phone: string | null;
    photo_url: string | null;
    primary_position: string | null;
    secondary_position: string | null;
    years_experience: number | null;
    nationality: string | null;
    availability_status: AvailabilityStatus;
    available_from: string | null;
    verification_tier: VerificationTier;
    has_stcw: boolean;
    has_eng1: boolean;
    has_schengen: boolean | null;
    has_b1b2: boolean | null;
    has_c1d: boolean | null;
  };
}

// Status configuration
const statusConfig: Record<JobStatus, { label: string; color: string; bgColor: string }> = {
  draft: { label: "Draft", color: "text-gray-600", bgColor: "bg-gray-100" },
  open: { label: "Open", color: "text-success-600", bgColor: "bg-success-100" },
  shortlist: { label: "Shortlisting", color: "text-blue-600", bgColor: "bg-blue-100" },
  interviewing: { label: "Interviewing", color: "text-purple-600", bgColor: "bg-purple-100" },
  offer: { label: "Offer", color: "text-gold-700", bgColor: "bg-gold-100" },
  filled: { label: "Filled", color: "text-navy-600", bgColor: "bg-navy-100" },
  closed: { label: "Closed", color: "text-gray-500", bgColor: "bg-gray-100" },
};

const stageConfig: Record<ApplicationStage, { label: string; color: string }> = {
  applied: { label: "Applied", color: "bg-gray-200 text-gray-700" },
  screening: { label: "Screening", color: "bg-blue-100 text-blue-700" },
  shortlisted: { label: "Shortlisted", color: "bg-gold-100 text-gold-700" },
  submitted: { label: "Submitted", color: "bg-purple-100 text-purple-700" },
  interview: { label: "Interview", color: "bg-indigo-100 text-indigo-700" },
  offer: { label: "Offer", color: "bg-success-100 text-success-700" },
  placed: { label: "Placed", color: "bg-success-200 text-success-800" },
  rejected: { label: "Rejected", color: "bg-error-100 text-error-700" },
};

// Helper functions
function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatSalary(min: number | null, max: number | null, currency: string): string {
  const symbol = currency === "EUR" ? "€" : currency === "GBP" ? "£" : "$";
  if (!min && !max) return "Not specified";
  if (min && max && min !== max) {
    return `${symbol}${(min / 1000).toFixed(0)}k - ${symbol}${(max / 1000).toFixed(0)}k`;
  }
  if (min) return `${symbol}${(min / 1000).toFixed(0)}k+`;
  if (max) return `Up to ${symbol}${(max / 1000).toFixed(0)}k`;
  return "Not specified";
}

// Application Card Component
function ApplicationCard({
  application,
  onViewProfile,
}: {
  application: ApplicationWithCandidate;
  onViewProfile: () => void;
}) {
  const candidate = application.candidate;
  const initials = `${candidate.first_name[0]}${candidate.last_name[0]}`.toUpperCase();
  const stage = stageConfig[application.stage];

  return (
    <div className="flex items-center gap-4 rounded-lg border border-gray-200 bg-white p-4 hover:border-gray-300 transition-colors">
      {/* Avatar */}
      <div className="relative shrink-0">
        {candidate.photo_url ? (
          <img
            src={candidate.photo_url}
            alt={`${candidate.first_name} ${candidate.last_name}`}
            className="size-12 rounded-full object-cover ring-2 ring-gray-100"
          />
        ) : (
          <div className="flex size-12 items-center justify-center rounded-full bg-gradient-to-br from-navy-100 to-navy-200 text-sm font-semibold text-navy-600 ring-2 ring-gray-100">
            {initials}
          </div>
        )}
        <div className="absolute -bottom-1 -right-1">
          <VerificationBadge tier={candidate.verification_tier as VerificationTier} size="sm" />
        </div>
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <h4 className="font-medium text-navy-900 truncate">
            {candidate.first_name} {candidate.last_name}
          </h4>
          <span className={cn("rounded-full px-2 py-0.5 text-xs font-medium", stage.color)}>
            {stage.label}
          </span>
        </div>
        <p className="text-sm text-gray-600 truncate">
          {candidate.primary_position || "Position not set"}
        </p>
        <div className="mt-1 flex items-center gap-3 text-xs text-gray-500">
          {candidate.years_experience && (
            <span>{candidate.years_experience} years exp</span>
          )}
          <AvailabilityBadge status={candidate.availability_status} className="text-xs" />
        </div>
      </div>

      {/* Score & Actions */}
      <div className="flex items-center gap-3">
        {application.match_score && (
          <div className="text-center">
            <span className="text-lg font-bold text-navy-900">{application.match_score}</span>
            <p className="text-xs text-gray-500">Match</p>
          </div>
        )}
        <Button variant="ghost" size="sm" onClick={onViewProfile}>
          <Eye className="size-4" />
        </Button>
      </div>
    </div>
  );
}

// Requirements Section Component
function RequirementsSection({ requirements, requirementsText }: { requirements: JobRequirements; requirementsText: string | null }) {
  const hasAnyRequirements =
    requirements.experience_years_min ||
    (requirements.certifications_required && requirements.certifications_required.length > 0) ||
    (requirements.certifications_preferred && requirements.certifications_preferred.length > 0) ||
    (requirements.languages_required && requirements.languages_required.length > 0) ||
    (requirements.visas_required && requirements.visas_required.length > 0) ||
    requirements.non_smoker ||
    requirements.no_visible_tattoos ||
    requirements.couple_acceptable ||
    requirementsText;

  if (!hasAnyRequirements) {
    return <p className="text-gray-400 text-sm">No specific requirements set</p>;
  }

  return (
    <div className="space-y-4">
      {requirements.experience_years_min && (
        <div>
          <h4 className="text-sm font-medium text-gray-500">Experience</h4>
          <p className="text-navy-900">
            {requirements.experience_years_min}+ years
            {requirements.experience_years_max && ` (up to ${requirements.experience_years_max})`}
          </p>
        </div>
      )}

      {requirements.certifications_required && requirements.certifications_required.length > 0 && (
        <div>
          <h4 className="text-sm font-medium text-gray-500 mb-2">Required Certifications</h4>
          <div className="flex flex-wrap gap-1">
            {requirements.certifications_required.map((cert) => (
              <span
                key={cert}
                className="rounded-full bg-success-100 px-2 py-0.5 text-xs font-medium text-success-700"
              >
                {cert}
              </span>
            ))}
          </div>
        </div>
      )}

      {requirements.certifications_preferred && requirements.certifications_preferred.length > 0 && (
        <div>
          <h4 className="text-sm font-medium text-gray-500 mb-2">Preferred Certifications</h4>
          <div className="flex flex-wrap gap-1">
            {requirements.certifications_preferred.map((cert) => (
              <span
                key={cert}
                className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-700"
              >
                {cert}
              </span>
            ))}
          </div>
        </div>
      )}

      {requirements.languages_required && requirements.languages_required.length > 0 && (
        <div>
          <h4 className="text-sm font-medium text-gray-500 mb-2">Languages</h4>
          <div className="flex flex-wrap gap-1">
            {requirements.languages_required.map((lang) => (
              <span
                key={lang}
                className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700"
              >
                {lang}
              </span>
            ))}
          </div>
        </div>
      )}

      {requirements.visas_required && requirements.visas_required.length > 0 && (
        <div>
          <h4 className="text-sm font-medium text-gray-500 mb-2">Required Visas</h4>
          <div className="flex flex-wrap gap-1">
            {requirements.visas_required.map((visa) => (
              <span
                key={visa}
                className="rounded-full bg-purple-100 px-2 py-0.5 text-xs font-medium text-purple-700"
              >
                {visa}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Other requirements */}
      {(requirements.non_smoker || requirements.no_visible_tattoos || requirements.couple_acceptable) && (
        <div className="flex flex-wrap gap-3 text-sm">
          {requirements.non_smoker && (
            <span className="text-gray-700">Non-smoker required</span>
          )}
          {requirements.no_visible_tattoos && (
            <span className="text-gray-700">No visible tattoos</span>
          )}
          {requirements.couple_acceptable && (
            <span className="text-gray-700">Couples accepted</span>
          )}
        </div>
      )}

      {requirementsText && (
        <div>
          <h4 className="text-sm font-medium text-gray-500 mb-2">Additional Requirements</h4>
          <p className="text-sm text-gray-700 whitespace-pre-wrap">{requirementsText}</p>
        </div>
      )}
    </div>
  );
}

// Main Page Component
export default function JobDetailPage() {
  const params = useParams();
  const router = useRouter();
  const jobId = params.id as string;

  // State
  const [job, setJob] = React.useState<JobWithStats | null>(null);
  const [applications, setApplications] = React.useState<ApplicationWithCandidate[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [activeStageFilter, setActiveStageFilter] = React.useState<ApplicationStage | "all">("all");
  const [activeTab, setActiveTab] = React.useState<"all" | "applicants" | "matches">("all");

  // Fetch job data
  const fetchJob = React.useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const [jobResponse, appsResponse] = await Promise.all([
        fetch(`/api/jobs/${jobId}`),
        fetch(`/api/jobs/${jobId}/applications?limit=100`),
      ]);

      if (!jobResponse.ok) {
        const errorData = await jobResponse.json();
        throw new Error(errorData.error || "Failed to fetch job");
      }

      const jobData = await jobResponse.json();
      setJob(jobData.data);

      if (appsResponse.ok) {
        const appsData = await appsResponse.json();
        setApplications(appsData.data || []);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }, [jobId]);

  React.useEffect(() => {
    if (jobId) {
      fetchJob();
    }
  }, [jobId, fetchJob]);

  // Filter applications by tab and stage
  const applicationsForTab = React.useMemo(() => {
    if (activeTab === "applicants") {
      return applications.filter((app) => app.source === "job_board");
    }
    if (activeTab === "matches") {
      return applications.filter((app) => app.source !== "job_board");
    }
    return applications;
  }, [applications, activeTab]);

  const filteredApplications = activeStageFilter === "all"
    ? applicationsForTab
    : applicationsForTab.filter((app) => app.stage === activeStageFilter);

  // Count applicants from job board for badge
  const applicantsCount = applications.filter((app) => app.source === "job_board").length;
  const matchesCount = applications.filter((app) => app.source !== "job_board").length;

  // Loading state
  if (loading) {
    return (
      <div className="flex flex-1 items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="size-8 animate-spin text-navy-600" />
          <p className="text-gray-600">Loading job...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error && !job) {
    return (
      <div className="flex flex-1 items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-4 text-center">
          <XCircle className="size-12 text-error-500" />
          <div>
            <h2 className="text-lg font-semibold text-navy-900">Failed to load job</h2>
            <p className="text-sm text-gray-600">{error}</p>
          </div>
          <div className="flex gap-2">
            <Button variant="secondary" onClick={() => router.push("/jobs")}>
              Back to Jobs
            </Button>
            <Button variant="primary" onClick={fetchJob}>
              Try Again
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (!job) return null;

  const status = (job.status && statusConfig[job.status]) || statusConfig.draft;
  const requirements = job.requirements || {};

  return (
    <main className="flex-1 overflow-y-auto">
          {/* Header */}
          <header className="border-b border-gray-200 bg-white">
            <div className="mx-auto max-w-6xl px-6 py-6">
              {/* Breadcrumb */}
              <div className="mb-4">
                <Link
                  href="/jobs"
                  className="inline-flex items-center gap-1 text-sm text-gray-600 hover:text-navy-600"
                >
                  <ChevronLeft className="size-4" />
                  Back to Jobs
                </Link>
              </div>

              {/* Title Row */}
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <h1 className="text-3xl font-serif font-semibold text-navy-900">
                      {job.title}
                    </h1>
                    <span
                      className={cn(
                        "inline-flex items-center rounded-full px-3 py-1 text-sm font-medium",
                        status.bgColor,
                        status.color
                      )}
                    >
                      {status.label}
                    </span>
                    {job.is_urgent && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-error-100 px-2 py-0.5 text-xs font-medium text-error-700">
                        <AlertTriangle className="size-3" />
                        Urgent
                      </span>
                    )}
                  </div>

                  {/* Meta */}
                  <div className="mt-2 flex flex-wrap items-center gap-4 text-sm text-gray-600">
                    {job.vessel_name && (
                      <span className="flex items-center gap-1">
                        <Ship className="size-4" />
                        {job.vessel_name}
                        {job.vessel_size_meters && ` (${job.vessel_size_meters}m)`}
                      </span>
                    )}
                    {job.primary_region && (
                      <span className="flex items-center gap-1">
                        <MapPin className="size-4" />
                        {job.primary_region}
                      </span>
                    )}
                    {job.start_date && (
                      <span className="flex items-center gap-1">
                        <Calendar className="size-4" />
                        Start: {formatDate(job.start_date)}
                      </span>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2">
                  <Link href={`/jobs/match?jobId=${job.id}`}>
                    <Button variant="primary" leftIcon={<Sparkles className="size-4" />}>
                      Run AI Match
                    </Button>
                  </Link>
                  <Button variant="secondary" leftIcon={<Edit3 className="size-4" />}>
                    Edit
                  </Button>
                </div>
              </div>

              {/* Stats Bar */}
              <div className="mt-6 flex items-center gap-6 rounded-lg bg-gray-50 p-4">
                <div className="text-center">
                  <p className="text-2xl font-bold text-navy-900">{job.application_counts.total}</p>
                  <p className="text-xs text-gray-500">Total Candidates</p>
                </div>
                <div className="h-10 w-px bg-gray-200" />
                <div className="text-center">
                  <p className="text-2xl font-bold text-gold-600">
                    {job.application_counts.by_stage.shortlisted}
                  </p>
                  <p className="text-xs text-gray-500">Shortlisted</p>
                </div>
                <div className="h-10 w-px bg-gray-200" />
                <div className="text-center">
                  <p className="text-2xl font-bold text-purple-600">
                    {job.application_counts.by_stage.interview}
                  </p>
                  <p className="text-xs text-gray-500">Interviewing</p>
                </div>
                <div className="h-10 w-px bg-gray-200" />
                <div className="text-center">
                  <p className="text-2xl font-bold text-success-600">
                    {job.application_counts.by_stage.placed}
                  </p>
                  <p className="text-xs text-gray-500">Placed</p>
                </div>
                <div className="flex-1" />
                <div className="text-right">
                  <p className="text-lg font-semibold text-navy-900">
                    {formatSalary(job.salary_min, job.salary_max, job.salary_currency)}
                  </p>
                  <p className="text-xs text-gray-500">/{job.salary_period || "month"}</p>
                </div>
              </div>
            </div>
          </header>

          {/* Body */}
          <div className="mx-auto max-w-6xl px-6 py-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Main Content - Candidates */}
              <div className="lg:col-span-2 space-y-6">
                {/* Candidates Section */}
                <div className="rounded-xl border border-gray-200 bg-white">
                  {/* Main Tabs: All / Applicants / Matches */}
                  <div className="border-b border-gray-200">
                    <div className="flex">
                      <button
                        onClick={() => { setActiveTab("all"); setActiveStageFilter("all"); }}
                        className={cn(
                          "flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors",
                          activeTab === "all"
                            ? "border-navy-600 text-navy-900"
                            : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                        )}
                      >
                        <Users className="size-4" />
                        Pipeline
                        <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs">
                          {applications.length}
                        </span>
                      </button>
                      <button
                        onClick={() => { setActiveTab("applicants"); setActiveStageFilter("all"); }}
                        className={cn(
                          "flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors",
                          activeTab === "applicants"
                            ? "border-navy-600 text-navy-900"
                            : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                        )}
                      >
                        <Globe className="size-4" />
                        Applicants
                        {applicantsCount > 0 && (
                          <span className="rounded-full bg-success-100 text-success-700 px-2 py-0.5 text-xs font-semibold">
                            {applicantsCount}
                          </span>
                        )}
                      </button>
                      <button
                        onClick={() => { setActiveTab("matches"); setActiveStageFilter("all"); }}
                        className={cn(
                          "flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors",
                          activeTab === "matches"
                            ? "border-navy-600 text-navy-900"
                            : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                        )}
                      >
                        <Sparkles className="size-4" />
                        AI Matches
                        <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs">
                          {matchesCount}
                        </span>
                      </button>
                    </div>
                  </div>

                  <div className="border-b border-gray-100 p-4">
                    <div className="flex items-center justify-between">
                      <h2 className="text-lg font-semibold text-navy-900">
                        {activeTab === "applicants" ? "Job Board Applicants" :
                         activeTab === "matches" ? "AI Matched Candidates" : "All Candidates"}
                      </h2>
                      <Link href={`/jobs/match?jobId=${job.id}`}>
                        <Button variant="ghost" size="sm" leftIcon={<Sparkles className="size-4" />}>
                          Find More
                        </Button>
                      </Link>
                    </div>

                    {/* Stage Filter Tabs */}
                    <div className="mt-3 flex gap-2 overflow-x-auto">
                      <button
                        onClick={() => setActiveStageFilter("all")}
                        className={cn(
                          "flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium transition-colors whitespace-nowrap",
                          activeStageFilter === "all"
                            ? "bg-navy-100 text-navy-800"
                            : "text-gray-600 hover:bg-gray-100"
                        )}
                      >
                        All
                        <span className="rounded-full bg-gray-200 px-1.5 py-0.5 text-xs">
                          {applicationsForTab.length}
                        </span>
                      </button>
                      {(["applied", "shortlisted", "interview", "offer", "placed"] as ApplicationStage[]).map((stage) => {
                        const count = applicationsForTab.filter((a) => a.stage === stage).length;
                        if (count === 0) return null;
                        const config = stageConfig[stage];
                        return (
                          <button
                            key={stage}
                            onClick={() => setActiveStageFilter(stage)}
                            className={cn(
                              "flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium transition-colors whitespace-nowrap",
                              activeStageFilter === stage
                                ? "bg-navy-100 text-navy-800"
                                : "text-gray-600 hover:bg-gray-100"
                            )}
                          >
                            {config.label}
                            <span className="rounded-full bg-gray-200 px-1.5 py-0.5 text-xs">
                              {count}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Candidates List */}
                  <div className="p-4">
                    {filteredApplications.length === 0 ? (
                      <div className="py-12 text-center">
                        {activeTab === "applicants" ? (
                          <>
                            <Globe className="mx-auto mb-4 size-12 text-gray-300" />
                            <h3 className="text-lg font-medium text-navy-900 mb-2">No applicants yet</h3>
                            <p className="text-gray-600 mb-6">
                              Candidates who apply via the public job board will appear here
                            </p>
                          </>
                        ) : (
                          <>
                            <Users className="mx-auto mb-4 size-12 text-gray-300" />
                            <h3 className="text-lg font-medium text-navy-900 mb-2">No candidates yet</h3>
                            <p className="text-gray-600 mb-6">
                              Run AI matching to find candidates for this position
                            </p>
                            <Link href={`/jobs/match?jobId=${job.id}`}>
                              <Button variant="primary" leftIcon={<Sparkles className="size-4" />}>
                                Run AI Match
                              </Button>
                            </Link>
                          </>
                        )}
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {filteredApplications.map((application) => (
                          <ApplicationCard
                            key={application.id}
                            application={application}
                            onViewProfile={() => router.push(`/candidates/${application.candidate_id}`)}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Sidebar */}
              <div className="lg:col-span-1 space-y-6">
                {/* Job Details */}
                <div className="rounded-xl border border-gray-200 bg-white p-6">
                  <h3 className="text-sm font-medium text-gray-500 mb-4">Job Details</h3>
                  <div className="space-y-4">
                    {job.position_category && (
                      <div>
                        <p className="text-xs text-gray-500">Category</p>
                        <p className="font-medium text-navy-900 capitalize">{job.position_category}</p>
                      </div>
                    )}
                    {job.contract_type && (
                      <div>
                        <p className="text-xs text-gray-500">Contract Type</p>
                        <p className="font-medium text-navy-900 capitalize">{job.contract_type}</p>
                      </div>
                    )}
                    {job.rotation_schedule && (
                      <div>
                        <p className="text-xs text-gray-500">Rotation</p>
                        <p className="font-medium text-navy-900">{job.rotation_schedule}</p>
                      </div>
                    )}
                    {job.itinerary && (
                      <div>
                        <p className="text-xs text-gray-500">Itinerary</p>
                        <p className="font-medium text-navy-900">{job.itinerary}</p>
                      </div>
                    )}
                    {job.benefits && (
                      <div>
                        <p className="text-xs text-gray-500">Benefits</p>
                        <p className="text-sm text-navy-900">{job.benefits}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Requirements */}
                <div className="rounded-xl border border-gray-200 bg-white p-6">
                  <h3 className="text-sm font-medium text-gray-500 mb-4">Requirements</h3>
                  <RequirementsSection requirements={requirements} requirementsText={job.requirements_text} />
                </div>

                {/* Actions */}
                <div className="rounded-xl border border-gray-200 bg-white p-6">
                  <h3 className="text-sm font-medium text-gray-500 mb-4">Actions</h3>
                  <div className="space-y-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full justify-start"
                      leftIcon={<UserPlus className="size-4" />}
                    >
                      Add Candidate Manually
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full justify-start"
                      leftIcon={<Edit3 className="size-4" />}
                    >
                      Edit Job
                    </Button>
                    {job.status === "draft" && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-full justify-start text-success-600"
                        leftIcon={<CheckCircle2 className="size-4" />}
                      >
                        Publish Job
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full justify-start text-error-600 hover:bg-error-50"
                      leftIcon={<Trash2 className="size-4" />}
                    >
                      Archive Job
                    </Button>
                  </div>
                </div>

                {/* Timeline */}
                <div className="rounded-xl border border-gray-200 bg-white p-6">
                  <h3 className="text-sm font-medium text-gray-500 mb-4">Timeline</h3>
                  <div className="space-y-4">
                    <div className="flex items-start gap-3">
                      <div className="mt-1 size-2 rounded-full bg-navy-400" />
                      <div>
                        <p className="text-sm font-medium text-navy-900">Created</p>
                        <p className="text-xs text-gray-500">{formatDate(job.created_at)}</p>
                      </div>
                    </div>
                    {job.published_at && (
                      <div className="flex items-start gap-3">
                        <div className="mt-1 size-2 rounded-full bg-success-400" />
                        <div>
                          <p className="text-sm font-medium text-navy-900">Published</p>
                          <p className="text-xs text-gray-500">{formatDate(job.published_at)}</p>
                        </div>
                      </div>
                    )}
                    {job.filled_at && (
                      <div className="flex items-start gap-3">
                        <div className="mt-1 size-2 rounded-full bg-gold-400" />
                        <div>
                          <p className="text-sm font-medium text-navy-900">Filled</p>
                          <p className="text-xs text-gray-500">{formatDate(job.filled_at)}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
  );
}
