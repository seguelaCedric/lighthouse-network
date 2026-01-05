"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  MapPin,
  Calendar,
  Ship,
  DollarSign,
  Clock,
  Briefcase,
  AlertTriangle,
  Palmtree,
  Ruler,
  CheckCircle,
  Eye,
  Users,
  Loader2,
  Check,
  X,
} from "lucide-react";
import { applyToJob, type JobListing } from "../actions";

interface JobDetailClientProps {
  job: JobListing;
}

// Format contract type for display
function formatContractType(type: string): string {
  const typeMap: Record<string, string> = {
    permanent: "Permanent",
    seasonal: "Seasonal",
    temporary: "Temporary",
    rotational: "Rotational",
    freelance: "Freelance",
  };
  return typeMap[type.toLowerCase()] || type.charAt(0).toUpperCase() + type.slice(1);
}

// Format salary for display
function formatSalary(
  min: number | null,
  max: number | null,
  currency: string,
  period: string
): string {
  const currencySymbol = currency === "USD" ? "$" : currency === "GBP" ? "?" : "?";
  const periodLabel = period === "yearly" ? " per year" : period === "daily" ? " per day" : " per month";

  if (min && max) {
    if (min === max) {
      return `${currencySymbol}${min.toLocaleString("en-US")}${periodLabel}`;
    }
    return `${currencySymbol}${min.toLocaleString("en-US")} - ${currencySymbol}${max.toLocaleString("en-US")}${periodLabel}`;
  }
  if (min) {
    return `From ${currencySymbol}${min.toLocaleString("en-US")}${periodLabel}`;
  }
  if (max) {
    return `Up to ${currencySymbol}${max.toLocaleString("en-US")}${periodLabel}`;
  }
  return "Competitive salary";
}

// Format date for display
function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

// Format posted date with relative time
function formatPostedDate(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
  const diffDays = Math.floor(diffHours / 24);

  if (diffHours < 1) return "Just posted";
  if (diffHours < 24) return `Posted ${diffHours} hour${diffHours > 1 ? "s" : ""} ago`;
  if (diffDays === 1) return "Posted yesterday";
  if (diffDays < 7) return `Posted ${diffDays} days ago`;
  if (diffDays < 30) return `Posted ${Math.floor(diffDays / 7)} week${Math.floor(diffDays / 7) > 1 ? "s" : ""} ago`;
  return `Posted ${formatDate(dateString)}`;
}

