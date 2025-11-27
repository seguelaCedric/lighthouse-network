"use client";

import * as React from "react";
import {
  Check,
  X,
  Loader2,
  ExternalLink,
  ZoomIn,
  ZoomOut,
  RotateCw,
  AlertTriangle,
} from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface IDReviewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  candidateId: string;
  candidateName: string;
  documentUrl: string;
  onVerified?: () => void;
}

const REJECTION_REASONS = [
  { value: "unreadable", label: "Document is unreadable or blurry" },
  { value: "expired", label: "Document is expired" },
  { value: "name_mismatch", label: "Name does not match profile" },
  { value: "wrong_type", label: "Invalid document type" },
  { value: "incomplete", label: "Document is incomplete or cropped" },
  { value: "suspected_fake", label: "Suspected fraudulent document" },
  { value: "other", label: "Other reason" },
];

export function IDReviewModal({
  open,
  onOpenChange,
  candidateId,
  candidateName,
  documentUrl,
  onVerified,
}: IDReviewModalProps) {
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [action, setAction] = React.useState<"approve" | "reject" | null>(null);
  const [rejectionReason, setRejectionReason] = React.useState("");
  const [notes, setNotes] = React.useState("");
  const [zoom, setZoom] = React.useState(1);
  const [rotation, setRotation] = React.useState(0);

  // Reset state when modal opens/closes
  React.useEffect(() => {
    if (!open) {
      setAction(null);
      setRejectionReason("");
      setNotes("");
      setZoom(1);
      setRotation(0);
    }
  }, [open]);

  const handleApprove = async () => {
    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/candidates/${candidateId}/id-verification`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "approve",
          notes: notes.trim() || undefined,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to approve ID");
      }

      toast.success(`ID verified for ${candidateName}`);
      onVerified?.();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to approve ID");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReject = async () => {
    if (!rejectionReason) {
      toast.error("Please select a rejection reason");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/candidates/${candidateId}/id-verification`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "reject",
          rejection_reason: rejectionReason,
          notes: notes.trim() || undefined,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to reject ID");
      }

      toast.success("ID rejected");
      onVerified?.();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to reject ID");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmit = () => {
    if (action === "approve") {
      handleApprove();
    } else if (action === "reject") {
      handleReject();
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      onOpenChange(false);
    }
  };

  // Determine if document is an image or PDF
  const isImage = /\.(jpg|jpeg|png|gif|webp)$/i.test(documentUrl);
  const isPDF = /\.pdf$/i.test(documentUrl);

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Review ID Document</DialogTitle>
          <DialogDescription>
            Verify that this ID document matches the candidate's profile information.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto mt-4">
          {/* Candidate Name Reference */}
          <div className="mb-4 rounded-lg bg-navy-50 p-3 border border-navy-100">
            <p className="text-sm text-navy-600">
              <span className="font-medium">Candidate Name:</span>{" "}
              <span className="text-navy-900 font-semibold">{candidateName}</span>
            </p>
            <p className="text-xs text-navy-500 mt-1">
              Verify that the name on the document matches this candidate
            </p>
          </div>

          {/* Document Preview */}
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">Document Preview</span>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setZoom((z) => Math.max(0.5, z - 0.25))}
                  className="rounded p-1 text-gray-500 hover:bg-gray-100"
                  title="Zoom out"
                >
                  <ZoomOut className="size-4" />
                </button>
                <span className="text-xs text-gray-500 w-12 text-center">
                  {Math.round(zoom * 100)}%
                </span>
                <button
                  onClick={() => setZoom((z) => Math.min(3, z + 0.25))}
                  className="rounded p-1 text-gray-500 hover:bg-gray-100"
                  title="Zoom in"
                >
                  <ZoomIn className="size-4" />
                </button>
                <button
                  onClick={() => setRotation((r) => (r + 90) % 360)}
                  className="rounded p-1 text-gray-500 hover:bg-gray-100 ml-2"
                  title="Rotate"
                >
                  <RotateCw className="size-4" />
                </button>
                <a
                  href={documentUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded p-1 text-gray-500 hover:bg-gray-100 ml-2"
                  title="Open in new tab"
                >
                  <ExternalLink className="size-4" />
                </a>
              </div>
            </div>

            <div className="relative overflow-auto rounded-lg border border-gray-200 bg-gray-100 min-h-[300px] max-h-[400px]">
              {isImage ? (
                <div className="flex items-center justify-center p-4">
                  <img
                    src={documentUrl}
                    alt="ID Document"
                    className="transition-transform duration-200"
                    style={{
                      transform: `scale(${zoom}) rotate(${rotation}deg)`,
                      transformOrigin: "center center",
                    }}
                  />
                </div>
              ) : isPDF ? (
                <iframe
                  src={`${documentUrl}#toolbar=0`}
                  className="w-full h-[400px]"
                  title="ID Document PDF"
                />
              ) : (
                <div className="flex flex-col items-center justify-center p-8 text-center">
                  <AlertTriangle className="size-8 text-warning-500 mb-2" />
                  <p className="text-sm text-gray-600">
                    Unable to preview this file type.
                  </p>
                  <a
                    href={documentUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-2 text-sm text-gold-600 hover:underline"
                  >
                    Open document in new tab
                  </a>
                </div>
              )}
            </div>
          </div>

          {/* Action Selection */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Decision
            </label>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setAction("approve")}
                className={cn(
                  "flex-1 flex items-center justify-center gap-2 rounded-lg border-2 p-3 transition-colors",
                  action === "approve"
                    ? "border-success-500 bg-success-50 text-success-700"
                    : "border-gray-200 hover:border-success-300 hover:bg-success-50/50"
                )}
              >
                <Check className="size-5" />
                <span className="font-medium">Approve</span>
              </button>
              <button
                type="button"
                onClick={() => setAction("reject")}
                className={cn(
                  "flex-1 flex items-center justify-center gap-2 rounded-lg border-2 p-3 transition-colors",
                  action === "reject"
                    ? "border-error-500 bg-error-50 text-error-700"
                    : "border-gray-200 hover:border-error-300 hover:bg-error-50/50"
                )}
              >
                <X className="size-5" />
                <span className="font-medium">Reject</span>
              </button>
            </div>
          </div>

          {/* Rejection Reason (if rejecting) */}
          {action === "reject" && (
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Rejection Reason <span className="text-error-500">*</span>
              </label>
              <select
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-gold-500 focus:outline-none focus:ring-1 focus:ring-gold-500"
              >
                <option value="">Select a reason...</option>
                {REJECTION_REASONS.map((reason) => (
                  <option key={reason.value} value={reason.value}>
                    {reason.label}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Notes */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Internal Notes <span className="text-gray-400">(optional)</span>
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add any notes about this verification..."
              rows={3}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm placeholder:text-gray-400 focus:border-gold-500 focus:outline-none focus:ring-1 focus:ring-gold-500"
            />
          </div>
        </div>

        <DialogFooter className="mt-4 border-t border-gray-100 pt-4">
          <Button variant="secondary" onClick={handleClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button
            variant={action === "reject" ? "secondary" : "primary"}
            onClick={handleSubmit}
            disabled={!action || isSubmitting || (action === "reject" && !rejectionReason)}
            className={cn(
              action === "reject" && "bg-error-600 hover:bg-error-700 text-white border-error-600"
            )}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 size-4 animate-spin" />
                Processing...
              </>
            ) : action === "approve" ? (
              <>
                <Check className="mr-2 size-4" />
                Approve ID
              </>
            ) : action === "reject" ? (
              <>
                <X className="mr-2 size-4" />
                Reject ID
              </>
            ) : (
              "Select Decision"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
