"use client";

import { useState } from "react";
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
import {
  AlertTriangle,
  Heart,
  Loader2,
  Calendar,
  X,
} from "lucide-react";
import type { SubscriptionPlan } from "@lighthouse/database";

interface CancelSubscriptionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  plan: SubscriptionPlan;
  periodEndDate: string | null;
  onConfirm: (immediately: boolean, reason?: string) => Promise<void>;
}

const cancellationReasons = [
  { value: "too_expensive", label: "Too expensive" },
  { value: "not_using", label: "Not using it enough" },
  { value: "missing_features", label: "Missing features I need" },
  { value: "found_alternative", label: "Found a better alternative" },
  { value: "temporary", label: "Just need a break" },
  { value: "other", label: "Other reason" },
];

export function CancelSubscriptionModal({
  open,
  onOpenChange,
  plan,
  periodEndDate,
  onConfirm,
}: CancelSubscriptionModalProps) {
  const [step, setStep] = useState<"reason" | "confirm">("reason");
  const [selectedReason, setSelectedReason] = useState<string | null>(null);
  const [customReason, setCustomReason] = useState("");
  const [cancelImmediately, setCancelImmediately] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const formattedEndDate = periodEndDate
    ? new Date(periodEndDate).toLocaleDateString("en-GB", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : null;

  const handleNext = () => {
    if (selectedReason) {
      setStep("confirm");
    }
  };

  const handleConfirm = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const reason =
        selectedReason === "other" ? customReason : selectedReason || undefined;
      await onConfirm(cancelImmediately, reason);
      onOpenChange(false);
      // Reset state
      setStep("reason");
      setSelectedReason(null);
      setCustomReason("");
      setCancelImmediately(false);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to cancel subscription"
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    onOpenChange(false);
    // Reset state after animation
    setTimeout(() => {
      setStep("reason");
      setSelectedReason(null);
      setCustomReason("");
      setCancelImmediately(false);
      setError(null);
    }, 200);
  };

  // Features they'll lose
  const featureNames: Record<string, string> = {
    ai_matching: "AI matching",
    client_portal: "Client portal",
    whatsapp_integration: "WhatsApp integration",
    api_access: "API access",
    white_label: "White label",
    priority_support: "Priority support",
    dedicated_support: "Dedicated support",
  };

  const lostFeatures = plan.features.filter(
    (f: string) => f !== "basic_search" && f !== "manual_matching"
  );

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        {step === "reason" ? (
          <>
            <DialogHeader>
              <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-full bg-burgundy-100">
                <Heart className="size-6 text-burgundy-600" />
              </div>
              <DialogTitle className="text-center">
                We're sorry to see you go
              </DialogTitle>
              <DialogDescription className="text-center">
                Before you cancel, help us understand why you're leaving so we
                can improve.
              </DialogDescription>
            </DialogHeader>

            <div className="mt-4 space-y-2">
              {cancellationReasons.map((reason) => (
                <button
                  key={reason.value}
                  onClick={() => setSelectedReason(reason.value)}
                  className={cn(
                    "w-full rounded-lg border px-4 py-3 text-left text-sm transition-colors",
                    selectedReason === reason.value
                      ? "border-navy-300 bg-navy-50 text-navy-900"
                      : "border-gray-200 text-gray-700 hover:border-gray-300 hover:bg-gray-50"
                  )}
                >
                  {reason.label}
                </button>
              ))}

              {selectedReason === "other" && (
                <textarea
                  value={customReason}
                  onChange={(e) => setCustomReason(e.target.value)}
                  placeholder="Please tell us more..."
                  rows={3}
                  className="mt-2 w-full rounded-lg border border-gray-200 px-4 py-3 text-sm text-navy-900 placeholder:text-gray-400 focus:border-gold-500 focus:outline-none focus:ring-2 focus:ring-gold-500/20"
                />
              )}
            </div>

            <DialogFooter className="mt-6">
              <Button variant="secondary" onClick={handleClose}>
                Never mind
              </Button>
              <Button
                variant="danger"
                onClick={handleNext}
                disabled={!selectedReason}
              >
                Continue
              </Button>
            </DialogFooter>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <AlertTriangle className="size-5 text-burgundy-600" />
                Confirm Cancellation
              </DialogTitle>
              <DialogDescription>
                Please review what you'll lose access to.
              </DialogDescription>
            </DialogHeader>

            <div className="mt-4 space-y-4">
              {/* What they'll lose */}
              <div className="rounded-lg border border-burgundy-200 bg-burgundy-50 p-4">
                <p className="mb-2 text-sm font-medium text-burgundy-800">
                  You'll lose access to:
                </p>
                <ul className="space-y-1 text-sm text-burgundy-700">
                  {lostFeatures.map((feature: string) => (
                    <li key={feature} className="flex items-center gap-2">
                      <X className="size-3" />
                      {featureNames[feature] || feature}
                    </li>
                  ))}
                  {plan.max_candidates === null && (
                    <li className="flex items-center gap-2">
                      <X className="size-3" />
                      Unlimited candidates (limit drops to 50)
                    </li>
                  )}
                </ul>
              </div>

              {/* When it ends */}
              <div className="rounded-lg bg-gray-50 px-4 py-3">
                <div className="flex items-start gap-3">
                  <Calendar className="size-5 text-gray-500" />
                  <div>
                    <p className="text-sm font-medium text-navy-900">
                      {cancelImmediately
                        ? "Cancel immediately"
                        : "Cancel at period end"}
                    </p>
                    <p className="text-sm text-gray-600">
                      {cancelImmediately
                        ? "You'll lose access right away. No refund will be issued."
                        : formattedEndDate
                          ? `You'll have access until ${formattedEndDate}`
                          : "You'll have access until the end of your billing period"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Cancel immediately toggle */}
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={cancelImmediately}
                  onChange={(e) => setCancelImmediately(e.target.checked)}
                  className="size-4 rounded border-gray-300 text-burgundy-600 focus:ring-burgundy-500"
                />
                <span className="text-sm text-gray-700">
                  Cancel immediately (no refund)
                </span>
              </label>

              {/* Error message */}
              {error && (
                <div className="rounded-lg border border-burgundy-200 bg-burgundy-50 px-4 py-3 text-sm text-burgundy-700">
                  {error}
                </div>
              )}
            </div>

            <DialogFooter className="mt-6">
              <Button variant="secondary" onClick={() => setStep("reason")}>
                Back
              </Button>
              <Button
                variant="danger"
                onClick={handleConfirm}
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 size-4 animate-spin" />
                    Canceling...
                  </>
                ) : (
                  "Cancel Subscription"
                )}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
