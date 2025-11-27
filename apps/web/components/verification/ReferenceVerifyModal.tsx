"use client";

import * as React from "react";
import {
  Check,
  Loader2,
  Phone,
  Mail,
  Calendar,
  Building2,
  User,
  Star,
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

interface ReferenceVerifyModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  referenceId: string;
  candidateId: string;
  candidateName: string;
  candidatePosition: string;
  refereeName: string;
  refereePosition: string | null;
  refereeCompany: string | null;
  refereePhone: string | null;
  refereeEmail: string | null;
  datesWorked: string | null;
  onVerified?: () => void;
}

type VerificationMethod = "vapi_call" | "manual_call" | "email" | "known_contact";
type WouldRehire = "yes" | "no" | "maybe";

const VERIFICATION_METHODS = [
  { value: "vapi_call" as const, label: "Vapi voice call", icon: Phone },
  { value: "manual_call" as const, label: "Manual phone call", icon: Phone },
  { value: "email" as const, label: "Email exchange", icon: Mail },
  { value: "known_contact" as const, label: "Known contact (I know this person)", icon: User },
];

const WOULD_REHIRE_OPTIONS = [
  { value: "yes" as const, label: "Yes" },
  { value: "no" as const, label: "No" },
  { value: "maybe" as const, label: "Maybe" },
];

