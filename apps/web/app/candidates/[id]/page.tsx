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
  Anchor,
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
  LayoutDashboard,
  Building2,
  Settings,
  HelpCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { VerificationBadge, type VerificationTier } from "@/components/ui/verification-badge";
import { VerificationSection, type VerificationChecklist } from "@/components/verification/VerificationSection";
import { IDReviewModal } from "@/components/verification/IDReviewModal";
import { ReferenceVerifyModal } from "@/components/verification/ReferenceVerifyModal";
import { AvailabilityBadge, type AvailabilityStatus } from "@/components/ui/availability-badge";
import { Sidebar, NavItem } from "@/components/ui/sidebar";
import { TopBar } from "@/components/ui/top-bar";
import { cn } from "@/lib/utils";
import type { CandidateWithRelations, Certification, CandidateReference } from "../../../../../../packages/database/types";

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
  { id: "certifications", label: "Certifications", icon: Award },
  { id: "references", label: "References", icon: Users },
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
  const [candidate, setCandidate] = React.useState<CandidateWithRelations | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [activeTab, setActiveTab] = React.useState("profile");
  const [sidebarCollapsed, setSidebarCollapsed] = React.useState(false);
  const [searchValue, setSearchValue] = React.useState("");

  // Verification state
  const [verificationChecklist, setVerificationChecklist] = React.useState<VerificationChecklist | null>(null);
  const [idModalOpen, setIdModalOpen] = React.useState(false);
  const [refModalOpen, setRefModalOpen] = React.useState(false);
  const [selectedRefForVerify, setSelectedRefForVerify] = React.useState<CandidateReference | null>(null);

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

  // Handle verification callbacks
  const handleVerificationComplete = () => {
    fetchCandidate();
    fetchVerification();
  };

  // Navigation
  const navItems: NavItem[] = [
    { id: "dashboard", label: "Dashboard", icon: <LayoutDashboard className="size-5" />, href: "/dashboard" },
    { id: "briefs", label: "Briefs", icon: <FileText className="size-5" />, href: "/briefs" },
    { id: "jobs", label: "Jobs", icon: <Briefcase className="size-5" />, href: "/jobs" },
    { id: "candidates", label: "Candidates", icon: <Users className="size-5" />, href: "/candidates", active: true },
    { id: "clients", label: "Clients", icon: <Building2 className="size-5" />, href: "/clients" },
  ];

  const bottomNavItems: NavItem[] = [
    { id: "settings", label: "Settings", icon: <Settings className="size-5" />, href: "/settings" },
    { id: "help", label: "Help & Support", icon: <HelpCircle className="size-5" />, href: "/help" },
  ];

  const user = {
    name: "Recruiter",
    email: "user@lighthouse.crew",
    avatar: undefined,
  };

  // Loading state
  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
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
      <div className="flex h-screen items-center justify-center bg-gray-50">
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

  // Parse languages if stored as JSON
  const languages = candidate.languages || [];

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <Sidebar
        logo={
          <div className="flex items-center gap-2">
            <div className="flex size-8 items-center justify-center rounded-lg bg-gold-500">
              <Anchor className="size-5 text-navy-900" />
            </div>
            <span className="font-semibold text-white">Lighthouse</span>
          </div>
        }
        logoCollapsed={
          <div className="flex size-8 items-center justify-center rounded-lg bg-gold-500">
            <Anchor className="size-5 text-navy-900" />
          </div>
        }
        navItems={navItems}
        bottomNavItems={bottomNavItems}
        user={user}
        collapsed={sidebarCollapsed}
        onCollapsedChange={setSidebarCollapsed}
        onLogout={() => console.log("Logout")}
        variant="dark"
      />

      {/* Main Content */}
      <div
        className={cn(
          "flex flex-1 flex-col overflow-hidden transition-all duration-300",
          sidebarCollapsed ? "ml-16" : "ml-[260px]"
        )}
      >
        {/* Top Bar */}
        <TopBar
          user={user}
          notificationCount={0}
          searchValue={searchValue}
          searchPlaceholder="Search..."
          onSearchChange={setSearchValue}
          onNotificationsClick={() => {}}
          onProfileClick={() => {}}
          onSettingsClick={() => {}}
          onLogout={() => {}}
        />

        {/* Content */}
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
                  {candidate.photo_url ? (
                    <img
                      src={candidate.photo_url}
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
                      {tab.id === "certifications" && candidate.certifications && (
                        <span className="rounded-full bg-gray-100 px-1.5 py-0.5 text-xs">
                          {candidate.certifications.length}
                        </span>
                      )}
                      {tab.id === "references" && candidate.references && (
                        <span className="rounded-full bg-gray-100 px-1.5 py-0.5 text-xs">
                          {candidate.references.length}
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
                  {/* Professional Summary */}
                  {candidate.bio && (
                    <div className="rounded-xl border border-gray-200 bg-white p-6">
                      <h2 className="mb-4 text-lg font-semibold text-navy-800">Professional Summary</h2>
                      <p className="text-sm leading-relaxed text-gray-600 whitespace-pre-wrap">{candidate.bio}</p>
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
                    <div className="grid grid-cols-2 gap-6">
                      <div className="space-y-4">
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
                            <Anchor className="size-4" />
                            Preferred Yacht Type
                          </div>
                          <p className="mt-1 font-semibold text-navy-900">
                            {candidate.preferred_yacht_types?.join(", ") || "Not set"}
                          </p>
                        </div>
                      </div>
                      <div className="space-y-4">
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
                        <div>
                          <div className="flex items-center gap-2 text-sm text-gray-500">
                            <DollarSign className="size-4" />
                            Salary Expectations
                          </div>
                          <p className="mt-1 font-semibold text-navy-900">
                            {candidate.salary_expectation_min || candidate.salary_expectation_max
                              ? `${candidate.salary_currency || "EUR"} ${candidate.salary_expectation_min?.toLocaleString() || "?"} - ${candidate.salary_expectation_max?.toLocaleString() || "?"} /month`
                              : "Not set"}
                          </p>
                        </div>
                      </div>
                    </div>
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

            {/* Certifications Tab */}
            {activeTab === "certifications" && (
              <div className="space-y-6">
                <div className="rounded-xl border border-gray-200 bg-white">
                  <div className="border-b border-gray-100 px-6 py-4 flex items-center justify-between">
                    <h2 className="text-lg font-semibold text-navy-800">All Certifications</h2>
                    <Button variant="secondary" size="sm" leftIcon={<Plus className="size-4" />}>
                      Add Certification
                    </Button>
                  </div>
                  <div className="divide-y divide-gray-100">
                    {candidate.certifications && candidate.certifications.length > 0 ? (
                      candidate.certifications.map((cert) => {
                        const status = getCertStatus(cert.expiry_date);
                        return (
                          <div key={cert.id} className="flex items-center justify-between px-6 py-4">
                            <div className="flex items-start gap-4">
                              <CertStatusIcon status={status} verified={cert.verified || false} />
                              <div>
                                <p className="font-medium text-navy-900">{cert.name}</p>
                                <p className="text-sm text-gray-500">{cert.issuer || "Unknown issuer"}</p>
                                {cert.issue_date && (
                                  <p className="text-xs text-gray-400">Issued: {formatDate(cert.issue_date)}</p>
                                )}
                              </div>
                            </div>
                            <div className="text-right">
                              {cert.expiry_date ? (
                                <span
                                  className={cn(
                                    "text-sm",
                                    status === "valid"
                                      ? "text-success-600"
                                      : status === "expiring"
                                      ? "text-warning-600"
                                      : status === "expired"
                                      ? "text-error-600"
                                      : "text-gray-500"
                                  )}
                                >
                                  {status === "expiring" && getDaysUntil(cert.expiry_date)
                                    ? `${getDaysUntil(cert.expiry_date)} days left`
                                    : formatDate(cert.expiry_date)}
                                </span>
                              ) : (
                                <span className="text-sm text-gray-400">No expiry</span>
                              )}
                              {cert.verified && (
                                <p className="text-xs text-success-600 flex items-center gap-1 justify-end mt-1">
                                  <Check className="size-3" />
                                  Verified
                                </p>
                              )}
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <div className="px-6 py-12 text-center">
                        <Award className="mx-auto mb-4 size-12 text-gray-300" />
                        <h3 className="text-lg font-medium text-navy-900 mb-2">No certifications</h3>
                        <p className="text-gray-600">Add certifications for this candidate</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* References Tab */}
            {activeTab === "references" && (
              <div className="space-y-6">
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
      </div>

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
    </div>
  );
}
