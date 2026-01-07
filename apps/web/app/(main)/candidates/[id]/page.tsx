"use client";

import * as React from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  MapPin,
  Calendar,
  Edit3,
  Briefcase,
  MessageSquare,
  Download,
  User,
  FileText,
  Users,
  History,
  StickyNote,
  Sparkles,
  Phone,
  Mail,
  Upload,
  Eye,
  Check,
  X,
  Clock,
  AlertCircle,
  Shield,
  Globe,
  Award,
  Ship,
  DollarSign,
  Plus,
  Trash2,
  MoreVertical,
  FileCheck,
  FileClock,
  FileWarning,
  ChevronLeft,
  Loader2,
  XCircle,
  Anchor,
  Copy,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { VerificationBadge, type VerificationTier } from "@/components/ui/verification-badge";
import { VerificationSection, type VerificationChecklist } from "@/components/verification/VerificationSection";
import { IDReviewModal } from "@/components/verification/IDReviewModal";
import { ReferenceVerifyModal } from "@/components/verification/ReferenceVerifyModal";
import { AvailabilityBadge, type AvailabilityStatus } from "@/components/ui/availability-badge";
import { cn } from "@/lib/utils";
import type { CandidateWithRelations, Certification, CandidateReference } from "@lighthouse/database";
import DocumentList from "@/components/documents/DocumentList";
import DocumentCard from "@/components/documents/DocumentCard";
import { DocumentUploadModal } from "@/components/documents/DocumentUploadModal";
import type { Document } from "@/lib/services/document-service";
import type { DocumentType } from "@/lib/validations/documents";

// Extended type for candidate with additional fields that may exist in database but not in base type
// Note: bio_full, bio_generated_at are now in base Candidate type
interface ExtendedCandidate extends CandidateWithRelations {
  bio?: string | null;
  languages?: { language: string; proficiency: string }[];
  yacht_size_experience_min?: number | null;
  yacht_size_experience_max?: number | null;
  // Note: desired_salary_min, desired_salary_max, salary_currency are already in base type
}

// Helper functions
function getCountryFlag(countryCode: string | null): string {
  if (!countryCode) return "";
  const codePoints = countryCode
    .toUpperCase()
    .split("")
    .map((char) => 127397 + char.charCodeAt(0));
  return String.fromCodePoint(...codePoints);
}

