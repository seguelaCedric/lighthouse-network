"use client";

import * as React from "react";
import { Loader2, AlertCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  ShortlistBuilder,
  type ShortlistCandidate,
} from "@/components/shortlist/ShortlistBuilder";
import type { VerificationTier } from "@/components/ui/verification-badge";
import type { AvailabilityStatus } from "@/components/ui/availability-badge";

interface ShortlistTabProps {
  jobId: string;
  jobTitle: string;
}

interface ShortlistApiResponse {
  candidates: Array<{
    applicationId: string;
    candidateId: string;
    shortlistRank: number | null;
    shortlistNotes: string | null;
    matchScore: number | null;
    aiMatchReasoning: string | null;
    candidateSource: string | null;
    shortlistedAt: string | null;
    candidate: {
      id: string;
      firstName: string;
      lastName: string;
      email: string | null;
      phone: string | null;
      photoUrl: string | null;
      primaryPosition: string | null;
      yearsExperience: number | null;
      nationality: string | null;
      verificationTier: VerificationTier;
      availabilityStatus: AvailabilityStatus;
    };
  }>;
  updatedAt: string;
}

export function ShortlistTab({ jobId, jobTitle }: ShortlistTabProps) {
  const [candidates, setCandidates] = React.useState<ShortlistCandidate[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [isSaving, setIsSaving] = React.useState(false);

  // Fetch shortlist data
  const fetchShortlist = React.useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/jobs/${jobId}/shortlist`);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to fetch shortlist");
      }

      const data: ShortlistApiResponse = await response.json();

      // Transform API response to ShortlistCandidate format
      const transformedCandidates: ShortlistCandidate[] = data.candidates.map(
        (item) => ({
          id: item.candidateId,
          applicationId: item.applicationId,
          name: `${item.candidate.firstName} ${item.candidate.lastName}`,
          photo: item.candidate.photoUrl || undefined,
          position: item.candidate.primaryPosition || "Position not set",
          email: item.candidate.email || undefined,
          phone: item.candidate.phone || undefined,
          yearsExperience: item.candidate.yearsExperience || undefined,
          nationality: item.candidate.nationality || undefined,
          verificationTier: item.candidate.verificationTier,
          availability: item.candidate.availabilityStatus,
          notes: item.shortlistNotes || undefined,
          ranking: item.shortlistRank || undefined,
        })
      );

      setCandidates(transformedCandidates);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }, [jobId]);

  React.useEffect(() => {
    fetchShortlist();
  }, [fetchShortlist]);

  // Handle reorder
  const handleReorder = async (reorderedCandidates: ShortlistCandidate[]) => {
    // Optimistic update
    setCandidates(reorderedCandidates);

    try {
      setIsSaving(true);
      const response = await fetch(`/api/jobs/${jobId}/shortlist/reorder`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          candidateIds: reorderedCandidates.map((c) => c.id),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to reorder shortlist");
      }
    } catch (err) {
      // Revert on error
      await fetchShortlist();
      console.error("Failed to reorder shortlist:", err);
    } finally {
      setIsSaving(false);
    }
  };

  // Handle remove
  const handleRemove = async (candidateId: string) => {
    // Optimistic update
    setCandidates((prev) => prev.filter((c) => c.id !== candidateId));

    try {
      setIsSaving(true);
      const response = await fetch(
        `/api/jobs/${jobId}/shortlist/${candidateId}`,
        {
          method: "DELETE",
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to remove from shortlist");
      }
    } catch (err) {
      // Revert on error
      await fetchShortlist();
      console.error("Failed to remove from shortlist:", err);
    } finally {
      setIsSaving(false);
    }
  };

  // Handle update notes
  const handleUpdateNotes = async (candidateId: string, notes: string) => {
    // Optimistic update
    setCandidates((prev) =>
      prev.map((c) => (c.id === candidateId ? { ...c, notes } : c))
    );

    try {
      setIsSaving(true);
      const candidate = candidates.find((c) => c.id === candidateId);
      if (!candidate) return;

      const response = await fetch(`/api/jobs/${jobId}/shortlist`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          candidates: [
            {
              candidateId,
              source: "internal",
              notes,
            },
          ],
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to update notes");
      }
    } catch (err) {
      // Revert on error
      await fetchShortlist();
      console.error("Failed to update notes:", err);
    } finally {
      setIsSaving(false);
    }
  };

  // Handle submit to client
  const handleSubmitToClient = async (candidateIds: string[]) => {
    try {
      setIsSubmitting(true);

      // For now, this will create a client submission
      // TODO: Implement client submission endpoint
      const response = await fetch(`/api/jobs/${jobId}/submissions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          candidateIds,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to submit to client");
      }

      // Refresh shortlist after submission
      await fetchShortlist();
    } catch (err) {
      console.error("Failed to submit to client:", err);
      throw err; // Re-throw so ShortlistBuilder can handle it
    } finally {
      setIsSubmitting(false);
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="size-8 animate-spin text-navy-600" />
          <p className="text-gray-600">Loading shortlist...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="flex flex-col items-center gap-4 text-center">
          <AlertCircle className="size-12 text-error-500" />
          <div>
            <h3 className="text-lg font-semibold text-navy-900">
              Failed to load shortlist
            </h3>
            <p className="text-sm text-gray-600">{error}</p>
          </div>
          <Button
            variant="secondary"
            onClick={fetchShortlist}
            leftIcon={<RefreshCw className="size-4" />}
          >
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Saving indicator */}
      {isSaving && (
        <div className="absolute top-2 right-2 flex items-center gap-2 rounded-full bg-navy-50 px-3 py-1 text-xs text-navy-600">
          <Loader2 className="size-3 animate-spin" />
          Saving...
        </div>
      )}

      <ShortlistBuilder
        jobId={jobId}
        jobTitle={jobTitle}
        candidates={candidates}
        onReorder={handleReorder}
        onRemove={handleRemove}
        onUpdateNotes={handleUpdateNotes}
        onSubmitToClient={handleSubmitToClient}
        isSubmitting={isSubmitting}
      />
    </div>
  );
}
