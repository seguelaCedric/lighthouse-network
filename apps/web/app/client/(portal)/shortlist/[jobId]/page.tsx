"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  Check,
  ChevronDown,
  Download,
  Mail,
  Phone,
  Bookmark,
  BookmarkCheck,
  ThumbsDown,
  Eye,
  Calendar,
  X,
  Star,
  Shield,
  Award,
  Sparkles,
  CheckCircle2,
  Users,
  MessageSquare,
  Loader2,
} from "lucide-react";

// Types
interface Candidate {
  submissionId: string;
  candidateId: string;
  firstName: string;
  lastInitial: string;
  primaryPosition: string;
  yearsExperience: number;
  currentLocation: string;
  verificationTier: "premium" | "verified" | "basic";
  profileSummary: string;
  matchScore: number;
  matchReasoning: string;
  coverNote: string;
  status: string;
  submittedAt: string;
  viewedAt: string | null;
  feedback: {
    rating: string;
    notes: string | null;
  } | null;
  savedForLater?: boolean;
}

interface JobDetails {
  id: string;
  title: string;
  vesselName: string;
  status: string;
}

interface ShortlistData {
  job: JobDetails;
  candidates: Candidate[];
  totalCount: number;
}

// Verification badge component
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
        "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium",
        badge.className
      )}
    >
      <Icon className="size-3" />
      {badge.label}
    </span>
  );
}

// Match percentage badge
function MatchBadge({ percentage }: { percentage: number }) {
  return (
    <div className="flex items-center gap-1.5 rounded-full bg-navy-900 px-3 py-1">
      <Sparkles className="size-3.5 text-gold-400" />
      <span className="text-sm font-bold text-white">{percentage}%</span>
      <span className="text-xs text-gray-300">match</span>
    </div>
  );
}

