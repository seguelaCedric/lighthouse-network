"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { CheckCircle, Loader2, X } from "lucide-react";

interface JobBoardQuickApplyButtonProps {
  jobId: string;
  initialApplied?: boolean;
}

export function JobBoardQuickApplyButton({
  jobId,
  initialApplied = false,
}: JobBoardQuickApplyButtonProps) {
  const [isPending, startTransition] = useTransition();
  const [isApplied, setIsApplied] = useState(initialApplied);
  const [error, setError] = useState<string | null>(null);
  const [action, setAction] = useState<{ label: string; href: string } | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [coverNote, setCoverNote] = useState("");

  const handleOpenModal = () => {
    setError(null);
    setAction(null);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
  };

  const handleSubmitApplication = () => {
    setError(null);
    setAction(null);
    startTransition(async () => {
      try {
        const response = await fetch("/api/crew/applications/quick-apply", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            jobId,
            coverNote: coverNote.trim() || undefined,
          }),
        });

        const responseText = await response.text();
        let data: Record<string, unknown> | null = null;
        try {
          data = responseText ? (JSON.parse(responseText) as Record<string, unknown>) : null;
        } catch {
          data = null;
        }

        if (!response.ok) {
          if (response.status === 401) {
            setError("Please sign in to apply.");
            setAction({
              label: "Sign In",
              href: `/auth/login?redirect=/job-board/${jobId}`,
            });
            return;
          }
          const errorCode = data?.error as string | undefined;
          if (errorCode === "profile_incomplete") {
            const redirectHref = `/crew/profile/edit?redirect=/job-board/${jobId}`;
            const completeness = data?.completeness;
            const missingFields = Array.isArray(data?.missingFields) ? data?.missingFields : [];
            const baseMessage =
              (data?.message as string) || "Complete your profile to quick apply.";
            const details =
              completeness !== undefined || missingFields.length
                ? ` (${completeness ?? "?"}% complete${missingFields.length ? `, missing: ${missingFields.join(", ")}` : ""})`
                : "";
            const debug =
              data?.debug && typeof data.debug === "object"
                ? ` Debug: ${JSON.stringify(data.debug)}`
                : "";
            setError(`${baseMessage}${details}${debug}`);
            setAction({ label: "Complete Profile", href: redirectHref });
            return;
          }
          if (errorCode === "already_applied") {
            setError((data?.message as string) || "You have already applied to this job.");
            setAction({
              label: "View Applications",
              href: "/crew/applications",
            });
            return;
          }
          if (errorCode === "not_candidate") {
            setError((data?.message as string) || "This account can't apply to jobs.");
            setAction({
              label: "Sign In as Candidate",
              href: `/auth/login?redirect=/job-board/${jobId}`,
            });
            return;
          }
          if (errorCode === "missing_email") {
            const debug =
              data?.debug && typeof data.debug === "object"
                ? ` Debug: ${JSON.stringify(data.debug)}`
                : "";
            setError(
              `${(data?.message as string) || "Please add an email to your account."}${debug}`
            );
            setAction({
              label: "Complete Profile",
              href: `/crew/profile/edit?redirect=/job-board/${jobId}`,
            });
            return;
          }
          if (errorCode === "cv_required") {
            setError(
              (data?.message as string) || "You must upload a CV before applying to jobs."
            );
            setAction({
              label: "Upload CV",
              href: `/crew/documents?upload=cv&redirect=/job-board/${jobId}`,
            });
            return;
          }
          const debug =
            data?.debug && typeof data.debug === "object"
              ? ` Debug: ${JSON.stringify(data.debug)}`
              : "";
          const fallbackMessage =
            (data?.message as string) ||
            (data?.error as string) ||
            responseText ||
            `Request failed (${response.status}).`;
          setError(`${fallbackMessage}${debug}`);
          if (typeof window !== "undefined") {
            console.error("Quick apply failed", {
              status: response.status,
              body: responseText,
            });
          }
          return;
        }

        setIsApplied(true);
        setShowModal(false);
        setCoverNote("");
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to submit application.");
      }
    });
  };

  return (
    <div className="space-y-3">
      <button
        type="button"
        onClick={handleOpenModal}
        disabled={isPending || isApplied}
        className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-gold-500 to-gold-600 px-6 py-3.5 font-medium text-white hover:from-gold-600 hover:to-gold-700 transition-all shadow-lg hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-70"
      >
        {isApplied ? (
          <>
            <CheckCircle className="h-4 w-4" />
            Applied
          </>
        ) : isPending ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Applying...
          </>
        ) : (
          "Quick Apply"
        )}
      </button>
      {error && !showModal && <p className="text-sm text-error-600">{error}</p>}
      {!isApplied && action && !showModal && (
        <Link
          href={action.href}
          className="inline-flex items-center text-sm font-medium text-gold-600 hover:text-gold-700"
        >
          {action.label}
        </Link>
      )}
      {isApplied && (
        <Link
          href="/crew/applications"
          className="inline-flex items-center text-sm font-medium text-gold-600 hover:text-gold-700"
        >
          View Applications
        </Link>
      )}
      {isApplied && (
        <p className="text-sm text-success-600">
          Application submitted. Track it from your dashboard.
        </p>
      )}

      {/* Cover Note Modal */}
      {showModal && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) handleCloseModal();
          }}
        >
          <div className="w-full max-w-md bg-white rounded-t-2xl sm:rounded-2xl shadow-xl animate-in slide-in-from-bottom-4 sm:slide-in-from-bottom-0 sm:zoom-in-95 duration-200">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
              <h3 className="text-lg font-semibold text-gray-900">Apply to this job</h3>
              <button
                type="button"
                onClick={handleCloseModal}
                className="rounded-full p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Content */}
            <div className="p-4 space-y-4">
              <div>
                <label
                  htmlFor="coverNote"
                  className="block text-sm font-medium text-gray-700 mb-1.5"
                >
                  Cover note{" "}
                  <span className="text-gray-400 font-normal">(optional)</span>
                </label>
                <textarea
                  id="coverNote"
                  rows={4}
                  maxLength={2000}
                  value={coverNote}
                  onChange={(e) => setCoverNote(e.target.value)}
                  placeholder="Add a brief note to introduce yourself or highlight relevant experience..."
                  className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-gold-500 focus:outline-none focus:ring-1 focus:ring-gold-500 resize-none"
                />
                <p className="mt-1 text-xs text-gray-400 text-right">
                  {coverNote.length}/2000
                </p>
              </div>

              {error && <p className="text-sm text-error-600">{error}</p>}
              {action && (
                <Link
                  href={action.href}
                  className="inline-flex items-center text-sm font-medium text-gold-600 hover:text-gold-700"
                >
                  {action.label}
                </Link>
              )}
            </div>

            {/* Footer */}
            <div className="flex gap-3 border-t border-gray-100 px-4 py-3">
              <button
                type="button"
                onClick={handleCloseModal}
                disabled={isPending}
                className="flex-1 rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSubmitApplication}
                disabled={isPending}
                className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-gold-500 to-gold-600 px-4 py-2.5 text-sm font-medium text-white hover:from-gold-600 hover:to-gold-700 transition-all disabled:opacity-70"
              >
                {isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Applying...
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
