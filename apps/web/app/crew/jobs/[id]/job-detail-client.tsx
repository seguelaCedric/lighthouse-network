"use client";

import { useState, useTransition, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
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
  Upload,
  CalendarClock,
  Home,
} from "lucide-react";
import { applyToJob, type JobListing } from "../actions";
import { InlineCVUpload } from "@/components/documents/InlineCVUpload";
import { calculateProfileCompletion } from "@/lib/profile-completion";
import { candidateHasCV } from "@/lib/utils/candidate-cv";
import { isLandBasedJob } from "@/lib/utils/job-helpers";
import { formatSalaryRange } from "@/lib/utils/currency";

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

// Format salary for display - uses centralized currency utility
function formatSalary(
  min: number | null,
  max: number | null,
  currency: string,
  period: string
): string {
  const result = formatSalaryRange(min, max, currency, period, {
    style: "full",
    periodStyle: "long",
  });
  return result === "Competitive" ? "Competitive salary" : result;
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

// Format vessel type for display (capitalize first letter)
function formatVesselTypeDisplay(vesselType: string | null): string {
  if (!vesselType) return "";
  return vesselType.charAt(0).toUpperCase() + vesselType.slice(1).toLowerCase();
}

interface CandidateData {
  id: string;
  firstName?: string | null;
  lastName?: string | null;
  email?: string | null;
  phone?: string | null;
  dateOfBirth?: string | null;
  nationality?: string | null;
  currentLocation?: string | null;
  candidateType?: string | null;
  primaryPosition?: string | null;
  yachtPrimaryPosition?: string | null;
  householdPrimaryPosition?: string | null;
  availabilityStatus?: string | null;
  avatarUrl?: string | null;
  hasStcw?: boolean;
  hasEng1?: boolean;
  industryPreference?: string | null;
  documents?: Array<{ type: string }>;
}

export function JobDetailClient({ job }: JobDetailClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [hasApplied, setHasApplied] = useState(job.hasApplied);
  const [error, setError] = useState<string | null>(null);
  const [errorDismissed, setErrorDismissed] = useState(false);
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [showCVUpload, setShowCVUpload] = useState(false);
  const [coverNote, setCoverNote] = useState("");
  const [candidateData, setCandidateData] = useState<CandidateData | null>(null);
  const [profileCompletion, setProfileCompletion] = useState<{ score: number; actions: Array<{ id: string; label: string }> } | null>(null);
  const [hasCV, setHasCV] = useState<boolean | null>(null);
  const [isLoadingCandidate, setIsLoadingCandidate] = useState(true);

  const hasSalary = job.salaryMin || job.salaryMax;
  const startingSoon = job.startDate && isStartingSoon(job.startDate);

  // Fetch candidate data and profile completion
  useEffect(() => {
    async function fetchCandidateData() {
      try {
        const response = await fetch("/api/crew/profile");
        if (response.ok) {
          const data = await response.json();
          const candidate = data.data;
          
          if (candidate) {
            setCandidateData({
              id: candidate.id,
              firstName: candidate.first_name,
              lastName: candidate.last_name,
              email: candidate.email,
              phone: candidate.phone,
              dateOfBirth: candidate.date_of_birth,
              nationality: candidate.nationality,
              currentLocation: candidate.current_location,
              candidateType: candidate.candidate_type,
              primaryPosition: candidate.primary_position,
              yachtPrimaryPosition: candidate.yacht_primary_position,
              householdPrimaryPosition: candidate.household_primary_position,
              availabilityStatus: candidate.availability_status,
              avatarUrl: candidate.avatar_url,
              hasStcw: candidate.has_stcw,
              hasEng1: candidate.has_eng1,
              industryPreference: candidate.industry_preference,
              documents: candidate.documents?.map((doc: { document_type?: string; type?: string }) => ({
                type: doc.document_type || doc.type || "",
              })) || [],
            });

            // Calculate profile completion
            const completion = calculateProfileCompletion({
              firstName: candidate.first_name,
              lastName: candidate.last_name,
              email: candidate.email,
              phone: candidate.phone,
              dateOfBirth: candidate.date_of_birth,
              nationality: candidate.nationality,
              currentLocation: candidate.current_location,
              candidateType: candidate.candidate_type,
              primaryPosition: candidate.primary_position,
              yachtPrimaryPosition: candidate.yacht_primary_position,
              householdPrimaryPosition: candidate.household_primary_position,
              availabilityStatus: candidate.availability_status,
              avatarUrl: candidate.avatar_url,
              hasStcw: candidate.has_stcw,
              hasEng1: candidate.has_eng1,
              industryPreference: candidate.industry_preference,
              documents: candidate.documents?.map((doc: { document_type?: string; type?: string }) => ({
                type: doc.document_type || doc.type || "",
              })) || [],
            });
            setProfileCompletion(completion);

            // Check if candidate has CV by checking documents
            const hasCvDoc = candidate.documents?.some(
              (doc: { document_type?: string; type?: string }) =>
                (doc.document_type === "cv" || doc.type === "cv")
            );
            setHasCV(hasCvDoc || false);
          }
        }
      } catch (error) {
        console.error("Failed to fetch candidate data:", error);
      } finally {
        setIsLoadingCandidate(false);
      }
    }

    fetchCandidateData();
  }, []);

  const handleApply = () => {
    setError(null);
    setErrorDismissed(false);
    startTransition(async () => {
      const result = await applyToJob(job.id, coverNote || undefined);
      if (result.success) {
        setHasApplied(true);
        setShowApplyModal(false);
        setShowCVUpload(false);
      } else {
        const errorMsg = result.error || "Failed to submit application";
        setError(errorMsg);
        // Show CV upload if CV error
        if (errorMsg.includes("upload a CV") || errorMsg.includes("CV")) {
          setShowCVUpload(true);
        }
      }
    });
  };

  const handleCVUploadSuccess = async () => {
    // Refresh candidate data to check if CV is now available
    setHasCV(true);
    setShowCVUpload(false);
    setError(null);
    setErrorDismissed(false);
    
    // Recalculate profile completion
    if (candidateData) {
      const updatedDocuments = [...(candidateData.documents || []), { type: "cv" }];
      const completion = calculateProfileCompletion({
        ...candidateData,
        documents: updatedDocuments,
      });
      setProfileCompletion(completion);
      
      // Update candidate data with new documents
      setCandidateData({
        ...candidateData,
        documents: updatedDocuments,
      });
    }
    
    // Wait a moment for the state to update, then the apply button will be available
    // The isCVError check will automatically become false since error is cleared
  };

  const isCVError = error?.includes("upload a CV") || error?.includes("CV");

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
              {/* Top Tags Row */}
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-2">
                  {job.contractType && (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-navy-100 px-3 py-1 text-xs font-medium text-navy-700">
                      <Clock className="h-3 w-3" />
                      {formatContractType(job.contractType)}
                    </span>
                  )}
                  {job.publishedAt && (
                    <span className="flex items-center gap-1 text-sm text-gray-500">
                      <Clock className="h-3.5 w-3.5" />
                      {formatPostedDate(job.publishedAt)}
                    </span>
                  )}
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

              {/* Key Details Grid - Grey Section */}
              <div className="grid grid-cols-1 gap-3 rounded-xl bg-gray-50 p-3 sm:grid-cols-2 sm:gap-4 sm:p-4">
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-1.5">
                    {isLandBasedJob(job.title) ? (
                      <Home className="h-4 w-4 shrink-0 text-gray-400" />
                    ) : (
                      <Ship className="h-4 w-4 shrink-0 text-gray-400" />
                    )}
                    <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                      {isLandBasedJob(job.title) ? "Property" : "Vessel / Property"}
                    </p>
                  </div>
                  <p className="text-sm font-semibold text-navy-900">
                    {isLandBasedJob(job.title) ? (
                      "Private Household"
                    ) : (
                      <>
                        {formatVesselTypeDisplay(job.vesselType)}
                        {job.vesselType && job.vesselSize ? " • " : ""}
                        {job.vesselSize ? `${job.vesselSize}m` : ""}
                        {!job.vesselType && !job.vesselSize && "Not specified"}
                      </>
                    )}
                  </p>
                </div>
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-1.5">
                    <DollarSign className="h-4 w-4 shrink-0 text-gray-400" />
                    <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                      Salary
                    </p>
                  </div>
                  <p className="text-sm font-semibold text-navy-900">
                    {formatSalary(job.salaryMin, job.salaryMax, job.currency, job.salaryPeriod)}
                  </p>
                </div>
                {job.location && (
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-1.5">
                      <MapPin className="h-4 w-4 shrink-0 text-gray-400" />
                      <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                        Location
                      </p>
                    </div>
                    <p className="text-sm font-semibold text-navy-900">{job.location}</p>
                  </div>
                )}
                {job.startDate && (
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="h-4 w-4 shrink-0 text-gray-400" />
                      <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                        Start Date
                      </p>
                    </div>
                    <p className={`text-sm font-semibold ${startingSoon ? "text-amber-600" : "text-navy-900"}`}>
                      {formatDate(job.startDate)}
                    </p>
                  </div>
                )}
                {job.holidayDays && (
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-1.5">
                      <CalendarClock className="h-4 w-4 shrink-0 text-gray-400" />
                      <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                        Holiday
                      </p>
                    </div>
                    <p className="text-sm font-semibold text-navy-900">
                      {job.holidayDays} days
                    </p>
                  </div>
                )}
                {job.rotationSchedule && (
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-1.5">
                      <Clock className="h-4 w-4 shrink-0 text-gray-400" />
                      <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                        Rotation
                      </p>
                    </div>
                    <p className="text-sm font-semibold text-navy-900">
                      {job.rotationSchedule}
                    </p>
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
              <div
                className="prose prose-navy max-w-none text-gray-700 prose-headings:text-navy-900 prose-a:text-gold-600 prose-strong:text-navy-900"
                dangerouslySetInnerHTML={{ __html: job.description }}
              />
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
          {/* Profile Completion Card */}
          {!isLoadingCandidate && profileCompletion && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-sm font-semibold text-navy-900 mb-3">Profile Completion</h3>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Overall Progress</span>
                  <span className="font-semibold text-navy-900">{profileCompletion.score}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-gradient-to-r from-gold-500 to-gold-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${profileCompletion.score}%` }}
                  />
                </div>
                {profileCompletion.score < 100 && (
                  <p className="text-xs text-gray-500 mt-2">
                    Complete your profile to improve your job matches
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Apply Card */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-navy-900 mb-4">
              {hasApplied ? "Application Submitted" : "Apply for this position"}
            </h3>

            {error && !errorDismissed && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="font-medium mb-2">{error}</p>
                  </div>
                  <button
                    onClick={() => setErrorDismissed(true)}
                    className="flex-shrink-0 p-1 hover:bg-red-100 rounded transition-colors"
                    aria-label="Dismiss error"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}

            {/* CV Upload Section */}
            {isCVError && candidateData && showCVUpload && (
              <div className="mb-4 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                <h4 className="text-sm font-semibold text-amber-900 mb-3">Upload Your CV</h4>
                <InlineCVUpload
                  candidateId={candidateData.id}
                  onUploadSuccess={handleCVUploadSuccess}
                  onUploadError={(err) => setError(err)}
                />
              </div>
            )}

            {hasApplied ? (
              <div className="flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-xl text-green-700">
                <Check className="h-5 w-5" />
                <span className="font-medium">You have applied to this job</span>
              </div>
            ) : (
              <>
                {!isCVError && (
                  <button
                    onClick={() => setShowApplyModal(true)}
                    disabled={isPending || (hasCV === false)}
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
                )}

                {isCVError && !showCVUpload && (
                  <button
                    onClick={() => setShowCVUpload(true)}
                    className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-gold-500 to-gold-600 px-6 py-3.5 font-medium text-white hover:from-gold-600 hover:to-gold-700 transition-all shadow-lg hover:shadow-xl"
                  >
                    <Upload className="h-5 w-5" />
                    Upload CV to Apply
                  </button>
                )}

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

            {error && !errorDismissed && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="font-medium mb-2">{error}</p>
                    {isCVError && candidateData && !showCVUpload && (
                      <button
                        onClick={() => setShowCVUpload(true)}
                        className="inline-flex items-center gap-2 px-3 py-1.5 bg-red-100 hover:bg-red-200 border border-red-300 rounded-lg text-red-800 font-medium text-xs transition-colors"
                      >
                        <Upload className="h-3.5 w-3.5" />
                        Upload CV Now
                      </button>
                    )}
                  </div>
                  <button
                    onClick={() => setErrorDismissed(true)}
                    className="flex-shrink-0 p-1 hover:bg-red-100 rounded transition-colors"
                    aria-label="Dismiss error"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}

            {/* Profile Completion in Modal */}
            {profileCompletion && (
              <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-between text-sm mb-2">
                  <span className="text-gray-600">Profile Completion</span>
                  <span className="font-semibold text-navy-900">{profileCompletion.score}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-gradient-to-r from-gold-500 to-gold-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${profileCompletion.score}%` }}
                  />
                </div>
              </div>
            )}

            {/* CV Upload in Modal */}
            {isCVError && candidateData && showCVUpload && (
              <div className="mb-4 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                <h4 className="text-sm font-semibold text-amber-900 mb-3">Upload Your CV</h4>
                <InlineCVUpload
                  candidateId={candidateData.id}
                  onUploadSuccess={handleCVUploadSuccess}
                  onUploadError={(err) => setError(err)}
                />
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowApplyModal(false);
                  setError(null);
                  setErrorDismissed(false);
                  setShowCVUpload(false);
                }}
                disabled={isPending}
                className="flex-1 px-4 py-3 border border-gray-300 rounded-xl text-gray-700 font-medium hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              {!isCVError && (
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
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
