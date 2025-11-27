"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  Calendar,
  Download,
  Shield,
  Award,
  CheckCircle2,
  Sparkles,
  MapPin,
  Briefcase,
  Clock,
  Globe,
  Anchor,
  Ship,
  FileText,
  Mail,
  Phone,
  Lock,
  Loader2,
  AlertCircle,
  ExternalLink,
} from "lucide-react";

interface CandidateProfile {
  id: string;
  firstName: string;
  lastInitial: string;
  lastName?: string;
  email?: string;
  phone?: string;
  whatsapp?: string;
  primaryPosition: string;
  secondaryPositions: string[] | null;
  yearsExperience: number;
  currentLocation: string;
  currentCountry: string;
  nationality?: string;
  dateOfBirth?: string;
  verificationTier: "premium" | "verified" | "basic";
  profileSummary: string;
  profilePhotoUrl: string | null;
  availableFrom: string | null;
  availabilityStatus: string;
  preferredYachtTypes: string[] | null;
  preferredRegions: string[] | null;
  yachtSizeMin: number | null;
  yachtSizeMax: number | null;
  hasStcw: boolean;
  hasEng1: boolean;
  highestLicense: string | null;
  languages: string[] | null;
  smoker: boolean | null;
  visibleTattoos: boolean | null;
  matchScore: number;
  matchReasoning: string;
  recruiterNote: string;
  submittedAt: string;
  job: {
    id: string;
    title: string;
  };
  certifications: Array<{
    id: string;
    name: string;
    type: string;
    issuingAuthority: string;
    issueDate: string;
    expiryDate: string | null;
    isVerified: boolean;
  }>;
  workHistory: Array<{
    id: string;
    position: string;
    vesselName: string;
    vesselType: string;
    vesselSize: number | null;
    startDate: string;
    endDate: string | null;
    isCurrent: boolean;
    description: string | null;
    captainName: string | null;
  }>;
  salaryExpectations?: {
    min: number;
    max: number;
    currency: string;
    period: string;
  };
  accessLevel: "full" | "limited";
}

function VerificationBadge({ level }: { level: "premium" | "verified" | "basic" }) {
  const badges = {
    premium: {
      icon: Award,
      label: "Premium Verified",
      className: "bg-gold-100 text-gold-700 border-gold-200",
    },
    verified: {
      icon: Shield,
      label: "Verified",
      className: "bg-success-100 text-success-700 border-success-200",
    },
    basic: {
      icon: CheckCircle2,
      label: "Basic",
      className: "bg-gray-100 text-gray-600 border-gray-200",
    },
  };

  const badge = badges[level];
  const Icon = badge.icon;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-sm font-medium",
        badge.className
      )}
    >
      <Icon className="size-4" />
      {badge.label}
    </span>
  );
}

function InfoRow({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string | null | undefined }) {
  if (!value) return null;
  return (
    <div className="flex items-start gap-3">
      <Icon className="mt-0.5 size-4 shrink-0 text-gray-400" />
      <div>
        <p className="text-xs text-gray-500">{label}</p>
        <p className="text-sm font-medium text-navy-900">{value}</p>
      </div>
    </div>
  );
}

function Section({ title, children, className }: { title: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("rounded-xl border border-gray-200 bg-white", className)}>
      <div className="border-b border-gray-100 px-5 py-3">
        <h3 className="font-semibold text-navy-900">{title}</h3>
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="border-b border-gray-200 bg-white">
        <div className="mx-auto max-w-4xl px-6 py-6">
          <div className="h-24 animate-pulse rounded-xl bg-gray-200" />
        </div>
      </div>
      <div className="mx-auto max-w-4xl space-y-6 px-6 py-6">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-48 animate-pulse rounded-xl bg-gray-200" />
        ))}
      </div>
    </div>
  );
}