// Feedback modal
function FeedbackModal({
  candidate,
  onClose,
  onSubmit,
  isSubmitting,
}: {
  candidate: Candidate;
  onClose: () => void;
  onSubmit: (reason: string, notes: string) => void;
  isSubmitting: boolean;
}) {
  const [reason, setReason] = useState("");
  const [notes, setNotes] = useState("");

  const reasons = [
    { value: "experience", label: "Not enough experience" },
    { value: "skills", label: "Missing required skills" },
    { value: "availability", label: "Availability doesn't match" },
    { value: "salary", label: "Salary expectations too high" },
    { value: "location", label: "Location/visa issues" },
    { value: "other", label: "Other reason" },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-gray-100 p-4">
          <div>
            <h3 className="font-semibold text-navy-900">Mark as Not Suitable</h3>
            <p className="text-sm text-gray-500">
              {candidate.firstName} {candidate.lastInitial}.
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
          >
            <X className="size-5" />
          </button>
        </div>

        <div className="p-4">
          <div className="mb-4">
            <label className="mb-1.5 block text-sm font-medium text-navy-900">
              Reason <span className="text-burgundy-500">*</span>
            </label>
            <div className="relative">
              <select
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full appearance-none rounded-lg border border-gray-200 bg-white px-4 py-2.5 pr-10 text-sm text-navy-900 focus:border-gold-500 focus:outline-none focus:ring-2 focus:ring-gold-500/20"
              >
                <option value="">Select a reason...</option>
                {reasons.map((r) => (
                  <option key={r.value} value={r.value}>
                    {r.label}
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-gray-400" />
            </div>
          </div>

          <div className="mb-4">
            <label className="mb-1.5 block text-sm font-medium text-navy-900">
              Additional Notes <span className="text-gray-400">(optional)</span>
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder="Any specific feedback that would help us improve future matches..."
              className="w-full resize-none rounded-lg border border-gray-200 px-4 py-2.5 text-sm text-navy-900 placeholder:text-gray-400 focus:border-gold-500 focus:outline-none focus:ring-2 focus:ring-gold-500/20"
            />
          </div>

          <div className="rounded-lg bg-blue-50 p-3">
            <p className="text-xs text-blue-700">
              <strong>Your feedback matters:</strong> This helps our AI improve future candidate
              matching and ensures we find you the perfect crew member.
            </p>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 border-t border-gray-100 p-4">
          <Button variant="secondary" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={() => onSubmit(reason, notes)}
            disabled={!reason || isSubmitting}
            className="bg-burgundy-600 hover:bg-burgundy-700"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 size-4 animate-spin" />
                Submitting...
              </>
            ) : (
              "Submit Feedback"
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}

// Candidate card component
function CandidateCard({
  candidate,
  isSelected,
  onToggleSelect,
  onRequestInterview,
  onNotSuitable,
  onToggleSave,
  onViewProfile,
  onDownloadCv,
  isRequestingInterview,
  isDownloadingCv,
}: {
  candidate: Candidate;
  isSelected: boolean;
  onToggleSelect: () => void;
  onRequestInterview: () => void;
  onNotSuitable: () => void;
  onToggleSave: () => void;
  onViewProfile: () => void;
  onDownloadCv: () => void;
  isRequestingInterview: boolean;
  isDownloadingCv: boolean;
}) {
  const initials = `${candidate.firstName[0]}${candidate.lastInitial}`;

  // Parse match reasoning into structured data
  const whyRecommended = candidate.matchReasoning
    ? candidate.matchReasoning.split("\n").filter((line) => line.trim())
    : [];

  return (
    <div
      className={cn(
        "rounded-2xl border bg-white transition-all",
        isSelected ? "border-gold-400 ring-2 ring-gold-400/20" : "border-gray-200"
      )}
    >
      {/* Card Header */}
      <div className="flex items-start gap-4 p-5">
        {/* Selection Checkbox */}
        <button
          onClick={onToggleSelect}
          className={cn(
            "mt-1 flex size-5 shrink-0 items-center justify-center rounded border-2 transition-colors",
            isSelected
              ? "border-gold-500 bg-gold-500 text-white"
              : "border-gray-300 hover:border-gold-400"
          )}
        >
          {isSelected && <Check className="size-3" />}
        </button>

        {/* Profile Photo */}
        <div className="relative shrink-0">
          <div className="flex size-16 items-center justify-center rounded-full bg-gradient-to-br from-navy-500 to-navy-700 text-lg font-bold text-white">
            {initials}
          </div>
          {candidate.verificationTier === "premium" && (
            <div className="absolute -bottom-1 -right-1 rounded-full bg-gold-500 p-1">
              <Star className="size-3 fill-white text-white" />
            </div>
          )}
        </div>

        {/* Basic Info */}
        <div className="min-w-0 flex-1">
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <h3 className="text-lg font-semibold text-navy-900">
              {candidate.firstName} {candidate.lastInitial}.
            </h3>
            <VerificationBadge level={candidate.verificationTier} />
            <MatchBadge percentage={candidate.matchScore} />
          </div>
          <p className="font-medium text-navy-700">{candidate.primaryPosition}</p>
          <p className="text-sm text-gray-500">
            {candidate.yearsExperience} years experience • {candidate.currentLocation}
          </p>
        </div>

        {/* Save Button */}
        <button
          onClick={onToggleSave}
          className={cn(
            "shrink-0 rounded-lg p-2 transition-colors",
            candidate.savedForLater
              ? "bg-gold-100 text-gold-600"
              : "text-gray-400 hover:bg-gray-100 hover:text-gray-600"
          )}
        >
          {candidate.savedForLater ? (
            <BookmarkCheck className="size-5" />
          ) : (
            <Bookmark className="size-5" />
          )}
        </button>
      </div>

      {/* AI Summary */}
      {candidate.profileSummary && (
        <div className="border-t border-gray-100 px-5 py-4">
          <div className="mb-2 flex items-center gap-2">
            <Sparkles className="size-4 text-gold-500" />
            <span className="text-xs font-semibold uppercase tracking-wide text-gold-600">
              AI Summary
            </span>
          </div>
          <p className="text-sm leading-relaxed text-gray-600">{candidate.profileSummary}</p>
        </div>
      )}

      {/* Recruiter Note */}
      {candidate.coverNote && (
        <div className="border-t border-gray-100 px-5 py-4">
          <div className="mb-2 flex items-center gap-2">
            <MessageSquare className="size-4 text-navy-500" />
            <span className="text-xs font-semibold uppercase tracking-wide text-navy-600">
              Recruiter's Note
            </span>
          </div>
          <p className="text-sm leading-relaxed text-gray-600">{candidate.coverNote}</p>
        </div>
      )}

      {/* Match Highlights */}
      {whyRecommended.length > 0 && (
        <div className="border-t border-gray-100 p-5">
          <h4 className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-navy-900">
            <CheckCircle2 className="size-4 text-success-500" />
            Why Recommended
          </h4>
          <ul className="space-y-1">
            {whyRecommended.slice(0, 4).map((reason, i) => (
              <li key={i} className="flex items-start gap-2 text-xs text-gray-600">
                <span className="mt-1.5 size-1 shrink-0 rounded-full bg-gray-400" />
                {reason}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Feedback Status */}
      {candidate.feedback && (
        <div className="border-t border-gray-100 bg-gray-50 px-5 py-3">
          <div className="flex items-center gap-2">
            <span
              className={cn(
                "rounded-full px-2 py-0.5 text-xs font-medium",
                candidate.feedback.rating === "interested"
                  ? "bg-success-100 text-success-700"
                  : candidate.feedback.rating === "maybe"
                  ? "bg-warning-100 text-warning-700"
                  : "bg-gray-100 text-gray-600"
              )}
            >
              {candidate.feedback.rating === "interested"
                ? "Interested"
                : candidate.feedback.rating === "maybe"
                ? "Maybe"
                : "Not Suitable"}
            </span>
            {candidate.feedback.notes && (
              <span className="text-xs text-gray-500">
                "{candidate.feedback.notes}"
              </span>
            )}
          </div>
        </div>
      )}

      {/* Actions */}
      {!candidate.feedback && (
        <div className="flex flex-wrap items-center gap-2 border-t border-gray-100 bg-gray-50/50 p-4">
          <Button variant="secondary" size="sm" className="gap-1.5" onClick={onViewProfile}>
            <Eye className="size-4" />
            View Full Profile
          </Button>
          <Button
            variant="secondary"
            size="sm"
            className="gap-1.5"
            onClick={onDownloadCv}
            disabled={isDownloadingCv}
          >
            {isDownloadingCv ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Download className="size-4" />
            )}
            CV
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={onRequestInterview}
            disabled={isRequestingInterview}
            className="gap-1.5"
          >
            {isRequestingInterview ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Requesting...
              </>
            ) : (
              <>
                <Calendar className="size-4" />
                Request Interview
              </>
            )}
          </Button>
          <div className="flex-1" />
          <button
            onClick={onNotSuitable}
            className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium text-gray-500 hover:bg-gray-100 hover:text-burgundy-600"
          >
            <ThumbsDown className="size-4" />
            Not Suitable
          </button>
        </div>
      )}
    </div>
  );
}

// Loading skeleton
function ShortlistSkeleton() {
  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="mx-auto max-w-6xl">
        <div className="mb-6 h-20 animate-pulse rounded-xl bg-gray-200" />
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-64 animate-pulse rounded-2xl bg-gray-200" />
          ))}
        </div>
      </div>
    </div>
  );
}

// Main page component
export default function ShortlistPage() {
  const params = useParams();
  const router = useRouter();
  const jobId = params.jobId as string;

  const [data, setData] = useState<ShortlistData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [feedbackCandidate, setFeedbackCandidate] = useState<Candidate | null>(null);
  const [isSubmittingFeedback, setIsSubmittingFeedback] = useState(false);
  const [requestingInterviewId, setRequestingInterviewId] = useState<string | null>(null);
  const [downloadingCvId, setDownloadingCvId] = useState<string | null>(null);
  const [savedCandidates, setSavedCandidates] = useState<Set<string>>(new Set());

  useEffect(() => {
    const fetchShortlist = async () => {
      try {
        const response = await fetch(`/api/client/jobs/${jobId}/shortlist`);
        if (!response.ok) {
          throw new Error("Failed to fetch shortlist");
        }
        const result = await response.json();
        setData(result.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setLoading(false);
      }
    };

    fetchShortlist();
  }, [jobId]);

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (!data) return;
    if (selectedIds.length === data.candidates.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(data.candidates.map((c) => c.submissionId));
    }
  };

  const toggleSave = (id: string) => {
    setSavedCandidates((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const handleFeedbackSubmit = async (reason: string, notes: string) => {
    if (!feedbackCandidate) return;

    setIsSubmittingFeedback(true);
    try {
      const response = await fetch(`/api/client/jobs/${jobId}/feedback`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          submissionId: feedbackCandidate.submissionId,
          rating: "not_suitable",
          notes,
          rejectionReason: reason,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to submit feedback");
      }

      // Update local state
      setData((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          candidates: prev.candidates.map((c) =>
            c.submissionId === feedbackCandidate.submissionId
              ? { ...c, feedback: { rating: "not_suitable", notes } }
              : c
          ),
        };
      });
      setSelectedIds((prev) => prev.filter((id) => id !== feedbackCandidate.submissionId));
      setFeedbackCandidate(null);
    } catch (err) {
      console.error("Error submitting feedback:", err);
    } finally {
      setIsSubmittingFeedback(false);
    }
  };

  const handleRequestInterview = async (candidate: Candidate) => {
    setRequestingInterviewId(candidate.submissionId);
    try {
      const response = await fetch("/api/client/interviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          submissionId: candidate.submissionId,
          jobId,
          requestedType: "video",
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to request interview");
      }

      // Update local state to show feedback given
      setData((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          candidates: prev.candidates.map((c) =>
            c.submissionId === candidate.submissionId
              ? { ...c, feedback: { rating: "interested", notes: "Interview requested" } }
              : c
          ),
        };
      });
    } catch (err) {
      console.error("Error requesting interview:", err);
    } finally {
      setRequestingInterviewId(null);
    }
  };

  const handleDownloadCv = async (candidate: Candidate) => {
    setDownloadingCvId(candidate.candidateId);
    try {
      const response = await fetch(`/api/client/candidates/${candidate.candidateId}/cv`);
      if (!response.ok) {
        throw new Error("Failed to get CV download link");
      }
      const result = await response.json();
      // Open download URL in new tab
      window.open(result.data.downloadUrl, "_blank");
    } catch (err) {
      console.error("Error downloading CV:", err);
    } finally {
      setDownloadingCvId(null);
    }
  };

  const handleViewProfile = (candidate: Candidate) => {
    router.push(`/client/candidate/${candidate.candidateId}`);
  };

  if (loading) {
    return <ShortlistSkeleton />;
  }

  if (error || !data) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500">{error || "Failed to load shortlist"}</p>
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

  const candidates = data.candidates.map((c) => ({
    ...c,
    savedForLater: savedCandidates.has(c.submissionId),
  }));

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-gray-200 bg-white">
        <div className="mx-auto max-w-6xl px-4 py-4 sm:px-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link
                href="/client/dashboard"
                className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-700"
              >
                <ArrowLeft className="size-5" />
              </Link>
              <div>
                <h1 className="text-4xl font-serif font-semibold text-navy-800">
                  {data.job.title}
                </h1>
                <p className="text-sm text-gray-500">{data.job.vesselName}</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Shortlist Info Bar */}
      <div className="border-b border-gray-200 bg-white">
        <div className="mx-auto max-w-6xl px-4 py-3 sm:px-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 rounded-full bg-gold-100 px-3 py-1.5">
                <Users className="size-4 text-gold-600" />
                <span className="text-sm font-semibold text-gold-700">
                  {data.totalCount} candidates
                </span>
              </div>
              <span className="text-sm text-gray-500">shortlisted for your review</span>
            </div>

            {/* Bulk Actions */}
            {selectedIds.length > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-500">{selectedIds.length} selected</span>
                <Button variant="primary" size="sm" className="gap-1.5">
                  <Calendar className="size-4" />
                  Request Interviews
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
        {/* Select All / Bulk Actions Bar */}
        <div className="mb-4 flex items-center justify-between">
          <label className="flex cursor-pointer items-center gap-2">
            <button
              onClick={toggleSelectAll}
              className={cn(
                "flex size-5 items-center justify-center rounded border-2 transition-colors",
                selectedIds.length === candidates.length && candidates.length > 0
                  ? "border-gold-500 bg-gold-500 text-white"
                  : selectedIds.length > 0
                    ? "border-gold-500 bg-gold-100"
                    : "border-gray-300 hover:border-gold-400"
              )}
            >
              {selectedIds.length === candidates.length && candidates.length > 0 && (
                <Check className="size-3" />
              )}
              {selectedIds.length > 0 && selectedIds.length < candidates.length && (
                <div className="size-2 rounded-sm bg-gold-500" />
              )}
            </button>
            <span className="text-sm font-medium text-gray-700">
              {selectedIds.length === candidates.length && candidates.length > 0
                ? "Deselect All"
                : "Select All"}
            </span>
          </label>

          <Button variant="secondary" size="sm" className="gap-1.5">
            <Download className="size-4" />
            Download Shortlist PDF
          </Button>
        </div>

        {/* Candidates List */}
        <div className="space-y-4">
          {candidates.map((candidate) => (
            <CandidateCard
              key={candidate.submissionId}
              candidate={candidate}
              isSelected={selectedIds.includes(candidate.submissionId)}
              onToggleSelect={() => toggleSelect(candidate.submissionId)}
              onRequestInterview={() => handleRequestInterview(candidate)}
              onNotSuitable={() => setFeedbackCandidate(candidate)}
              onToggleSave={() => toggleSave(candidate.submissionId)}
              onViewProfile={() => handleViewProfile(candidate)}
              onDownloadCv={() => handleDownloadCv(candidate)}
              isRequestingInterview={requestingInterviewId === candidate.submissionId}
              isDownloadingCv={downloadingCvId === candidate.candidateId}
            />
          ))}
        </div>

        {/* Empty State */}
        {candidates.length === 0 && (
          <div className="rounded-2xl border border-dashed border-gray-300 bg-white py-16 text-center">
            <Users className="mx-auto mb-4 size-12 text-gray-300" />
            <h3 className="mb-2 text-lg font-semibold text-navy-900">No candidates yet</h3>
            <p className="mb-4 text-sm text-gray-500">
              We're working on finding candidates for this position.
            </p>
            <Button variant="secondary">
              <MessageSquare className="mr-2 size-4" />
              Contact Recruiter
            </Button>
          </div>
        )}

        {/* Help Text */}
        <div className="mt-8 rounded-xl bg-navy-50 p-4">
          <h4 className="mb-1 font-medium text-navy-900">Privacy Protected</h4>
          <p className="text-sm text-navy-700">
            Candidate full names and detailed contact information are protected until you request
            their full profile or schedule an interview. This ensures candidate privacy while
            allowing you to make informed decisions based on their qualifications and experience.
          </p>
        </div>
      </main>

      {/* Feedback Modal */}
      {feedbackCandidate && (
        <FeedbackModal
          candidate={feedbackCandidate}
          onClose={() => setFeedbackCandidate(null)}
          onSubmit={handleFeedbackSubmit}
          isSubmitting={isSubmittingFeedback}
        />
      )}
    </div>
  );
}