// Check if starting soon (within 14 days)
function isStartingSoon(dateString: string): boolean {
  const date = new Date(dateString);
  const now = new Date();
  const diffDays = Math.ceil((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  return diffDays >= 0 && diffDays <= 14;
}

// Get match score color
function getMatchColor(score: number | null): string {
  if (!score) return "text-gray-500";
  if (score >= 80) return "text-green-600";
  if (score >= 60) return "text-yellow-600";
  return "text-orange-500";
}

function getMatchBgColor(score: number | null): string {
  if (!score) return "bg-gray-100";
  if (score >= 80) return "bg-green-100";
  if (score >= 60) return "bg-yellow-100";
  return "bg-orange-100";
}

export function JobDetailClient({ job }: JobDetailClientProps) {
  const [isPending, startTransition] = useTransition();
  const [hasApplied, setHasApplied] = useState(job.hasApplied);
  const [error, setError] = useState<string | null>(null);
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [coverNote, setCoverNote] = useState("");

  const hasSalary = job.salaryMin || job.salaryMax;
  const startingSoon = job.startDate && isStartingSoon(job.startDate);

  const handleApply = () => {
    setError(null);
    startTransition(async () => {
      const result = await applyToJob(job.id, coverNote || undefined);
      if (result.success) {
        setHasApplied(true);
        setShowApplyModal(false);
      } else {
        setError(result.error || "Failed to submit application");
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <Link
        href="/crew/jobs"
        className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-navy-600 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Jobs
      </Link>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Job Header Card */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
            {/* Urgent Banner */}
            {job.isUrgent && (
              <div className="bg-gradient-to-r from-red-500 to-red-600 px-6 py-2 flex items-center gap-2 text-white text-sm font-medium">
                <AlertTriangle className="h-4 w-4" />
                Urgent Hire - Immediate Start Required
              </div>
            )}

            {/* Starting Soon Banner */}
            {startingSoon && !job.isUrgent && (
              <div className="bg-gradient-to-r from-amber-400 to-amber-500 px-6 py-2 flex items-center gap-2 text-white text-sm font-medium">
                <Calendar className="h-4 w-4" />
                Starting Soon - Apply Now
              </div>
            )}

            <div className="p-6">
              {/* Top Row: Badges + Match Score */}
              <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                <div className="flex flex-wrap items-center gap-2">
                  {job.contractType && (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-navy-100 px-3 py-1 text-xs font-medium text-navy-700">
                      <Clock className="h-3 w-3" />
                      {formatContractType(job.contractType)}
                    </span>
                  )}
                  {job.publishedAt && (
                    <span className="text-sm text-gray-500">
                      {formatPostedDate(job.publishedAt)}
                    </span>
                  )}
                </div>
                {/* Match Score */}
                <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full ${getMatchBgColor(job.matchScore)}`}>
                  <div className={`font-semibold ${getMatchColor(job.matchScore)}`}>
                    {job.matchScore || 0}% Match
                  </div>
                </div>
              </div>

              {/* Title */}
              <h1 className="text-2xl font-semibold text-navy-900 mb-2">
                {job.title}
              </h1>

              {/* Vessel Name */}
              {job.vesselName && (
                <p className="text-gray-600 mb-4">{job.vesselName}</p>
              )}

              {/* Key Details Grid */}
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 p-4 bg-gray-50 rounded-xl">
                {job.location && (
                  <div className="flex flex-col space-y-1 p-3 bg-white rounded-lg">
                    <span className="text-xs text-gray-500 uppercase tracking-wide">Location</span>
                    <div className="flex items-center gap-2 text-navy-800">
                      <MapPin className="h-4 w-4 text-gold-500 flex-shrink-0" />
                      <span className="font-medium text-sm">{job.location}</span>
                    </div>
                  </div>
                )}
                {hasSalary && (
                  <div className="flex flex-col space-y-1 p-3 bg-white rounded-lg">
                    <span className="text-xs text-gray-500 uppercase tracking-wide">Salary</span>
                    <div className="flex items-center gap-2 text-navy-800">
                      <DollarSign className="h-4 w-4 text-gold-500 flex-shrink-0" />
                      <span className="font-semibold text-sm">
                        {formatSalary(job.salaryMin, job.salaryMax, job.currency, job.salaryPeriod)}
                      </span>
                    </div>
                  </div>
                )}
                {job.startDate && (
                  <div className="flex flex-col space-y-1 p-3 bg-white rounded-lg">
                    <span className="text-xs text-gray-500 uppercase tracking-wide">Start Date</span>
                    <div className={`flex items-center gap-2 ${startingSoon ? "text-amber-600" : "text-navy-800"}`}>
                      <Calendar className="h-4 w-4 text-gold-500 flex-shrink-0" />
                      <span className={`text-sm ${startingSoon ? "font-semibold" : "font-medium"}`}>
                        {formatDate(job.startDate)}
                      </span>
                    </div>
                  </div>
                )}
                {job.holidayDays && (
                  <div className="flex flex-col space-y-1 p-3 bg-white rounded-lg">
                    <span className="text-xs text-gray-500 uppercase tracking-wide">Annual Leave</span>
                    <div className="flex items-center gap-2 text-navy-800">
                      <Palmtree className="h-4 w-4 text-gold-500 flex-shrink-0" />
                      <span className="font-medium text-sm">{job.holidayDays} days</span>
                    </div>
                  </div>
                )}
                {job.vesselType && (
                  <div className="flex flex-col space-y-1 p-3 bg-white rounded-lg">
                    <span className="text-xs text-gray-500 uppercase tracking-wide">Vessel</span>
                    <div className="flex items-center gap-2 text-navy-800">
                      <Ship className="h-4 w-4 text-gold-500 flex-shrink-0" />
                      <span className="font-medium text-sm">
                        {job.vesselType}
                        {job.vesselSize && ` (${job.vesselSize}m)`}
                      </span>
                    </div>
                  </div>
                )}
                {job.rotationSchedule && (
                  <div className="flex flex-col space-y-1 p-3 bg-white rounded-lg">
                    <span className="text-xs text-gray-500 uppercase tracking-wide">Rotation</span>
                    <div className="flex items-center gap-2 text-navy-800">
                      <Clock className="h-4 w-4 text-gold-500 flex-shrink-0" />
                      <span className="font-medium text-sm">{job.rotationSchedule}</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Stats Row */}
              {(job.viewsCount > 0 || job.applicationsCount > 0) && (
                <div className="flex items-center gap-6 mt-4 pt-4 border-t border-gray-100 text-sm text-gray-500">
                  {job.viewsCount > 0 && (
                    <div className="flex items-center gap-1.5">
                      <Eye className="h-4 w-4" />
                      <span>{job.viewsCount} views</span>
                    </div>
                  )}
                  {job.applicationsCount > 0 && (
                    <div className="flex items-center gap-1.5">
                      <Users className="h-4 w-4" />
                      <span>{job.applicationsCount} applicant{job.applicationsCount > 1 ? "s" : ""}</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Job Description */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-navy-900 mb-4">About This Position</h2>
            {job.description ? (
              <div className="prose prose-navy max-w-none">
                <p className="whitespace-pre-line text-gray-700 leading-relaxed">{job.description}</p>
              </div>
            ) : (
              <p className="text-gray-500 italic">Contact us for more details about this position.</p>
            )}
          </div>

          {/* Benefits */}
          {(job.benefits || job.holidayDays || job.rotationSchedule) && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-navy-900 mb-4">Benefits & Package</h2>
              <ul className="space-y-3">
                {job.holidayDays && (
                  <li className="flex items-start gap-3">
                    <Palmtree className="h-5 w-5 text-gold-500 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-700">{job.holidayDays} days annual leave</span>
                  </li>
                )}
                {job.rotationSchedule && (
                  <li className="flex items-start gap-3">
                    <Calendar className="h-5 w-5 text-gold-500 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-700">Rotation: {job.rotationSchedule}</span>
                  </li>
                )}
                {job.benefits && (
                  <li className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-gold-500 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-700">{job.benefits}</span>
                  </li>
                )}
              </ul>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-1 space-y-6">
          {/* Apply Card */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 sticky top-24">
            <h3 className="text-lg font-semibold text-navy-900 mb-4">
              {hasApplied ? "Application Submitted" : "Apply for this position"}
            </h3>

            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700 text-sm">
                <X className="h-4 w-4 flex-shrink-0" />
                {error}
              </div>
            )}

            {hasApplied ? (
              <div className="flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-xl text-green-700">
                <Check className="h-5 w-5" />
                <span className="font-medium">You have applied to this job</span>
              </div>
            ) : (
              <>
                <button
                  onClick={() => setShowApplyModal(true)}
                  disabled={isPending}
                  className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-gold-500 to-gold-600 px-6 py-3.5 font-medium text-white hover:from-gold-600 hover:to-gold-700 transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isPending ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" />
                      Applying...
                    </>
                  ) : (
                    "Apply Now"
                  )}
                </button>

                {job.applyDeadline && (
                  <p className="text-sm text-gray-500 mt-4 text-center">
                    Applications close {formatDate(job.applyDeadline)}
                  </p>
                )}
              </>
            )}
          </div>

          {/* Vessel Info */}
          {(job.vesselType || job.vesselSize) && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-navy-900 mb-4">Vessel Information</h3>
              <div className="space-y-3">
                {job.vesselType && (
                  <div className="flex items-center gap-3">
                    <Ship className="h-5 w-5 text-gold-500" />
                    <span className="text-gray-700">{job.vesselType}</span>
                  </div>
                )}
                {job.vesselSize && (
                  <div className="flex items-center gap-3">
                    <Ruler className="h-5 w-5 text-gold-500" />
                    <span className="text-gray-700">{job.vesselSize} meters</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Job ID */}
          <div className="bg-gray-50 rounded-xl p-4 text-center">
            <p className="text-xs text-gray-500">Job Reference</p>
            <p className="text-sm font-mono text-navy-700">{job.id.slice(0, 8).toUpperCase()}</p>
          </div>
        </div>
      </div>

      {/* Apply Modal */}
      {showApplyModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
            <h3 className="text-xl font-semibold text-navy-900 mb-2">Apply for {job.title}</h3>
            <p className="text-gray-600 mb-4">
              Your profile and CV will be shared with the recruiter.
            </p>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Cover Note (Optional)
              </label>
              <textarea
                value={coverNote}
                onChange={(e) => setCoverNote(e.target.value)}
                placeholder="Add a brief note to introduce yourself..."
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-gold-500 focus:border-transparent resize-none"
                rows={4}
              />
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                {error}
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => setShowApplyModal(false)}
                disabled={isPending}
                className="flex-1 px-4 py-3 border border-gray-300 rounded-xl text-gray-700 font-medium hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleApply}
                disabled={isPending}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-gold-500 to-gold-600 text-white font-medium rounded-xl hover:from-gold-600 hover:to-gold-700 transition-all disabled:opacity-50"
              >
                {isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  "Submit Application"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