function formatDate(date: string | null): string {
  if (!date) return "Not set";
  return new Date(date).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatDateTime(date: string): string {
  return new Date(date).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function calculateAge(birthDate: string | null): number | null {
  if (!birthDate) return null;
  const today = new Date();
  const birth = new Date(birthDate);
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  return age;
}

function getDaysUntil(date: string | null): number | null {
  if (!date) return null;
  const target = new Date(date);
  const today = new Date();
  const diffTime = target.getTime() - today.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

function getCertStatus(expiryDate: string | null): "valid" | "expiring" | "expired" | "no_expiry" {
  if (!expiryDate) return "no_expiry";
  const days = getDaysUntil(expiryDate);
  if (days === null) return "no_expiry";
  if (days < 0) return "expired";
  if (days < 90) return "expiring";
  return "valid";
}

// Tab definitions
const tabs = [
  { id: "profile", label: "Profile", icon: User },
  { id: "cv", label: "CV", icon: FileText },
  { id: "bios", label: "Bios", icon: Sparkles },
  { id: "references", label: "References", icon: Users },
  { id: "documents", label: "Documents", icon: FileCheck },
  { id: "notes", label: "Notes", icon: StickyNote },
];

// Proficiency Badge Component
function ProficiencyBadge({ level }: { level: string }) {
  const config: Record<string, { label: string; className: string }> = {
    native: { label: "Native", className: "bg-navy-100 text-navy-700" },
    fluent: { label: "Fluent", className: "bg-success-100 text-success-700" },
    advanced: { label: "Advanced", className: "bg-gold-100 text-gold-700" },
    intermediate: { label: "Intermediate", className: "bg-warning-100 text-warning-700" },
    basic: { label: "Basic", className: "bg-gray-100 text-gray-600" },
  };

  const { label, className } = config[level] || config.basic;
  return (
    <span className={cn("rounded-full px-2 py-0.5 text-xs font-medium", className)}>{label}</span>
  );
}

// Certification Status Icon
function CertStatusIcon({ status, verified }: { status: string; verified: boolean }) {
  if (!verified) {
    return <AlertCircle className="size-4 text-gray-400" />;
  }
  switch (status) {
    case "valid":
      return <FileCheck className="size-4 text-success-500" />;
    case "expiring":
      return <FileClock className="size-4 text-warning-500" />;
    case "expired":
      return <FileWarning className="size-4 text-error-500" />;
    case "no_expiry":
      return <Check className="size-4 text-success-500" />;
    default:
      return null;
  }
}

// Reference Status Badge
function ReferenceStatusBadge({ status }: { status: string }) {
  const config: Record<string, { label: string; className: string; icon: React.ComponentType<{ className?: string }> }> = {
    pending: { label: "Pending", className: "bg-warning-100 text-warning-700", icon: Clock },
    verified: { label: "Verified", className: "bg-success-100 text-success-700", icon: Check },
    unable_to_verify: { label: "Unable to Verify", className: "bg-error-100 text-error-700", icon: X },
  };

  const { label, className, icon: Icon } = config[status] || config.pending;
  return (
    <span className={cn("inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium", className)}>
      <Icon className="size-3" />
      {label}
    </span>
  );
}

// Main Component
export default function CandidateProfilePage() {
  const params = useParams();
  const router = useRouter();
  const candidateId = params.id as string;

  // State
  const [candidate, setCandidate] = React.useState<ExtendedCandidate | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [activeTab, setActiveTab] = React.useState("profile");

  // Verification state
  const [verificationChecklist, setVerificationChecklist] = React.useState<VerificationChecklist | null>(null);
  const [verificationProgress, setVerificationProgress] = React.useState<number>(0);
  const [idModalOpen, setIdModalOpen] = React.useState(false);
  const [refModalOpen, setRefModalOpen] = React.useState(false);
  const [selectedRefForVerify, setSelectedRefForVerify] = React.useState<CandidateReference | null>(null);

  // Document state for certifications and references tabs
  const [refDocuments, setRefDocuments] = React.useState<Document[]>([]);
  const [cvDocuments, setCvDocuments] = React.useState<Document[]>([]);
  const [docsLoading, setDocsLoading] = React.useState(false);
  const [showUploadModal, setShowUploadModal] = React.useState(false);
  const [uploadDocType, setUploadDocType] = React.useState<DocumentType | undefined>(undefined);

  // CV Preview State
  const [cvSignedUrl, setCvSignedUrl] = React.useState<string | null>(null);
  const [cvPreviewLoading, setCvPreviewLoading] = React.useState(false);

  // Fetch candidate data
  const fetchCandidate = React.useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/candidates/${candidateId}`);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to fetch candidate");
      }

      const data = await response.json();
      setCandidate(data.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }, [candidateId]);

  React.useEffect(() => {
    if (candidateId) {
      fetchCandidate();
    }
  }, [candidateId, fetchCandidate]);

  // Fetch verification status
  const fetchVerification = React.useCallback(async () => {
    try {
      const response = await fetch(`/api/candidates/${candidateId}/verification`);
      if (response.ok) {
        const data = await response.json();
        setVerificationChecklist(data.data?.checklist || null);
        setVerificationProgress(data.data?.progress || 0);
      }
    } catch (err) {
      console.error("Failed to fetch verification status:", err);
    }
  }, [candidateId]);

  React.useEffect(() => {
    if (candidateId) {
      fetchVerification();
    }
  }, [candidateId, fetchVerification]);

  // Fetch documents by type for certifications and references tabs
  const fetchDocumentsByType = React.useCallback(async () => {
    if (!candidateId) return;

    setDocsLoading(true);
    try {
      const [refRes, cvRes] = await Promise.all([
        fetch(`/api/candidates/${candidateId}/documents?documentType=reference&latestOnly=true`),
        fetch(`/api/candidates/${candidateId}/documents?documentType=cv&latestOnly=true`),
      ]);

      if (refRes.ok) {
        const refData = await refRes.json();
        setRefDocuments(refData.documents || []);
      }

      if (cvRes.ok) {
        const cvData = await cvRes.json();
        setCvDocuments(cvData.documents || []);
      }
    } catch (err) {
      console.error("Failed to fetch documents:", err);
    } finally {
      setDocsLoading(false);
    }
  }, [candidateId]);

  React.useEffect(() => {
    if (candidateId) {
      fetchDocumentsByType();
    }
  }, [candidateId, fetchDocumentsByType]);

  // Fetch signed URL for CV preview when tab is active
  React.useEffect(() => {
    const latestCV = cvDocuments[0];
    if (latestCV && activeTab === "cv" && !cvSignedUrl) {
      setCvPreviewLoading(true);
      fetch(`/api/documents/${latestCV.id}/download?preview=true`)
        .then(res => res.json())
        .then(data => {
          if (data.url) setCvSignedUrl(data.url);
          setCvPreviewLoading(false);
        })
        .catch(err => {
          console.error("Error fetching CV signed URL:", err);
          setCvPreviewLoading(false);
        });
    }
  }, [cvDocuments, activeTab, cvSignedUrl]);

  // Handle upload modal
  const handleUploadClick = (type?: DocumentType) => {
    setUploadDocType(type);
    setShowUploadModal(true);
  };

  const handleUploadComplete = () => {
    setShowUploadModal(false);
    fetchDocumentsByType();
  };

  // Handle verification callbacks
  const handleVerificationComplete = () => {
    fetchCandidate();
    fetchVerification();
  };

  // Loading state
  if (loading) {
    return (
      <div className="flex flex-1 items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="size-8 animate-spin text-navy-600" />
          <p className="text-gray-600">Loading candidate...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error && !candidate) {
    return (
      <div className="flex flex-1 items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-4 text-center">
          <XCircle className="size-12 text-error-500" />
          <div>
            <h2 className="text-lg font-semibold text-navy-900">Failed to load candidate</h2>
            <p className="text-sm text-gray-600">{error}</p>
          </div>
          <div className="flex gap-2">
            <Button variant="secondary" onClick={() => router.push("/candidates")}>
              Back to Candidates
            </Button>
            <Button variant="primary" onClick={fetchCandidate}>
              Try Again
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (!candidate) return null;

  const initials = `${candidate.first_name?.[0] || ""}${candidate.last_name?.[0] || ""}`.toUpperCase();
  const fullName = `${candidate.first_name || ""} ${candidate.last_name || ""}`.trim();
  const age = calculateAge(candidate.date_of_birth);

  // Parse languages if stored as JSON (field may not exist in all candidate records)
  const languages = candidate.languages || [];

  return (
    <>
      <main className="flex-1 overflow-y-auto">
        {/* Header Section */}
        <header className="border-b border-gray-200 bg-white">
          <div className="mx-auto max-w-6xl px-6 py-6">
            {/* Breadcrumb */}
            <div className="mb-4">
              <Link
                href="/candidates"
                className="inline-flex items-center gap-1 text-sm text-gray-600 hover:text-navy-600"
              >
                <ChevronLeft className="size-4" />
                Back to Candidates
              </Link>
            </div>

            <div className="flex items-start gap-6">
              {/* Profile Photo */}
              <div className="relative shrink-0">
                {candidate.avatar_url ? (
                  <img
                    src={candidate.avatar_url}
                    alt={fullName}
                    className="size-[120px] rounded-2xl object-cover ring-4 ring-gray-100"
                  />
                ) : (
                  <div className="flex size-[120px] items-center justify-center rounded-2xl bg-gradient-to-br from-navy-100 to-navy-200 text-3xl font-bold text-navy-600 ring-4 ring-gray-100">
                    {initials}
                  </div>
                )}
                <div className="absolute -bottom-2 -right-2">
                  <VerificationBadge tier={candidate.verification_tier as VerificationTier} size="lg" />
                </div>
              </div>

              {/* Info */}
              <div className="flex-1">
                <div className="flex items-start justify-between">
                  <div>
                    <h1 className="text-4xl font-serif font-semibold text-navy-800">{fullName}</h1>
                    <p className="mt-1 text-lg text-gray-600">{candidate.primary_position || "Position not set"}</p>
                    <div className="mt-2 flex items-center gap-4 text-sm text-gray-500">
                      {candidate.current_location && (
                        <span className="flex items-center gap-1.5">
                          <MapPin className="size-4" />
                          {candidate.current_location}
                        </span>
                      )}
                      {candidate.nationality && (
                        <span className="flex items-center gap-1.5">
                          <Globe className="size-4" />
                          {candidate.nationality}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    <Button variant="secondary" size="sm" leftIcon={<Edit3 className="size-4" />}>
                      Edit
                    </Button>
                    <Button variant="primary" size="sm" leftIcon={<Briefcase className="size-4" />}>
                      Add to Job
                    </Button>
                    {candidate.phone && (
                      <Button variant="secondary" size="sm" leftIcon={<Phone className="size-4" />}>
                        Call
                      </Button>
                    )}
                    {candidate.email && (
                      <Button variant="ghost" size="sm" leftIcon={<Mail className="size-4" />}>
                        Email
                      </Button>
                    )}
                  </div>
                </div>

                {/* Availability & Contact */}
                <div className="mt-4 flex items-center gap-4">
                  <AvailabilityBadge status={candidate.availability_status as AvailabilityStatus} />
                  {candidate.available_from && (
                    <span className="flex items-center gap-1.5 text-sm text-gray-600">
                      <Calendar className="size-4" />
                      Available from: {formatDate(candidate.available_from)}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="mx-auto max-w-6xl px-6">
            <nav className="flex gap-1">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={cn(
                      "flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-medium transition-colors",
                      activeTab === tab.id
                        ? "border-gold-500 text-navy-900"
                        : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700"
                    )}
                  >
                    <Icon className="size-4" />
                    {tab.label}
                    {tab.id === "certifications" && (
                      <span className="rounded-full bg-gray-100 px-1.5 py-0.5 text-xs">
                        {(candidate.certifications?.length || 0) + certDocuments.length}
                      </span>
                    )}
                    {tab.id === "references" && (
                      <span className="rounded-full bg-gray-100 px-1.5 py-0.5 text-xs">
                        {(candidate.references?.length || 0) + refDocuments.length}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>
          </div>
        </header>

        {/* Tab Content */}
        <div className="mx-auto max-w-6xl px-6 py-6">
          {/* Profile Tab */}
          {activeTab === "profile" && (
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
              {/* Left Column (2/3) */}
              <div className="space-y-6 lg:col-span-2">
                {/* Professional Summary / Generated Bio */}
                {(candidate.bio_full || candidate.bio) && (
                  <div className="rounded-xl border border-gray-200 bg-white p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <h2 className="text-lg font-semibold text-navy-800">Professional Summary</h2>
                        {candidate.bio_generated_at && (
                          <span className="flex items-center gap-1 text-xs text-gray-400">
                            <Sparkles className="size-3" />
                            AI Generated
                          </span>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        leftIcon={<Sparkles className="size-4" />}
                        onClick={async () => {
                          try {
                            const res = await fetch(`/api/candidates/${candidateId}/generate-bio?force=true`, {
                              method: 'POST',
                            });
                            if (res.ok) {
                              fetchCandidate();
                            }
                          } catch (err) {
                            console.error('Failed to regenerate bio:', err);
                          }
                        }}
                      >
                        {candidate.bio_full ? 'Regenerate' : 'Generate Bio'}
                      </Button>
                    </div>
                    <p className="text-sm leading-relaxed text-gray-600 whitespace-pre-wrap">
                      {candidate.bio_full || candidate.bio}
                    </p>
                  </div>
                )}

                {/* Generate Bio Button (when no bio exists) */}
                {!candidate.bio_full && !candidate.bio && (
                  <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 p-6 text-center">
                    <Sparkles className="mx-auto mb-3 size-10 text-gray-400" />
                    <h3 className="text-sm font-medium text-navy-900 mb-1">No Professional Summary</h3>
                    <p className="text-sm text-gray-500 mb-4">Generate an AI-powered professional bio for this candidate</p>
                    <Button
                      variant="secondary"
                      size="sm"
                      leftIcon={<Sparkles className="size-4" />}
                      onClick={async () => {
                        try {
                          const res = await fetch(`/api/candidates/${candidateId}/generate-bio`, {
                            method: 'POST',
                          });
                          if (res.ok) {
                            fetchCandidate();
                          }
                        } catch (err) {
                          console.error('Failed to generate bio:', err);
                        }
                      }}
                    >
                      Generate Bio
                    </Button>
                  </div>
                )}

                {/* Positions */}
                <div className="rounded-xl border border-gray-200 bg-white p-6">
                  <h2 className="mb-4 text-lg font-semibold text-navy-800">Positions</h2>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <span className="rounded-full bg-gold-100 px-3 py-1 text-sm font-medium text-gold-700">
                        Primary
                      </span>
                      <span className="font-medium text-navy-900">{candidate.primary_position || "Not set"}</span>
                    </div>
                    {candidate.secondary_position && (
                      <div className="flex items-center gap-3">
                        <span className="rounded-full bg-gray-100 px-3 py-1 text-sm font-medium text-gray-600">
                          Secondary
                        </span>
                        <span className="text-gray-700">{candidate.secondary_position}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Experience & Preferences */}
                <div className="rounded-xl border border-gray-200 bg-white p-6">
                  <h2 className="mb-4 text-lg font-semibold text-navy-800">Experience & Preferences</h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-5">
                    <div>
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <Clock className="size-4" />
                        Years Experience
                      </div>
                      <p className="mt-1 font-semibold text-navy-900">
                        {candidate.years_experience ? `${candidate.years_experience} years` : "Not set"}
                      </p>
                    </div>
                    <div>
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <Ship className="size-4" />
                        Yacht Size Experience
                      </div>
                      <p className="mt-1 font-semibold text-navy-900">
                        {candidate.yacht_size_experience_min && candidate.yacht_size_experience_max
                          ? `${candidate.yacht_size_experience_min}m - ${candidate.yacht_size_experience_max}m`
                          : "Not set"}
                      </p>
                    </div>
                    <div>
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <DollarSign className="size-4" />
                        Salary Expectations
                      </div>
                      <p className="mt-1 font-semibold text-navy-900">
                        {candidate.desired_salary_min || candidate.desired_salary_max
                          ? `${candidate.salary_currency || "EUR"} ${candidate.desired_salary_min?.toLocaleString("en-US") || "?"} - ${candidate.desired_salary_max?.toLocaleString("en-US") || "?"} /month`
                          : "Not set"}
                      </p>
                    </div>
                    <div>
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <Anchor className="size-4" />
                        Preferred Yacht Type
                      </div>
                      <p className="mt-1 font-semibold text-navy-900">
                        {candidate.preferred_yacht_types?.join(", ") || "Not set"}
                      </p>
                    </div>
                    <div>
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <Ship className="size-4" />
                        Preferred Size Range
                      </div>
                      <p className="mt-1 font-semibold text-navy-900">
                        {candidate.preferred_yacht_size_min && candidate.preferred_yacht_size_max
                          ? `${candidate.preferred_yacht_size_min}m - ${candidate.preferred_yacht_size_max}m`
                          : "Not set"}
                      </p>
                    </div>
                    <div>
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <FileText className="size-4" />
                        Contract Preferences
                      </div>
                      <p className="mt-1 font-semibold text-navy-900">
                        {candidate.preferred_contract_types?.join(", ") || "Not set"}
                      </p>
                    </div>
                  </div>
                </div>

                {/* CV Section */}
                <div className="rounded-xl border border-gray-200 bg-white p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold text-navy-800">CV / Resume</h2>
                    <Button
                      variant="secondary"
                      size="sm"
                      leftIcon={<Upload className="size-4" />}
                      onClick={() => handleUploadClick("cv")}
                    >
                      Update CV
                    </Button>
                  </div>
                  {docsLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="size-6 text-gold-600 animate-spin" />
                    </div>
                  ) : cvDocuments.length > 0 ? (
                    <div className="grid grid-cols-1 gap-4">
                      {cvDocuments.map((doc) => (
                        <DocumentCard
                          key={doc.id}
                          document={doc}
                          isRecruiter={true}
                          showActions={true}
                        />
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
                      <FileText className="mx-auto mb-3 size-10 text-gray-400" />
                      <h3 className="text-sm font-medium text-navy-900">No CV Document</h3>
                      <p className="text-xs text-gray-500 mb-4">Upload the latest version of this candidate's CV</p>
                      <Button
                        variant="secondary"
                        size="sm"
                        leftIcon={<Upload className="size-4" />}
                        onClick={() => handleUploadClick("cv")}
                      >
                        Upload CV
                      </Button>
                    </div>
                  )}
                </div>

                {/* Contact Information */}
                <div className="rounded-xl border border-gray-200 bg-white p-6">
                  <h2 className="mb-4 text-lg font-semibold text-navy-800">Contact Information</h2>
                  <div className="grid grid-cols-2 gap-4">
                    {candidate.email && (
                      <div className="flex items-center gap-3">
                        <Mail className="size-5 text-gray-400" />
                        <div>
                          <p className="text-xs text-gray-500">Email</p>
                          <a href={`mailto:${candidate.email}`} className="text-sm text-navy-600 hover:underline">
                            {candidate.email}
                          </a>
                        </div>
                      </div>
                    )}
                    {candidate.phone && (
                      <div className="flex items-center gap-3">
                        <Phone className="size-5 text-gray-400" />
                        <div>
                          <p className="text-xs text-gray-500">Phone</p>
                          <a href={`tel:${candidate.phone}`} className="text-sm text-navy-600 hover:underline">
                            {candidate.phone}
                          </a>
                        </div>
                      </div>
                    )}
                    {candidate.whatsapp && (
                      <div className="flex items-center gap-3">
                        <MessageSquare className="size-5 text-gray-400" />
                        <div>
                          <p className="text-xs text-gray-500">WhatsApp</p>
                          <span className="text-sm text-navy-900">{candidate.whatsapp}</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Right Column (1/3) */}
              <div className="space-y-6">
                {/* Verification Section */}
                {verificationChecklist && (
                  <VerificationSection
                    candidateId={candidateId}
                    tier={candidate.verification_tier as VerificationTier}
                    checklist={verificationChecklist}
                    progress={verificationProgress}
                    cvUrl={cvDocuments[0]?.fileUrl}
                    idUrl={candidate.id_document_url}
                    onReviewID={() => setIdModalOpen(true)}
                    onVerifyReference={() => {
                      // Find first pending reference
                      const pendingRef = candidate.references?.find(
                        (r) => r.status === "pending"
                      );
                      if (pendingRef) {
                        setSelectedRefForVerify(pendingRef);
                        setRefModalOpen(true);
                      }
                    }}
                  />
                )}

                {/* Personal Details */}
                <div className="rounded-xl border border-gray-200 bg-white p-6">
                  <h2 className="mb-4 text-lg font-semibold text-navy-800">Personal Details</h2>
                  <div className="space-y-3">
                    {candidate.date_of_birth && (
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-500">Date of Birth</span>
                        <span className="text-sm font-medium text-navy-900">
                          {formatDate(candidate.date_of_birth)} {age && `(${age} years)`}
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500">Nationality</span>
                      <span className="text-sm font-medium text-navy-900">
                        {candidate.nationality || "Not set"}
                      </span>
                    </div>
                    {candidate.second_nationality && (
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-500">Second Nationality</span>
                        <span className="text-sm font-medium text-navy-900">
                          {candidate.second_nationality}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Visas & Documents */}
                <div className="rounded-xl border border-gray-200 bg-white p-6">
                  <h2 className="mb-4 text-lg font-semibold text-navy-800">Visas</h2>
                  <div className="space-y-3">
                    {candidate.has_schengen && (
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Shield className="size-4 text-success-500" />
                          <span className="text-sm font-medium text-navy-900">Schengen</span>
                        </div>
                        <Check className="size-4 text-success-500" />
                      </div>
                    )}
                    {candidate.has_b1b2 && (
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Shield className="size-4 text-success-500" />
                          <span className="text-sm font-medium text-navy-900">B1/B2</span>
                        </div>
                        <Check className="size-4 text-success-500" />
                      </div>
                    )}
                    {candidate.has_c1d && (
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Shield className="size-4 text-success-500" />
                          <span className="text-sm font-medium text-navy-900">C1/D</span>
                        </div>
                        <Check className="size-4 text-success-500" />
                      </div>
                    )}
                    {!candidate.has_schengen && !candidate.has_b1b2 && !candidate.has_c1d && (
                      <p className="text-sm text-gray-400">No visas recorded</p>
                    )}
                  </div>
                </div>

                {/* Key Certifications */}
                <div className="rounded-xl border border-gray-200 bg-white p-6">
                  <h2 className="mb-4 text-lg font-semibold text-navy-800">Key Certifications</h2>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <CertStatusIcon status={candidate.has_stcw ? "valid" : "expired"} verified={true} />
                        <span className="text-sm font-medium text-navy-900">STCW</span>
                      </div>
                      {candidate.has_stcw ? (
                        <Check className="size-4 text-success-500" />
                      ) : (
                        <X className="size-4 text-gray-300" />
                      )}
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <CertStatusIcon status={candidate.has_eng1 ? "valid" : "expired"} verified={true} />
                        <span className="text-sm font-medium text-navy-900">ENG1</span>
                      </div>
                      {candidate.has_eng1 ? (
                        <Check className="size-4 text-success-500" />
                      ) : (
                        <X className="size-4 text-gray-300" />
                      )}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full mt-4"
                    onClick={() => setActiveTab("certifications")}
                  >
                    View All Certifications
                  </Button>
                </div>

                {/* Languages */}
                {languages.length > 0 && (
                  <div className="rounded-xl border border-gray-200 bg-white p-6">
                    <h2 className="mb-4 text-lg font-semibold text-navy-800">Languages</h2>
                    <div className="space-y-2">
                      {languages.map((lang: { language: string; proficiency: string }, idx: number) => (
                        <div key={idx} className="flex items-center justify-between">
                          <span className="text-sm text-navy-900">{lang.language}</span>
                          <ProficiencyBadge level={lang.proficiency} />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Personal Preferences */}
                <div className="rounded-xl border border-gray-200 bg-white p-6">
                  <h2 className="mb-4 text-lg font-semibold text-navy-800">Personal Preferences</h2>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-500">Smoker</span>
                      <span className="text-sm font-medium text-navy-900">
                        {candidate.is_smoker === true ? "Yes" : candidate.is_smoker === false ? "No" : "Not set"}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-500">Visible Tattoos</span>
                      <span className="text-sm font-medium text-navy-900">
                        {candidate.has_visible_tattoos === true ? "Yes" : candidate.has_visible_tattoos === false ? "No" : "Not set"}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-500">Part of Couple</span>
                      <span className="text-sm font-medium text-navy-900">
                        {candidate.is_couple === true ? "Yes" : candidate.is_couple === false ? "No" : "Not set"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* CV Tab */}
          {activeTab === "cv" && (
            <div className="flex flex-col gap-6 h-[calc(100vh-280px)]">
              {cvDocuments.length > 0 ? (
                <div className="flex gap-6 h-full">
                  {/* Left: Preview */}
                  <div className="flex-1 rounded-xl border border-gray-200 bg-white overflow-hidden flex flex-col">
                    <div className="border-b border-gray-100 px-6 py-4 flex items-center justify-between bg-gray-50/50">
                      <div className="flex items-center gap-2">
                        <FileText className="size-5 text-navy-600" />
                        <h2 className="text-lg font-semibold text-navy-800">{cvDocuments[0].name}</h2>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          leftIcon={<Download className="size-4" />}
                          onClick={async () => {
                            try {
                              const res = await fetch(`/api/documents/${cvDocuments[0].id}/download`);
                              const data = await res.json();
                              if (data.url) {
                                window.open(data.url, '_blank');
                              }
                            } catch (err) {
                              console.error('Download error:', err);
                            }
                          }}
                        >
                          Download
                        </Button>
                        <Button
                          variant="secondary"
                          size="sm"
                          leftIcon={<Upload className="size-4" />}
                          onClick={() => handleUploadClick("cv")}
                        >
                          Update CV
                        </Button>
                      </div>
                    </div>
                    <div className="flex-1 relative bg-gray-100 p-4 overflow-hidden text-center">
                      {cvPreviewLoading ? (
                        <div className="absolute inset-0 flex items-center justify-center bg-white/50 backdrop-blur-sm z-10">
                          <Loader2 className="size-8 text-gold-600 animate-spin" />
                        </div>
                      ) : cvSignedUrl ? (
                        cvDocuments[0].mimeType === "application/pdf" ? (
                          <iframe
                            src={`${cvSignedUrl}#toolbar=0`}
                            className="w-full h-full rounded-lg border border-gray-200 bg-white shadow-sm"
                            title="CV Preview"
                          />
                        ) : cvDocuments[0].mimeType.startsWith("image/") ? (
                          <div className="w-full h-full flex items-center justify-center">
                            <img
                              src={cvSignedUrl}
                              alt="CV Preview"
                              className="max-w-full max-h-full rounded-lg shadow-sm border border-gray-200 object-contain bg-white"
                            />
                          </div>
                        ) : (
                          <div className="flex flex-col items-center justify-center h-full text-center">
                            <FileText className="size-16 text-gray-300 mb-4" />
                            <h3 className="text-lg font-medium text-navy-900">Preview not available</h3>
                            <p className="text-sm text-gray-500 max-w-xs mt-2">
                              This file type cannot be previewed in the browser. Please download it to view.
                            </p>
                          </div>
                        )
                      ) : (
                        <div className="flex flex-col items-center justify-center h-full text-center">
                          <AlertCircle className="size-16 text-error-200 mb-4" />
                          <h3 className="text-lg font-medium text-navy-900">Failed to load preview</h3>
                          <p className="text-sm text-gray-500 mt-2">
                            There was an error loading the CV preview.
                          </p>
                          <Button
                            variant="secondary"
                            size="sm"
                            className="mt-4"
                            onClick={() => {
                              setCvSignedUrl(null); // This will trigger the useEffect to retry
                            }}
                          >
                            Retry
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex-1 rounded-xl border border-dashed border-gray-300 bg-white p-12 text-center flex flex-col items-center justify-center">
                  <FileText className="mx-auto mb-4 size-16 text-gray-300" />
                  <h3 className="text-xl font-semibold text-navy-900 mb-2">No CV Document</h3>
                  <p className="text-gray-600 mb-8 max-w-sm">
                    This candidate doesn't have a CV uploaded yet. Upload one to start using the network's AI matching features.
                  </p>
                  <Button
                    variant="primary"
                    size="lg"
                    leftIcon={<Upload className="size-5" />}
                    onClick={() => handleUploadClick("cv")}
                  >
                    Upload CV / Resume
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* Bios Tab */}
          {activeTab === "bios" && (
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              {/* Full Bio Section */}
              <div className="rounded-xl border border-gray-200 bg-white">
                <div className="border-b border-gray-100 px-6 py-4 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileText className="size-5 text-navy-600" />
                    <h2 className="text-lg font-semibold text-navy-800">Full Bio</h2>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      leftIcon={<Copy className="size-4" />}
                      onClick={() => {
                        if (candidate.bio_full) {
                          navigator.clipboard.writeText(candidate.bio_full);
                          toast.success("Full bio copied to clipboard");
                        }
                      }}
                    >
                      Copy
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      leftIcon={<Sparkles className="size-4" />}
                      onClick={async () => {
                        try {
                          const res = await fetch(`/api/candidates/${candidateId}/generate-bio?force=true`, {
                            method: 'POST',
                          });
                          if (res.ok) {
                            fetchCandidate();
                            toast.success("Bio regenerated successfully");
                          }
                        } catch (err) {
                          console.error('Failed to regenerate bio:', err);
                          toast.error("Failed to regenerate bio");
                        }
                      }}
                    >
                      Regenerate
                    </Button>
                  </div>
                </div>
                <div className="p-6">
                  {candidate.bio_full ? (
                    <div className="prose prose-sm max-w-none text-gray-600 whitespace-pre-wrap font-serif leading-relaxed text-base italic">
                      {candidate.bio_full}
                    </div>
                  ) : (
                    <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
                      <Sparkles className="mx-auto mb-4 size-10 text-gray-400" />
                      <h3 className="text-sm font-medium text-navy-900 mb-1">No Full Bio Generated</h3>
                      <p className="text-xs text-gray-500 mb-4">Generate an AI-powered bio for this candidate</p>
                      <Button
                        variant="primary"
                        size="sm"
                        leftIcon={<Sparkles className="size-4" />}
                        onClick={async () => {
                          try {
                            const res = await fetch(`/api/candidates/${candidateId}/generate-bio`, {
                              method: 'POST',
                            });
                            if (res.ok) {
                              fetchCandidate();
                              toast.success("Bio generated successfully");
                            }
                          } catch (err) {
                            console.error('Failed to generate bio:', err);
                            toast.error("Failed to generate bio");
                          }
                        }}
                      >
                        Generate Bio
                      </Button>
                    </div>
                  )}
                </div>
              </div>

              {/* Anonymized Bio Section */}
              <div className="rounded-xl border border-gray-200 bg-white">
                <div className="border-b border-gray-100 px-6 py-4 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Shield className="size-5 text-gold-600" />
                    <h2 className="text-lg font-semibold text-navy-800">Anonymized Bio</h2>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    leftIcon={<Copy className="size-4" />}
                    onClick={() => {
                      if (candidate.bio_anonymized) {
                        navigator.clipboard.writeText(candidate.bio_anonymized);
                        toast.success("Anonymized bio copied to clipboard");
                      }
                    }}
                  >
                    Copy
                  </Button>
                </div>
                <div className="p-6">
                  {candidate.bio_anonymized ? (
                    <div className="prose prose-sm max-w-none text-gray-600 whitespace-pre-wrap font-serif leading-relaxed text-base italic">
                      {candidate.bio_anonymized}
                    </div>
                  ) : (
                    <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
                      <Shield className="mx-auto mb-4 size-10 text-gray-300" />
                      <h3 className="text-sm font-medium text-navy-900">No Anonymized Bio</h3>
                      <p className="text-xs text-gray-500">This version is generated automatically when you create a bio.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Certifications Tab */}

          {/* References Tab */}
          {activeTab === "references" && (
            <div className="space-y-6">
              {/* Structured References */}
              {candidate.references && candidate.references.length > 0 ? (
                candidate.references.map((ref) => (
                  <div key={ref.id} className="rounded-xl border border-gray-200 bg-white p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-4">
                        <div className="flex size-12 items-center justify-center rounded-full bg-navy-100 text-lg font-semibold text-navy-600">
                          {ref.referee_name
                            ?.split(" ")
                            .map((n) => n[0])
                            .join("") || "?"}
                        </div>
                        <div>
                          <h3 className="font-semibold text-navy-900">{ref.referee_name}</h3>
                          <p className="text-sm text-gray-600">{ref.referee_position}</p>
                          <p className="text-sm text-gray-500">{ref.referee_company}</p>
                        </div>
                      </div>
                      <ReferenceStatusBadge status={ref.status || "pending"} />
                    </div>

                    <div className="mt-4 flex items-center gap-6 text-sm">
                      {ref.referee_phone && (
                        <a href={`tel:${ref.referee_phone}`} className="flex items-center gap-2 text-gray-600 hover:text-navy-600">
                          <Phone className="size-4" />
                          {ref.referee_phone}
                        </a>
                      )}
                      {ref.referee_email && (
                        <a href={`mailto:${ref.referee_email}`} className="flex items-center gap-2 text-gray-600 hover:text-navy-600">
                          <Mail className="size-4" />
                          {ref.referee_email}
                        </a>
                      )}
                    </div>

                    {ref.notes && (
                      <div className="mt-4 rounded-lg bg-gray-50 p-4">
                        <p className="text-sm text-gray-700">{ref.notes}</p>
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <div className="rounded-xl border border-gray-200 bg-white p-12 text-center">
                  <Users className="mx-auto mb-4 size-12 text-gray-300" />
                  <h3 className="text-lg font-medium text-navy-900 mb-2">No references</h3>
                  <p className="text-gray-600 mb-6">Add references for this candidate</p>
                  <Button variant="secondary" leftIcon={<Plus className="size-4" />}>
                    Add Reference
                  </Button>
                </div>
              )}

              {/* Uploaded Reference Letters */}
              <div className="rounded-xl border border-gray-200 bg-white">
                <div className="border-b border-gray-100 px-6 py-4 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-semibold text-navy-800">Uploaded Reference Letters</h2>
                    {refDocuments.length > 0 && (
                      <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-sm rounded">
                        {refDocuments.length}
                      </span>
                    )}
                  </div>
                  <Button
                    variant="secondary"
                    size="sm"
                    leftIcon={<Upload className="size-4" />}
                    onClick={() => handleUploadClick("reference")}
                  >
                    Upload Document
                  </Button>
                </div>
                <div className="p-6">
                  {docsLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="size-6 text-gold-600 animate-spin" />
                    </div>
                  ) : refDocuments.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {refDocuments.map((doc) => (
                        <DocumentCard
                          key={doc.id}
                          document={doc}
                          isRecruiter={true}
                          showActions={true}
                        />
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <FileCheck className="mx-auto mb-4 size-12 text-gray-300" />
                      <h3 className="text-lg font-medium text-navy-900 mb-2">No reference letters</h3>
                      <p className="text-gray-600 mb-4">Upload reference letters (PDF, images) for this candidate</p>
                      <Button
                        variant="secondary"
                        leftIcon={<Upload className="size-4" />}
                        onClick={() => handleUploadClick("reference")}
                      >
                        Upload Reference Letter
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Documents Tab */}
          {activeTab === "documents" && (
            <div className="space-y-6">
              <DocumentList
                candidateId={candidate.id}
                isRecruiter={true}
                excludeDocumentTypes={["certification"]}
                showStatusBadges={false}
              />
            </div>
          )}

          {/* Notes Tab */}
          {activeTab === "notes" && (
            <div className="space-y-6">
              <div className="rounded-xl border border-gray-200 bg-white p-6">
                <h2 className="mb-4 text-lg font-semibold text-navy-800">Add Note</h2>
                <textarea
                  placeholder="Add interview notes, follow-ups, or general observations..."
                  rows={4}
                  className="w-full rounded-lg border border-gray-300 p-3 text-sm placeholder:text-gray-400 focus:border-gold-500 focus:outline-none focus:ring-2 focus:ring-gold-500/20"
                />
                <div className="mt-3 flex items-center justify-end">
                  <Button variant="primary" size="sm">
                    Add Note
                  </Button>
                </div>
              </div>

              <div className="rounded-xl border border-gray-200 bg-white p-12 text-center">
                <StickyNote className="mx-auto mb-4 size-12 text-gray-300" />
                <h3 className="text-lg font-medium text-navy-900 mb-2">No notes yet</h3>
                <p className="text-gray-600">Add your first note above</p>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* ID Review Modal */}
      {candidate.id_document_url && (
        <IDReviewModal
          open={idModalOpen}
          onOpenChange={setIdModalOpen}
          candidateId={candidateId}
          candidateName={fullName}
          documentUrl={candidate.id_document_url}
          onVerified={handleVerificationComplete}
        />
      )}

      {/* Reference Verify Modal */}
      {selectedRefForVerify && (
        <ReferenceVerifyModal
          open={refModalOpen}
          onOpenChange={(open) => {
            setRefModalOpen(open);
            if (!open) setSelectedRefForVerify(null);
          }}
          referenceId={selectedRefForVerify.id}
          candidateId={candidateId}
          candidateName={fullName}
          candidatePosition={candidate.primary_position || ""}
          refereeName={selectedRefForVerify.referee_name}
          refereePosition={selectedRefForVerify.referee_position}
          refereeCompany={selectedRefForVerify.referee_company}
          refereePhone={selectedRefForVerify.referee_phone}
          refereeEmail={selectedRefForVerify.referee_email}
          datesWorked={selectedRefForVerify.dates_worked || null}
          onVerified={handleVerificationComplete}
        />
      )}

      {/* Document Upload Modal */}
      {showUploadModal && (
        <DocumentUploadModal
          candidateId={candidate.id}
          documentType={uploadDocType}
          onClose={() => setShowUploadModal(false)}
          onUploadComplete={handleUploadComplete}
        />
      )}
    </>
  );
}
