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
  ArrowUp,
  ArrowDown,
  AlertTriangle,
  Check,
  Loader2,
  Info,
} from "lucide-react";
import type { SubscriptionPlan, BillingCycle } from "@lighthouse/database";

interface ChangePlanModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentPlan: SubscriptionPlan | null;
  newPlan: SubscriptionPlan;
  billingCycle: BillingCycle;
  onConfirm: () => Promise<void>;
  prorationPreview?: {
    amount: number; // in cents (positive = charge, negative = credit)
    currency: string;
    effectiveDate: string;
  } | null;
}

export function ChangePlanModal({
  open,
  onOpenChange,
  currentPlan,
  newPlan,
  billingCycle,
  onConfirm,
  prorationPreview,
}: ChangePlanModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isUpgrade = !currentPlan ||
    (billingCycle === "monthly"
      ? newPlan.price_monthly > currentPlan.price_monthly
      : newPlan.price_yearly > currentPlan.price_yearly);

  const isDowngrade = currentPlan &&
    (billingCycle === "monthly"
      ? newPlan.price_monthly < currentPlan.price_monthly
      : newPlan.price_yearly < currentPlan.price_yearly);

  const currentPrice = currentPlan
    ? billingCycle === "yearly"
      ? currentPlan.price_yearly
      : currentPlan.price_monthly
    : 0;
  const newPrice =
    billingCycle === "yearly" ? newPlan.price_yearly : newPlan.price_monthly;

  const handleConfirm = async () => {
    setIsLoading(true);
    setError(null);
    try {
      await onConfirm();
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to change plan");
    } finally {
      setIsLoading(false);
    }
  };

  // Features comparison
  const addedFeatures = newPlan.features.filter(
    (f: string) => !currentPlan?.features.includes(f)
  );
  const removedFeatures = currentPlan?.features.filter(
    (f: string) => !newPlan.features.includes(f)
  ) || [];

  const featureNames: Record<string, string> = {
    basic_search: "Basic search",
    ai_matching: "AI matching",
    client_portal: "Client portal",
    whatsapp_integration: "WhatsApp integration",
    api_access: "API access",
    white_label: "White label",
    priority_support: "Priority support",
    dedicated_support: "Dedicated support",
    manual_matching: "Manual matching",
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {isUpgrade ? (
              <>
                <ArrowUp className="size-5 text-success-600" />
                Upgrade to {newPlan.name}
              </>
            ) : (
              <>
                <ArrowDown className="size-5 text-gold-600" />
                Change to {newPlan.name}
              </>
            )}
          </DialogTitle>
          <DialogDescription>
            {isUpgrade
              ? "You're upgrading your plan. Changes take effect immediately."
              : "You're changing your plan. Review the details below."}
          </DialogDescription>
        </DialogHeader>

        <div className="mt-4 space-y-4">
          {/* Price change */}
          <div className="flex items-center justify-between rounded-lg bg-gray-50 px-4 py-3">
            <div>
              <p className="text-sm text-gray-600">
                {currentPlan?.name || "Free"} → {newPlan.name}
              </p>
              <p className="text-xs text-gray-500">
                Billed {billingCycle}
              </p>
            </div>
            <div className="text-right">
              <p className="font-semibold text-navy-900">
                €{(newPrice / 100).toFixed(0)}/{billingCycle === "yearly" ? "yr" : "mo"}
              </p>
              {currentPrice > 0 && (
                <p className="text-xs text-gray-500">
                  was €{(currentPrice / 100).toFixed(0)}/{billingCycle === "yearly" ? "yr" : "mo"}
                </p>
              )}
            </div>
          </div>

          {/* Proration preview */}
          {prorationPreview && (
            <div
              className={cn(
                "rounded-lg px-4 py-3",
                prorationPreview.amount > 0
                  ? "bg-gold-50 border border-gold-200"
                  : "bg-success-50 border border-success-200"
              )}
            >
              <div className="flex items-start gap-2">
                <Info className="size-4 mt-0.5 text-gray-600" />
                <div>
                  <p className="text-sm font-medium text-navy-900">
                    {prorationPreview.amount > 0
                      ? `You'll be charged €${(prorationPreview.amount / 100).toFixed(2)} today`
                      : `You'll receive €${Math.abs(prorationPreview.amount / 100).toFixed(2)} credit`}
                  </p>
                  <p className="text-xs text-gray-600">
                    Prorated for the remaining billing period
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Added features */}
          {addedFeatures.length > 0 && (
            <div>
              <p className="mb-2 text-sm font-medium text-success-700">
                You'll gain:
              </p>
              <div className="space-y-1">
                {addedFeatures.map((feature: string) => (
                  <div
                    key={feature}
                    className="flex items-center gap-2 text-sm text-gray-700"
                  >
                    <Check className="size-4 text-success-600" />
                    {featureNames[feature] || feature}
                  </div>
                ))}
                {/* Limit improvements */}
                {currentPlan &&
                  (newPlan.max_candidates === null ||
                    (currentPlan.max_candidates &&
                      newPlan.max_candidates > currentPlan.max_candidates)) && (
                    <div className="flex items-center gap-2 text-sm text-gray-700">
                      <Check className="size-4 text-success-600" />
                      {newPlan.max_candidates === null
                        ? "Unlimited candidates"
                        : `${newPlan.max_candidates} candidates (was ${currentPlan.max_candidates})`}
                    </div>
                  )}
                {newPlan.placement_fee_percent <
                  (currentPlan?.placement_fee_percent || 15) && (
                  <div className="flex items-center gap-2 text-sm text-gray-700">
                    <Check className="size-4 text-success-600" />
                    Lower platform fee ({newPlan.placement_fee_percent}%)
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Removed features (for downgrades) */}
          {removedFeatures.length > 0 && (
            <div className="rounded-lg border border-burgundy-200 bg-burgundy-50 p-3">
              <div className="flex items-start gap-2">
                <AlertTriangle className="size-4 mt-0.5 text-burgundy-600" />
                <div>
                  <p className="text-sm font-medium text-burgundy-800">
                    You'll lose access to:
                  </p>
                  <ul className="mt-1 space-y-1 text-sm text-burgundy-700">
                    {removedFeatures.map((feature: string) => (
                      <li key={feature}>• {featureNames[feature] || feature}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* Error message */}
          {error && (
            <div className="rounded-lg border border-burgundy-200 bg-burgundy-50 px-4 py-3 text-sm text-burgundy-700">
              {error}
            </div>
          )}
        </div>

        <DialogFooter className="mt-6">
          <Button
            variant="secondary"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleConfirm}
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 size-4 animate-spin" />
                Processing...
              </>
            ) : (
              `Confirm ${isUpgrade ? "Upgrade" : "Change"}`
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