export function ReferenceVerifyModal({
  open,
  onOpenChange,
  referenceId,
  candidateId,
  candidateName,
  candidatePosition,
  refereeName,
  refereePosition,
  refereeCompany,
  refereePhone,
  refereeEmail,
  datesWorked,
  onVerified,
}: ReferenceVerifyModalProps) {
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [method, setMethod] = React.useState<VerificationMethod | null>(null);
  const [rating, setRating] = React.useState<number>(0);
  const [hoverRating, setHoverRating] = React.useState<number>(0);
  const [wouldRehire, setWouldRehire] = React.useState<WouldRehire | null>(null);
  const [feedback, setFeedback] = React.useState("");
  const [internalNotes, setInternalNotes] = React.useState("");

  // Reset state when modal opens/closes
  React.useEffect(() => {
    if (!open) {
      setMethod(null);
      setRating(0);
      setHoverRating(0);
      setWouldRehire(null);
      setFeedback("");
      setInternalNotes("");
    }
  }, [open]);

  const handleSubmit = async () => {
    if (!method) {
      toast.error("Please select a verification method");
      return;
    }
    if (rating === 0) {
      toast.error("Please provide a rating");
      return;
    }
    if (!wouldRehire) {
      toast.error("Please answer the 'Would they rehire?' question");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch(
        `/api/candidates/${candidateId}/references/${referenceId}/verify`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contacted_via: method,
            rating,
            would_rehire: wouldRehire === "yes" ? true : wouldRehire === "no" ? false : null,
            feedback: feedback.trim() || undefined,
            notes: internalNotes.trim() || undefined,
          }),
        }
      );

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to verify reference");
      }

      toast.success(`Reference from ${refereeName} verified`);
      onVerified?.();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to verify reference");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      onOpenChange(false);
    }
  };

  const displayRating = hoverRating || rating;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Verify Reference</DialogTitle>
          <DialogDescription>
            Record the verification details for this reference.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto mt-4 space-y-6">
          {/* Candidate Info */}
          <div className="rounded-lg bg-navy-50 p-4 border border-navy-100">
            <p className="text-xs uppercase tracking-wide text-navy-500 font-medium">
              Candidate
            </p>
            <p className="mt-1 font-semibold text-navy-900">{candidateName}</p>
            <p className="text-sm text-navy-600">{candidatePosition}</p>
          </div>

          {/* Reference Info */}
          <div className="rounded-lg border border-gray-200 p-4">
            <p className="text-xs uppercase tracking-wide text-gray-500 font-medium mb-3">
              Reference
            </p>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <User className="size-4 text-gray-400" />
                <span className="font-medium text-navy-900">{refereeName}</span>
              </div>
              {refereePosition && (
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <span className="size-4" />
                  {refereePosition}
                </div>
              )}
              {refereeCompany && (
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Building2 className="size-4 text-gray-400" />
                  {refereeCompany}
                </div>
              )}
              {datesWorked && (
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Calendar className="size-4 text-gray-400" />
                  {datesWorked}
                </div>
              )}
              <div className="flex items-center gap-4 pt-2 border-t border-gray-100 mt-2 text-sm">
                {refereePhone && (
                  <div className="flex items-center gap-1.5 text-gray-600">
                    <Phone className="size-4 text-gray-400" />
                    {refereePhone}
                  </div>
                )}
                {refereeEmail && (
                  <div className="flex items-center gap-1.5 text-gray-600">
                    <Mail className="size-4 text-gray-400" />
                    {refereeEmail}
                  </div>
                )}
              </div>
            </div>
          </div>

          <hr className="border-gray-100" />

          {/* Verification Form */}
          <div className="space-y-5">
            {/* Verification Method */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                How did you verify? <span className="text-error-500">*</span>
              </label>
              <div className="space-y-2">
                {VERIFICATION_METHODS.map((opt) => {
                  const Icon = opt.icon;
                  return (
                    <label
                      key={opt.value}
                      className={cn(
                        "flex items-center gap-3 rounded-lg border p-3 cursor-pointer transition-colors",
                        method === opt.value
                          ? "border-gold-500 bg-gold-50"
                          : "border-gray-200 hover:bg-gray-50"
                      )}
                    >
                      <input
                        type="radio"
                        name="method"
                        value={opt.value}
                        checked={method === opt.value}
                        onChange={() => setMethod(opt.value)}
                        className="sr-only"
                      />
                      <div
                        className={cn(
                          "flex size-5 items-center justify-center rounded-full border-2",
                          method === opt.value
                            ? "border-gold-500 bg-gold-500"
                            : "border-gray-300"
                        )}
                      >
                        {method === opt.value && (
                          <div className="size-2 rounded-full bg-white" />
                        )}
                      </div>
                      <Icon className="size-4 text-gray-500" />
                      <span className="text-sm text-navy-900">{opt.label}</span>
                    </label>
                  );
                })}
              </div>
            </div>

            {/* Rating */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Rating <span className="text-error-500">*</span>
              </label>
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(0)}
                    className="p-0.5 focus:outline-none"
                  >
                    <Star
                      className={cn(
                        "size-8 transition-colors",
                        star <= displayRating
                          ? "fill-gold-400 text-gold-400"
                          : "text-gray-300 hover:text-gold-300"
                      )}
                    />
                  </button>
                ))}
                {rating > 0 && (
                  <span className="ml-2 text-sm text-gray-500">
                    {rating === 1 && "Poor"}
                    {rating === 2 && "Fair"}
                    {rating === 3 && "Good"}
                    {rating === 4 && "Very Good"}
                    {rating === 5 && "Excellent"}
                  </span>
                )}
              </div>
            </div>

            {/* Would Rehire */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Would they rehire? <span className="text-error-500">*</span>
              </label>
              <div className="flex gap-2">
                {WOULD_REHIRE_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setWouldRehire(opt.value)}
                    className={cn(
                      "flex-1 rounded-lg border px-4 py-2 text-sm font-medium transition-colors",
                      wouldRehire === opt.value
                        ? opt.value === "yes"
                          ? "border-success-500 bg-success-50 text-success-700"
                          : opt.value === "no"
                          ? "border-error-500 bg-error-50 text-error-700"
                          : "border-gold-500 bg-gold-50 text-gold-700"
                        : "border-gray-200 hover:bg-gray-50"
                    )}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Feedback */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Feedback from reference
              </label>
              <textarea
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                placeholder='"Excellent crew member, very professional, always on time. Strong with guests. Would definitely rehire."'
                rows={3}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm placeholder:text-gray-400 focus:border-gold-500 focus:outline-none focus:ring-1 focus:ring-gold-500"
              />
            </div>

            {/* Internal Notes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Internal notes{" "}
                <span className="text-gray-400 font-normal">(not visible to candidate)</span>
              </label>
              <textarea
                value={internalNotes}
                onChange={(e) => setInternalNotes(e.target.value)}
                placeholder="Spoke with Mike on 27/11, very positive feedback."
                rows={2}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm placeholder:text-gray-400 focus:border-gold-500 focus:outline-none focus:ring-1 focus:ring-gold-500"
              />
            </div>
          </div>
        </div>

        <DialogFooter className="mt-6 border-t border-gray-100 pt-4">
          <Button variant="secondary" onClick={handleClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleSubmit}
            disabled={!method || rating === 0 || !wouldRehire || isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 size-4 animate-spin" />
                Verifying...
              </>
            ) : (
              <>
                <Check className="mr-2 size-4" />
                Mark as Verified
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
