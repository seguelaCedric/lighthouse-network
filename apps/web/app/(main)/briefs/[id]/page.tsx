"use client";

import * as React from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ChevronLeft,
  Sparkles,
  ArrowRight,
  Clock,
  Mail,
  MessageSquare,
  Phone,
  User,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Loader2,
  Ship,
  MapPin,
  Calendar,
  DollarSign,
  FileText,
  RefreshCw,
  Edit3,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ConfidenceGauge } from "@/components/ui/confidence-gauge";
import { cn } from "@/lib/utils";
import type { Brief, BriefStatus, CommChannel, BriefParsedData } from "@lighthouse/database";

// Extended Brief type with related data
interface BriefWithDetails extends Brief {
  client?: {
    id: string;
    name: string;
    vessel_name?: string;
    vessel_type?: string;
    vessel_size_meters?: number;
  };
  converted_job?: {
    id: string;
    title: string;
    status: string;
  };
}

// Status configuration
const statusConfig: Record<BriefStatus, { label: string; color: string; bgColor: string; icon: React.ReactNode }> = {
  new: {
    label: "New",
    color: "text-blue-600",
    bgColor: "bg-blue-100",
    icon: <FileText className="size-4" />,
  },
  parsing: {
    label: "Parsing",
    color: "text-purple-600",
    bgColor: "bg-purple-100",
    icon: <Loader2 className="size-4 animate-spin" />,
  },
  parsed: {
    label: "Parsed",
    color: "text-success-600",
    bgColor: "bg-success-100",
    icon: <CheckCircle2 className="size-4" />,
  },
  needs_clarification: {
    label: "Needs Clarification",
    color: "text-warning-600",
    bgColor: "bg-warning-100",
    icon: <AlertTriangle className="size-4" />,
  },
  converted: {
    label: "Converted",
    color: "text-navy-600",
    bgColor: "bg-navy-100",
    icon: <CheckCircle2 className="size-4" />,
  },
  abandoned: {
    label: "Abandoned",
    color: "text-gray-600",
    bgColor: "bg-gray-100",
    icon: <XCircle className="size-4" />,
  },
};

// Source icons
const sourceConfig: Record<CommChannel, { icon: React.ReactNode; label: string }> = {
  email: { icon: <Mail className="size-4" />, label: "Email" },
  whatsapp: { icon: <MessageSquare className="size-4" />, label: "WhatsApp" },
  sms: { icon: <MessageSquare className="size-4" />, label: "SMS" },
  phone: { icon: <Phone className="size-4" />, label: "Phone" },
  platform: { icon: <User className="size-4" />, label: "Platform" },
  in_person: { icon: <User className="size-4" />, label: "In Person" },
};

// Helper functions
function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatTimeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (seconds < 60) return "Just now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
  return formatDate(dateString);
}