export default function CandidateProfilePage() {
  const params = useParams();
  const router = useRouter();
  const candidateId = params.id as string;

  const [profile, setProfile] = useState<CandidateProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [downloadingCv, setDownloadingCv] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await fetch(`/api/client/candidates/${candidateId}`);
        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || "Failed to fetch profile");
        }
        const result = await response.json();
        setProfile(result.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [candidateId]);

  const handleDownloadCv = async () => {
    setDownloadingCv(true);
    try {
      const response = await fetch(`/api/client/candidates/${candidateId}/cv`);
      if (!response.ok) {
        throw new Error("Failed to get CV download link");
      }
      const result = await response.json();
      // Open download URL in new tab
      window.open(result.data.downloadUrl, "_blank");
    } catch (err) {
      console.error("Error downloading CV:", err);
    } finally {
      setDownloadingCv(false);
    }
  };

  if (loading) return <LoadingSkeleton />;

  if (error || !profile) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4">
        <AlertCircle className="size-12 text-error-500" />
        <p className="text-gray-600">{error || "Failed to load profile"}</p>
        <Button variant="secondary" onClick={() => router.back()}>
          Go Back
        </Button>
      </div>
    );
  }

  const initials = `${profile.firstName[0]}${profile.lastInitial}`;
  const fullName = profile.accessLevel === "full" && profile.lastName
    ? `${profile.firstName} ${profile.lastName}`
    : `${profile.firstName} ${profile.lastInitial}.`;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-gray-200 bg-white">
        <div className="mx-auto max-w-4xl px-6 py-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.back()}
              className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-700"
            >
              <ArrowLeft className="size-5" />
            </button>
            <div className="flex-1">
              <p className="text-sm text-gray-500">Candidate Profile</p>
              <h1 className="text-2xl font-serif font-semibold text-navy-800">
                {fullName}
              </h1>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="secondary"
                onClick={handleDownloadCv}
                disabled={downloadingCv}
              >
                {downloadingCv ? (
                  <Loader2 className="mr-2 size-4 animate-spin" />
                ) : (
                  <Download className="mr-2 size-4" />
                )}
                Download CV
              </Button>
              {profile.accessLevel === "limited" && (
                <Link href={`/client/shortlist/${profile.job.id}`}>
                  <Button variant="primary">
                    <Calendar className="mr-2 size-4" />
                    Request Interview
                  </Button>
                </Link>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-6 py-6">
        {/* Limited Access Notice */}
        {profile.accessLevel === "limited" && (
          <div className="mb-6 flex items-start gap-3 rounded-xl border border-gold-200 bg-gold-50 p-4">
            <Lock className="mt-0.5 size-5 text-gold-600" />
            <div>
              <p className="font-medium text-gold-800">Limited Profile Access</p>
              <p className="text-sm text-gold-700">
                Full contact details and references will be available after you request an interview.
                This protects candidate privacy while allowing you to review their qualifications.
              </p>
            </div>
          </div>
        )}

        {/* Profile Header Card */}
        <div className="mb-6 rounded-xl border border-gray-200 bg-white p-6">
          <div className="flex items-start gap-5">
            {/* Photo/Initials */}
            <div className="shrink-0">
              {profile.profilePhotoUrl ? (
                <img
                  src={profile.profilePhotoUrl}
                  alt=""
                  className="size-24 rounded-xl object-cover"
                />
              ) : (
                <div className="flex size-24 items-center justify-center rounded-xl bg-gradient-to-br from-navy-500 to-navy-700 text-2xl font-bold text-white">
                  {initials}
                </div>
              )}
            </div>

            {/* Basic Info */}
            <div className="flex-1">
              <div className="mb-3 flex flex-wrap items-center gap-3">
                <h2 className="text-xl font-semibold text-navy-900">{fullName}</h2>
                <VerificationBadge level={profile.verificationTier} />
                <div className="flex items-center gap-1.5 rounded-full bg-navy-900 px-3 py-1">
                  <Sparkles className="size-3.5 text-gold-400" />
                  <span className="text-sm font-bold text-white">{profile.matchScore}%</span>
                  <span className="text-xs text-gray-300">match</span>
                </div>
              </div>
              <p className="mb-2 text-lg font-medium text-navy-700">{profile.primaryPosition}</p>
              <p className="text-sm text-gray-500">
                {profile.yearsExperience} years experience • {profile.currentLocation}
              </p>

              {/* Contact Info (Full Access Only) */}
              {profile.accessLevel === "full" && (
                <div className="mt-4 flex flex-wrap gap-4">
                  {profile.email && (
                    <a
                      href={`mailto:${profile.email}`}
                      className="flex items-center gap-2 text-sm text-navy-600 hover:text-navy-800"
                    >
                      <Mail className="size-4" />
                      {profile.email}
                    </a>
                  )}
                  {profile.phone && (
                    <a
                      href={`tel:${profile.phone}`}
                      className="flex items-center gap-2 text-sm text-navy-600 hover:text-navy-800"
                    >
                      <Phone className="size-4" />
                      {profile.phone}
                    </a>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* AI Summary */}
          {profile.profileSummary && (
            <div className="mt-5 rounded-lg bg-gray-50 p-4">
              <div className="mb-2 flex items-center gap-2">
                <Sparkles className="size-4 text-gold-500" />
                <span className="text-xs font-semibold uppercase tracking-wide text-gold-600">
                  AI Summary
                </span>
              </div>
              <p className="text-sm leading-relaxed text-gray-700">{profile.profileSummary}</p>
            </div>
          )}

          {/* Recruiter Note */}
          {profile.recruiterNote && (
            <div className="mt-4 rounded-lg border border-navy-200 bg-navy-50 p-4">
              <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-navy-600">
                Recruiter's Note
              </p>
              <p className="text-sm text-navy-800">{profile.recruiterNote}</p>
            </div>
          )}
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Left Column */}
          <div className="space-y-6 lg:col-span-2">
            {/* Match Reasoning */}
            {profile.matchReasoning && (
              <Section title="Why Recommended">
                <ul className="space-y-2">
                  {profile.matchReasoning.split("\n").filter(Boolean).map((reason, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                      <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-success-500" />
                      {reason}
                    </li>
                  ))}
                </ul>
              </Section>
            )}

            {/* Work History */}
            {profile.workHistory.length > 0 && (
              <Section title="Work History">
                <div className="space-y-4">
                  {profile.workHistory.map((job, index) => (
                    <div
                      key={job.id}
                      className={cn(
                        "relative pl-6",
                        index < profile.workHistory.length - 1 &&
                          "border-l border-gray-200 pb-4"
                      )}
                    >
                      <div className="absolute -left-1.5 top-0 size-3 rounded-full border-2 border-white bg-navy-500" />
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-medium text-navy-900">{job.position}</p>
                          <p className="text-sm text-gray-600">
                            {job.vesselName}
                            {job.vesselType && ` • ${job.vesselType}`}
                            {job.vesselSize && ` • ${job.vesselSize}m`}
                          </p>
                        </div>
                        <p className="shrink-0 text-xs text-gray-500">
                          {new Date(job.startDate).toLocaleDateString("en-GB", {
                            month: "short",
                            year: "numeric",
                          })}
                          {" - "}
                          {job.isCurrent
                            ? "Present"
                            : job.endDate
                              ? new Date(job.endDate).toLocaleDateString("en-GB", {
                                  month: "short",
                                  year: "numeric",
                                })
                              : "N/A"}
                        </p>
                      </div>
                      {job.description && (
                        <p className="mt-2 text-sm text-gray-600">{job.description}</p>
                      )}
                      {job.captainName && profile.accessLevel === "full" && (
                        <p className="mt-1 text-xs text-gray-500">
                          Captain: {job.captainName}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </Section>
            )}

            {/* Certifications */}
            {profile.certifications.length > 0 && (
              <Section title="Certifications">
                <div className="grid gap-3 sm:grid-cols-2">
                  {profile.certifications.map((cert) => (
                    <div
                      key={cert.id}
                      className="flex items-start gap-3 rounded-lg border border-gray-100 bg-gray-50 p-3"
                    >
                      <FileText className="mt-0.5 size-4 shrink-0 text-navy-500" />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <p className="truncate text-sm font-medium text-navy-900">
                            {cert.name}
                          </p>
                          {cert.isVerified && (
                            <CheckCircle2 className="size-3.5 shrink-0 text-success-500" />
                          )}
                        </div>
                        <p className="text-xs text-gray-500">{cert.issuingAuthority}</p>
                        {cert.expiryDate && (
                          <p
                            className={cn(
                              "mt-1 text-xs",
                              new Date(cert.expiryDate) < new Date()
                                ? "text-error-500"
                                : new Date(cert.expiryDate) <
                                    new Date(Date.now() + 90 * 24 * 60 * 60 * 1000)
                                  ? "text-warning-600"
                                  : "text-gray-500"
                            )}
                          >
                            Expires:{" "}
                            {new Date(cert.expiryDate).toLocaleDateString("en-GB", {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            })}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </Section>
            )}
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            {/* Quick Info */}
            <Section title="Details">
              <div className="space-y-4">
                <InfoRow icon={Briefcase} label="Primary Position" value={profile.primaryPosition} />
                <InfoRow
                  icon={Briefcase}
                  label="Secondary Positions"
                  value={profile.secondaryPositions?.join(", ")}
                />
                <InfoRow
                  icon={Clock}
                  label="Experience"
                  value={`${profile.yearsExperience} years`}
                />
                <InfoRow icon={MapPin} label="Location" value={profile.currentLocation} />
                {profile.accessLevel === "full" && (
                  <InfoRow icon={Globe} label="Nationality" value={profile.nationality} />
                )}
                <InfoRow
                  icon={Calendar}
                  label="Available From"
                  value={
                    profile.availableFrom
                      ? new Date(profile.availableFrom).toLocaleDateString("en-GB", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })
                      : profile.availabilityStatus === "available"
                        ? "Immediately"
                        : null
                  }
                />
              </div>
            </Section>

            {/* Qualifications */}
            <Section title="Qualifications">
              <div className="space-y-3">
                {profile.hasStcw && (
                  <div className="flex items-center gap-2 text-sm text-gray-700">
                    <CheckCircle2 className="size-4 text-success-500" />
                    STCW Certificate
                  </div>
                )}
                {profile.hasEng1 && (
                  <div className="flex items-center gap-2 text-sm text-gray-700">
                    <CheckCircle2 className="size-4 text-success-500" />
                    ENG1 Medical
                  </div>
                )}
                {profile.highestLicense && (
                  <div className="flex items-center gap-2 text-sm text-gray-700">
                    <CheckCircle2 className="size-4 text-success-500" />
                    {profile.highestLicense}
                  </div>
                )}
                {profile.languages && profile.languages.length > 0 && (
                  <div>
                    <p className="mb-1 text-xs text-gray-500">Languages</p>
                    <div className="flex flex-wrap gap-1">
                      {profile.languages.map((lang) => (
                        <span
                          key={lang}
                          className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-700"
                        >
                          {lang}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </Section>

            {/* Preferences */}
            <Section title="Preferences">
              <div className="space-y-4">
                {profile.preferredYachtTypes && profile.preferredYachtTypes.length > 0 && (
                  <div>
                    <p className="mb-1 text-xs text-gray-500">Yacht Types</p>
                    <div className="flex flex-wrap gap-1">
                      {profile.preferredYachtTypes.map((type) => (
                        <span
                          key={type}
                          className="rounded-full bg-navy-100 px-2 py-0.5 text-xs text-navy-700"
                        >
                          {type}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                {(profile.yachtSizeMin || profile.yachtSizeMax) && (
                  <InfoRow
                    icon={Ship}
                    label="Yacht Size"
                    value={
                      profile.yachtSizeMin && profile.yachtSizeMax
                        ? `${profile.yachtSizeMin}m - ${profile.yachtSizeMax}m`
                        : profile.yachtSizeMin
                          ? `${profile.yachtSizeMin}m+`
                          : `Up to ${profile.yachtSizeMax}m`
                    }
                  />
                )}
                {profile.preferredRegions && profile.preferredRegions.length > 0 && (
                  <div>
                    <p className="mb-1 text-xs text-gray-500">Preferred Regions</p>
                    <div className="flex flex-wrap gap-1">
                      {profile.preferredRegions.map((region) => (
                        <span
                          key={region}
                          className="rounded-full bg-gold-100 px-2 py-0.5 text-xs text-gold-700"
                        >
                          {region}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                {profile.accessLevel === "full" && profile.salaryExpectations && (
                  <InfoRow
                    icon={Briefcase}
                    label="Salary Expectations"
                    value={`${profile.salaryExpectations.currency} ${profile.salaryExpectations.min.toLocaleString()} - ${profile.salaryExpectations.max.toLocaleString()} / ${profile.salaryExpectations.period}`}
                  />
                )}
              </div>
            </Section>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="mt-8 flex items-center justify-between rounded-xl border border-gray-200 bg-white p-5">
          <div>
            <p className="text-sm text-gray-500">
              Submitted for: <span className="font-medium text-navy-900">{profile.job.title}</span>
            </p>
            <p className="text-xs text-gray-400">
              {new Date(profile.submittedAt).toLocaleDateString("en-GB", {
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="secondary" onClick={handleDownloadCv} disabled={downloadingCv}>
              {downloadingCv ? (
                <Loader2 className="mr-2 size-4 animate-spin" />
              ) : (
                <Download className="mr-2 size-4" />
              )}
              Download CV
            </Button>
            <Link href={`/client/shortlist/${profile.job.id}`}>
              <Button variant="primary">
                <ArrowLeft className="mr-2 size-4" />
                Back to Shortlist
              </Button>
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
