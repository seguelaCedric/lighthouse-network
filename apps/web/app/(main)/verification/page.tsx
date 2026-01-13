"use client";

import * as React from "react";
import Link from "next/link";
import {
  FileText,
  FileCheck,
  Users,
  Mic,
  Clock,
  Check,
  X,
  Phone,
  Eye,
  Loader2,
  Filter,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { VerificationBadge, type VerificationTier } from "@/components/ui/verification-badge";
import { cn } from "@/lib/utils";
import { IDReviewModal } from "@/components/verification/IDReviewModal";
import { ReferenceVerifyModal } from "@/components/verification/ReferenceVerifyModal";

// Types for pending verifications
interface PendingIDVerification {
  id: string;
  candidate_id: string;
  candidate_name: string;
  candidate_position: string;
  candidate_years_experience: number | null;
  candidate_photo_url: string | null;
  candidate_verification_tier: VerificationTier;
  id_document_url: string;
  uploaded_at: string;
}

interface PendingReference {
  id: string;
  candidate_id: string;
  candidate_name: string;
  candidate_position: string;
  referee_name: string;
  referee_position: string | null;
  referee_company: string | null;
  referee_phone: string | null;
  referee_email: string | null;
  relationship: string | null;
  dates_worked: string | null;
  created_at: string;
}

interface PendingVoiceVerification {
  id: string;
  candidate_name: string;
  candidate_position: string;
  candidate_phone: string | null;
  requested_at: string;
}

type FilterType = "all" | "id" | "reference" | "voice";

// Format relative time
function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

// Get initials from name
function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export default function VerificationQueuePage() {
  const [filter, setFilter] = React.useState<FilterType>("all");
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  // Pending items state
  const [pendingIDs, setPendingIDs] = React.useState<PendingIDVerification[]>([]);
  const [pendingRefs, setPendingRefs] = React.useState<PendingReference[]>([]);
  const [pendingVoice, setPendingVoice] = React.useState<PendingVoiceVerification[]>([]);

  // Modal state
  const [selectedID, setSelectedID] = React.useState<PendingIDVerification | null>(null);
  const [selectedRef, setSelectedRef] = React.useState<PendingReference | null>(null);
  const [idModalOpen, setIdModalOpen] = React.useState(false);
  const [refModalOpen, setRefModalOpen] = React.useState(false);

  // Fetch pending verifications
  const fetchPending = React.useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch("/api/verification/pending");
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to fetch pending verifications");
      }

      const data = await response.json();
      setPendingIDs(data.data.id_documents || []);
      setPendingRefs(data.data.references || []);
      setPendingVoice(data.data.voice || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchPending();
  }, [fetchPending]);

  // Filter counts
  const idCount = pendingIDs.length;
  const refCount = pendingRefs.length;
  const voiceCount = pendingVoice.length;
  const totalCount = idCount + refCount + voiceCount;

  // Handle modal callbacks
  const handleIDVerified = () => {
    setIdModalOpen(false);
    setSelectedID(null);
    fetchPending();
  };

  const handleRefVerified = () => {
    setRefModalOpen(false);
    setSelectedRef(null);
    fetchPending();
  };

  return (
    <>
      <main className="flex-1 overflow-y-auto p-6">
          <div className="mx-auto max-w-5xl">
            {/* Header */}
            <div className="mb-6">
              <h1 className="font-serif text-2xl font-semibold text-navy-800">
                Verification Queue
              </h1>
              <p className="mt-1 text-sm text-gray-600">
                Review and verify candidate references and voice verifications
              </p>
            </div>

            {/* Filter Tabs */}
            <div className="mb-6 flex items-center gap-2">
              <Filter className="size-4 text-gray-400" />
              <div className="flex gap-1 rounded-lg bg-gray-100 p-1">
                <button
                  onClick={() => setFilter("all")}
                  className={cn(
                    "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                    filter === "all"
                      ? "bg-white text-navy-900 shadow-sm"
                      : "text-gray-600 hover:text-navy-900"
                  )}
                >
                  All ({totalCount})
                </button>
                <button
                  onClick={() => setFilter("id")}
                  className={cn(
                    "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                    filter === "id"
                      ? "bg-white text-navy-900 shadow-sm"
                      : "text-gray-600 hover:text-navy-900"
                  )}
                >
                  ID Documents ({idCount})
                </button>
                <button
                  onClick={() => setFilter("reference")}
                  className={cn(
                    "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                    filter === "reference"
                      ? "bg-white text-navy-900 shadow-sm"
                      : "text-gray-600 hover:text-navy-900"
                  )}
                >
                  References ({refCount})
                </button>
                <button
                  onClick={() => setFilter("voice")}
                  className={cn(
                    "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                    filter === "voice"
                      ? "bg-white text-navy-900 shadow-sm"
                      : "text-gray-600 hover:text-navy-900"
                  )}
                >
                  Voice ({voiceCount})
                </button>
              </div>
            </div>

            {/* Loading State */}
            {loading && (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="size-8 animate-spin text-gray-400" />
              </div>
            )}

            {/* Error State */}
            {error && !loading && (
              <div className="rounded-lg border border-error-200 bg-error-50 p-4 text-center">
                <p className="text-sm text-error-700">{error}</p>
                <Button variant="secondary" size="sm" className="mt-2" onClick={fetchPending}>
                  Try Again
                </Button>
              </div>
            )}

            {/* Empty State */}
            {!loading && !error && totalCount === 0 && (
              <div className="rounded-xl border border-gray-200 bg-white p-12 text-center">
                <Check className="mx-auto mb-4 size-12 text-success-500" />
                <h3 className="text-lg font-medium text-navy-900">All caught up!</h3>
                <p className="mt-1 text-gray-600">
                  No pending verifications at the moment.
                </p>
              </div>
            )}

            {/* ID Documents Section */}
            {!loading && !error && (filter === "all" || filter === "id") && idCount > 0 && (
              <section className="mb-8">
                <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-gray-500">
                  <FileText className="size-4" />
                  ID Documents Pending ({idCount})
                </h2>
                <div className="space-y-3">
                  {pendingIDs.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between rounded-xl border border-gray-200 bg-white p-4 transition-shadow hover:shadow-sm"
                    >
                      <div className="flex items-center gap-4">
                        {/* Avatar */}
                        <div className="relative">
                          {item.candidate_photo_url ? (
                            <img
                              src={item.candidate_photo_url}
                              alt={item.candidate_name}
                              className="size-12 rounded-full object-cover ring-2 ring-gray-100"
                            />
                          ) : (
                            <div className="flex size-12 items-center justify-center rounded-full bg-gradient-to-br from-navy-100 to-navy-200 text-sm font-semibold text-navy-600 ring-2 ring-gray-100">
                              {getInitials(item.candidate_name)}
                            </div>
                          )}
                          <div className="absolute -bottom-1 -right-1">
                            <VerificationBadge tier={item.candidate_verification_tier} size="sm" />
                          </div>
                        </div>

                        {/* Info */}
                        <div>
                          <h3 className="font-medium text-navy-900">{item.candidate_name}</h3>
                          <p className="text-sm text-gray-600">
                            {item.candidate_position}
                            {item.candidate_years_experience && (
                              <span> &middot; {item.candidate_years_experience} years</span>
                            )}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <span className="flex items-center gap-1 text-xs text-gray-500">
                          <Clock className="size-3" />
                          Uploaded {formatRelativeTime(item.uploaded_at)}
                        </span>
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => {
                            setSelectedID(item);
                            setIdModalOpen(true);
                          }}
                        >
                          <Eye className="mr-1.5 size-4" />
                          View Document
                        </Button>
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => {
                            setSelectedID(item);
                            setIdModalOpen(true);
                          }}
                        >
                          <Check className="mr-1.5 size-4" />
                          Review
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* References Section */}
            {!loading && !error && (filter === "all" || filter === "reference") && refCount > 0 && (
              <section className="mb-8">
                <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-gray-500">
                  <Users className="size-4" />
                  References Pending ({refCount})
                </h2>
                <div className="space-y-3">
                  {pendingRefs.map((ref) => (
                    <div
                      key={ref.id}
                      className="rounded-xl border border-gray-200 bg-white p-4 transition-shadow hover:shadow-sm"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="text-sm text-gray-500">
                            Reference for:{" "}
                            <Link
                              href={`/candidates/${ref.candidate_id}`}
                              className="font-medium text-navy-600 hover:underline"
                            >
                              {ref.candidate_name}
                            </Link>
                            <span className="text-gray-400"> ({ref.candidate_position})</span>
                          </p>
                          <div className="mt-2 flex items-center gap-2">
                            <ChevronRight className="size-4 text-gray-400" />
                            <div>
                              <h3 className="font-medium text-navy-900">{ref.referee_name}</h3>
                              <p className="text-sm text-gray-600">
                                {ref.referee_position && <span>{ref.referee_position}</span>}
                                {ref.referee_company && (
                                  <span>
                                    {ref.referee_position && ", "}
                                    {ref.referee_company}
                                  </span>
                                )}
                              </p>
                            </div>
                          </div>
                          {(ref.referee_phone || ref.referee_email) && (
                            <p className="mt-1 text-sm text-gray-500">
                              Contact: {ref.referee_phone || ref.referee_email}
                            </p>
                          )}
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="text-xs text-gray-500">
                            Added {formatRelativeTime(ref.created_at)}
                          </span>
                        </div>
                      </div>

                      <div className="mt-4 flex items-center gap-2 border-t border-gray-100 pt-4">
                        {ref.referee_phone && (
                          <Button variant="secondary" size="sm">
                            <Phone className="mr-1.5 size-4" />
                            Call with Vapi
                          </Button>
                        )}
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => {
                            setSelectedRef(ref);
                            setRefModalOpen(true);
                          }}
                        >
                          Manual Verify
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-error-600 hover:bg-error-50 hover:text-error-700"
                        >
                          <X className="mr-1.5 size-4" />
                          Mark Failed
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Voice Verification Section */}
            {!loading && !error && (filter === "all" || filter === "voice") && voiceCount > 0 && (
              <section className="mb-8">
                <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-gray-500">
                  <Mic className="size-4" />
                  Voice Verification Pending ({voiceCount})
                </h2>
                <div className="space-y-3">
                  {pendingVoice.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between rounded-xl border border-gray-200 bg-white p-4 transition-shadow hover:shadow-sm"
                    >
                      <div>
                        <h3 className="font-medium text-navy-900">{item.candidate_name}</h3>
                        <p className="text-sm text-gray-600">{item.candidate_position}</p>
                        {item.candidate_phone && (
                          <p className="mt-1 text-sm text-gray-500">{item.candidate_phone}</p>
                        )}
                      </div>

                      <div className="flex items-center gap-3">
                        <span className="text-xs text-gray-500">
                          Requested {formatRelativeTime(item.requested_at)}
                        </span>
                        <Button variant="primary" size="sm">
                          <Mic className="mr-1.5 size-4" />
                          Start Vapi Call
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>
        </main>

      {/* ID Review Modal */}
      {selectedID && (
        <IDReviewModal
          open={idModalOpen}
          onOpenChange={setIdModalOpen}
          candidateId={selectedID.candidate_id}
          candidateName={selectedID.candidate_name}
          documentUrl={selectedID.id_document_url}
          onVerified={handleIDVerified}
        />
      )}

      {/* Reference Verify Modal */}
      {selectedRef && (
        <ReferenceVerifyModal
          open={refModalOpen}
          onOpenChange={setRefModalOpen}
          referenceId={selectedRef.id}
          candidateId={selectedRef.candidate_id}
          candidateName={selectedRef.candidate_name}
          candidatePosition={selectedRef.candidate_position}
          refereeName={selectedRef.referee_name}
          refereePosition={selectedRef.referee_position}
          refereeCompany={selectedRef.referee_company}
          refereePhone={selectedRef.referee_phone}
          refereeEmail={selectedRef.referee_email}
          datesWorked={selectedRef.dates_worked}
          onVerified={handleRefVerified}
        />
      )}
    </>
  );
}