// Parsed Data Display Component
function ParsedDataSection({ data }: { data: BriefParsedData }) {
  return (
    <div className="space-y-6">
      {/* Position & Vessel */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="rounded-lg border border-gray-200 bg-white p-4">
          <h4 className="text-sm font-medium text-gray-500 mb-2">Position</h4>
          <p className="text-lg font-semibold text-navy-900">{data.position}</p>
          <span className="inline-block mt-1 rounded-full bg-navy-100 px-2 py-0.5 text-xs font-medium text-navy-700 capitalize">
            {data.positionCategory}
          </span>
        </div>

        <div className="rounded-lg border border-gray-200 bg-white p-4">
          <h4 className="text-sm font-medium text-gray-500 mb-2 flex items-center gap-1">
            <Ship className="size-4" />
            Vessel
          </h4>
          <p className="text-lg font-semibold text-navy-900">
            {data.vessel.name || "Not specified"}
          </p>
          <div className="mt-1 flex flex-wrap gap-2 text-sm text-gray-600">
            {data.vessel.type && (
              <span className="capitalize">{data.vessel.type}</span>
            )}
            {data.vessel.sizeMeters && <span>{data.vessel.sizeMeters}m</span>}
          </div>
        </div>
      </div>

      {/* Contract & Location */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="rounded-lg border border-gray-200 bg-white p-4">
          <h4 className="text-sm font-medium text-gray-500 mb-2 flex items-center gap-1">
            <Calendar className="size-4" />
            Contract
          </h4>
          <div className="space-y-1">
            {data.contract.type && (
              <p className="text-navy-900 capitalize">{data.contract.type}</p>
            )}
            {data.contract.rotation && (
              <p className="text-sm text-gray-600">{data.contract.rotation}</p>
            )}
            {data.contract.startDate && (
              <p className="text-sm text-gray-600">
                Start: {new Date(data.contract.startDate).toLocaleDateString("en-GB")}
              </p>
            )}
            {!data.contract.type && !data.contract.startDate && (
              <p className="text-gray-400">Not specified</p>
            )}
          </div>
        </div>

        <div className="rounded-lg border border-gray-200 bg-white p-4">
          <h4 className="text-sm font-medium text-gray-500 mb-2 flex items-center gap-1">
            <MapPin className="size-4" />
            Location
          </h4>
          <div className="space-y-1">
            {data.location.cruisingAreas.length > 0 && (
              <p className="text-navy-900">{data.location.cruisingAreas.join(", ")}</p>
            )}
            {data.location.base && (
              <p className="text-sm text-gray-600">Base: {data.location.base}</p>
            )}
            {data.location.cruisingAreas.length === 0 && !data.location.base && (
              <p className="text-gray-400">Not specified</p>
            )}
          </div>
        </div>
      </div>

      {/* Compensation */}
      <div className="rounded-lg border border-gray-200 bg-white p-4">
        <h4 className="text-sm font-medium text-gray-500 mb-2 flex items-center gap-1">
          <DollarSign className="size-4" />
          Compensation
        </h4>
        {data.compensation.salaryMin || data.compensation.salaryMax ? (
          <p className="text-lg font-semibold text-navy-900">
            {data.compensation.currency === "EUR" ? "€" : data.compensation.currency === "GBP" ? "£" : "$"}
            {data.compensation.salaryMin?.toLocaleString()}
            {data.compensation.salaryMax && data.compensation.salaryMax !== data.compensation.salaryMin && (
              <> - {data.compensation.currency === "EUR" ? "€" : data.compensation.currency === "GBP" ? "£" : "$"}
              {data.compensation.salaryMax.toLocaleString()}</>
            )}
            <span className="text-sm font-normal text-gray-500"> /month</span>
          </p>
        ) : (
          <p className="text-gray-400">Not specified</p>
        )}
      </div>

      {/* Requirements */}
      <div className="rounded-lg border border-gray-200 bg-white p-4">
        <h4 className="text-sm font-medium text-gray-500 mb-3">Requirements</h4>
        <div className="space-y-3">
          {data.requirements.minExperience && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">Min Experience:</span>
              <span className="font-medium text-navy-900">{data.requirements.minExperience} years</span>
            </div>
          )}

          {data.requirements.certifications.length > 0 && (
            <div>
              <span className="text-sm text-gray-600">Certifications:</span>
              <div className="mt-1 flex flex-wrap gap-1">
                {data.requirements.certifications.map((cert) => (
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

          {data.requirements.languages.length > 0 && (
            <div>
              <span className="text-sm text-gray-600">Languages:</span>
              <div className="mt-1 flex flex-wrap gap-1">
                {data.requirements.languages.map((lang) => (
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

          {data.requirements.other.length > 0 && (
            <div>
              <span className="text-sm text-gray-600">Other:</span>
              <ul className="mt-1 space-y-1">
                {data.requirements.other.map((req, i) => (
                  <li key={i} className="text-sm text-navy-900">• {req}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>

      {/* Ambiguities */}
      {data.ambiguities.length > 0 && (
        <div className="rounded-lg border border-warning-200 bg-warning-50 p-4">
          <h4 className="text-sm font-medium text-warning-700 mb-3 flex items-center gap-2">
            <AlertTriangle className="size-4" />
            Needs Clarification ({data.ambiguities.length})
          </h4>
          <ul className="space-y-3">
            {data.ambiguities.map((ambiguity, i) => (
              <li key={i} className="text-sm">
                <p className="font-medium text-warning-800">{ambiguity.issue}</p>
                <p className="mt-0.5 text-warning-600 italic">
                  Suggested: &ldquo;{ambiguity.suggestedQuestion}&rdquo;
                </p>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

// Main Page Component
export default function BriefDetailPage() {
  const params = useParams();
  const router = useRouter();
  const briefId = params.id as string;

  // State
  const [brief, setBrief] = React.useState<BriefWithDetails | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [parsing, setParsing] = React.useState(false);
  const [converting, setConverting] = React.useState(false);

  // Fetch brief data
  const fetchBrief = React.useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/briefs/${briefId}`);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to fetch brief");
      }

      const data = await response.json();
      setBrief(data.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }, [briefId]);

  React.useEffect(() => {
    if (briefId) {
      fetchBrief();
    }
  }, [briefId, fetchBrief]);

  // Parse brief
  const handleParse = async () => {
    if (!brief) return;

    setParsing(true);
    try {
      const response = await fetch(`/api/briefs/${briefId}/parse`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to parse brief");
      }

      // Refresh brief data
      await fetchBrief();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to parse brief");
    } finally {
      setParsing(false);
    }
  };

  // Convert to job
  const handleConvert = async () => {
    if (!brief || !brief.parsed_data) return;

    setConverting(true);
    try {
      const response = await fetch(`/api/briefs/${briefId}/convert`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to convert brief");
      }

      const data = await response.json();
      // Redirect to the new job
      router.push(`/jobs/${data.data.job.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to convert brief");
      setConverting(false);
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="flex flex-1 items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="size-8 animate-spin text-navy-600" />
          <p className="text-gray-600">Loading brief...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error && !brief) {
    return (
      <div className="flex flex-1 items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-4 text-center">
          <XCircle className="size-12 text-error-500" />
          <div>
            <h2 className="text-lg font-semibold text-navy-900">Failed to load brief</h2>
            <p className="text-sm text-gray-600">{error}</p>
          </div>
          <div className="flex gap-2">
            <Button variant="secondary" onClick={() => router.push("/briefs")}>
              Back to Briefs
            </Button>
            <Button variant="primary" onClick={fetchBrief}>
              Try Again
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (!brief) return null;

  const status = statusConfig[brief.status];
  const source = sourceConfig[brief.source];
  const parsedData = brief.parsed_data as BriefParsedData | null;
  const canParse = brief.status === "new" || brief.status === "needs_clarification";
  const canConvert = brief.status === "parsed" || brief.status === "needs_clarification";
  const isConverted = brief.status === "converted";

  return (
    <main className="flex-1 overflow-y-auto">
          {/* Header */}
          <header className="border-b border-gray-200 bg-white">
            <div className="mx-auto max-w-5xl px-6 py-6">
              {/* Breadcrumb */}
              <div className="mb-4">
                <Link
                  href="/briefs"
                  className="inline-flex items-center gap-1 text-sm text-gray-600 hover:text-navy-600"
                >
                  <ChevronLeft className="size-4" />
                  Back to Briefs
                </Link>
              </div>

              {/* Title Row */}
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <h1 className="text-3xl font-serif font-semibold text-navy-900">
                      Brief from {brief.client?.name || "Unknown Client"}
                    </h1>
                    <span
                      className={cn(
                        "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-medium",
                        status.bgColor,
                        status.color
                      )}
                    >
                      {status.icon}
                      {status.label}
                    </span>
                  </div>

                  {/* Meta */}
                  <div className="mt-2 flex flex-wrap items-center gap-4 text-sm text-gray-600">
                    <span className="flex items-center gap-1">
                      {source.icon}
                      {source.label}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="size-4" />
                      {formatTimeAgo(brief.received_at)}
                    </span>
                    {parsedData && (
                      <span className="font-medium text-navy-700">
                        {parsedData.position}
                      </span>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2">
                  {canParse && (
                    <Button
                      variant="secondary"
                      leftIcon={<Sparkles className="size-4" />}
                      onClick={handleParse}
                      loading={parsing}
                    >
                      {brief.status === "needs_clarification" ? "Re-parse" : "Parse with AI"}
                    </Button>
                  )}
                  {canConvert && (
                    <Link href={`/briefs/${briefId}/convert`}>
                      <Button
                        variant="primary"
                        leftIcon={<ArrowRight className="size-4" />}
                      >
                        Convert to Job
                      </Button>
                    </Link>
                  )}
                  {isConverted && brief.converted_job && (
                    <Link href={`/jobs/${brief.converted_job.id}`}>
                      <Button variant="primary" leftIcon={<ArrowRight className="size-4" />}>
                        View Job
                      </Button>
                    </Link>
                  )}
                </div>
              </div>
            </div>
          </header>

          {/* Error Banner */}
          {error && (
            <div className="mx-auto max-w-5xl px-6 pt-4">
              <div className="rounded-lg border border-error-200 bg-error-50 p-4 text-sm text-error-700">
                {error}
              </div>
            </div>
          )}

          {/* Body */}
          <div className="mx-auto max-w-5xl px-6 py-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Main Content */}
              <div className="lg:col-span-2 space-y-6">
                {/* Raw Content */}
                <div className="rounded-xl border border-gray-200 bg-white p-6">
                  <h2 className="text-lg font-semibold text-navy-900 mb-4">Original Brief</h2>
                  <div className="rounded-lg bg-gray-50 p-4">
                    <p className="text-gray-700 whitespace-pre-wrap">{brief.raw_content}</p>
                  </div>
                </div>

                {/* Parsed Data */}
                {parsedData && (
                  <div className="rounded-xl border border-gray-200 bg-white p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="text-lg font-semibold text-navy-900 flex items-center gap-2">
                        <Sparkles className="size-5 text-gold-500" />
                        AI Parsed Data
                      </h2>
                      <Button
                        variant="ghost"
                        size="sm"
                        leftIcon={<RefreshCw className="size-4" />}
                        onClick={handleParse}
                        loading={parsing}
                        disabled={isConverted}
                      >
                        Re-parse
                      </Button>
                    </div>
                    <ParsedDataSection data={parsedData} />
                  </div>
                )}

                {/* Not Parsed Yet */}
                {!parsedData && !parsing && (
                  <div className="rounded-xl border border-dashed border-gray-300 bg-white p-8 text-center">
                    <Sparkles className="mx-auto mb-4 size-12 text-gray-300" />
                    <h3 className="text-lg font-semibold text-navy-900 mb-2">
                      Brief not yet parsed
                    </h3>
                    <p className="text-gray-600 mb-6">
                      Use AI to extract structured job requirements from this brief
                    </p>
                    <Button
                      variant="primary"
                      leftIcon={<Sparkles className="size-4" />}
                      onClick={handleParse}
                      loading={parsing}
                    >
                      Parse with AI
                    </Button>
                  </div>
                )}
              </div>

              {/* Sidebar */}
              <div className="lg:col-span-1 space-y-6">
                {/* Confidence Score */}
                {brief.parsing_confidence !== null && brief.parsing_confidence !== undefined && (
                  <div className="rounded-xl border border-gray-200 bg-white p-6">
                    <h3 className="text-sm font-medium text-gray-500 mb-4 text-center">
                      Parsing Confidence
                    </h3>
                    <div className="flex justify-center">
                      <ConfidenceGauge value={brief.parsing_confidence} size="lg" />
                    </div>
                    {brief.parsing_confidence < 50 && (
                      <p className="mt-4 text-sm text-center text-warning-600">
                        Low confidence - review parsed data carefully
                      </p>
                    )}
                  </div>
                )}

                {/* Client Info */}
                {brief.client && (
                  <div className="rounded-xl border border-gray-200 bg-white p-6">
                    <h3 className="text-sm font-medium text-gray-500 mb-3">Client</h3>
                    <div className="space-y-2">
                      <p className="font-semibold text-navy-900">{brief.client.name}</p>
                      {brief.client.vessel_name && (
                        <p className="text-sm text-gray-600 flex items-center gap-1">
                          <Ship className="size-4" />
                          {brief.client.vessel_name}
                          {brief.client.vessel_size_meters && ` (${brief.client.vessel_size_meters}m)`}
                        </p>
                      )}
                    </div>
                    <Link href={`/clients/${brief.client.id}`}>
                      <Button variant="ghost" size="sm" className="w-full mt-4">
                        View Client
                      </Button>
                    </Link>
                  </div>
                )}

                {/* Converted Job */}
                {brief.converted_job && (
                  <div className="rounded-xl border border-success-200 bg-success-50 p-6">
                    <h3 className="text-sm font-medium text-success-700 mb-3 flex items-center gap-2">
                      <CheckCircle2 className="size-4" />
                      Converted to Job
                    </h3>
                    <p className="font-semibold text-navy-900">{brief.converted_job.title}</p>
                    <p className="text-sm text-gray-600 capitalize mt-1">
                      Status: {brief.converted_job.status}
                    </p>
                    <Link href={`/jobs/${brief.converted_job.id}`}>
                      <Button variant="secondary" size="sm" className="w-full mt-4">
                        View Job
                      </Button>
                    </Link>
                  </div>
                )}

                {/* Timeline */}
                <div className="rounded-xl border border-gray-200 bg-white p-6">
                  <h3 className="text-sm font-medium text-gray-500 mb-4">Timeline</h3>
                  <div className="space-y-4">
                    <div className="flex items-start gap-3">
                      <div className="mt-1 size-2 rounded-full bg-navy-400" />
                      <div>
                        <p className="text-sm font-medium text-navy-900">Received</p>
                        <p className="text-xs text-gray-500">{formatDate(brief.received_at)}</p>
                      </div>
                    </div>
                    {brief.parsed_at && (
                      <div className="flex items-start gap-3">
                        <div className="mt-1 size-2 rounded-full bg-gold-400" />
                        <div>
                          <p className="text-sm font-medium text-navy-900">Parsed</p>
                          <p className="text-xs text-gray-500">{formatDate(brief.parsed_at)}</p>
                        </div>
                      </div>
                    )}
                    {brief.converted_at && (
                      <div className="flex items-start gap-3">
                        <div className="mt-1 size-2 rounded-full bg-success-400" />
                        <div>
                          <p className="text-sm font-medium text-navy-900">Converted</p>
                          <p className="text-xs text-gray-500">{formatDate(brief.converted_at)}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Danger Zone */}
                {!isConverted && (
                  <div className="rounded-xl border border-gray-200 bg-white p-6">
                    <h3 className="text-sm font-medium text-gray-500 mb-4">Actions</h3>
                    <div className="space-y-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-full justify-start text-gray-600"
                        leftIcon={<Edit3 className="size-4" />}
                      >
                        Edit Brief
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-full justify-start text-error-600 hover:bg-error-50"
                        leftIcon={<Trash2 className="size-4" />}
                      >
                        Delete Brief
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </main>
  );
}
