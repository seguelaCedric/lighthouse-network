"use client";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Check,
  Sparkles,
  Calendar,
  AlertCircle,
  ArrowRight,
} from "lucide-react";
import type {
  AgencySubscriptionWithPlan,
  SubscriptionPlan,
} from "@lighthouse/database";

interface CurrentPlanCardProps {
  subscription: AgencySubscriptionWithPlan | null;
  plan: SubscriptionPlan | null;
  onUpgrade: () => void;
  onCancel: () => void;
  onChangePlan: () => void;
  isLoading?: boolean;
}

export function CurrentPlanCard({
  subscription,
  plan,
  onUpgrade,
  onCancel,
  onChangePlan,
  isLoading,
}: CurrentPlanCardProps) {
  if (isLoading) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white p-6 animate-pulse">
        <div className="mb-4 flex items-start justify-between">
          <div className="space-y-3">
            <div className="h-5 w-24 rounded bg-gray-200" />
            <div className="h-8 w-32 rounded bg-gray-200" />
            <div className="h-12 w-40 rounded bg-gray-200" />
          </div>
          <div className="h-10 w-32 rounded-lg bg-gray-200" />
        </div>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-5 w-40 rounded bg-gray-100" />
          ))}
        </div>
      </div>
    );
  }

  if (!plan) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white p-6">
        <div className="flex items-center gap-3 text-gray-500">
          <AlertCircle className="size-5" />
          <span>Unable to load plan information</span>
        </div>
      </div>
    );
  }

  const isFreePlan = plan.slug === "free";
  const isCanceling = subscription?.cancel_at_period_end;
  const billingCycle = subscription?.billing_cycle || "monthly";
  const price =
    billingCycle === "yearly" ? plan.price_yearly : plan.price_monthly;
  const displayPrice = (price / 100).toFixed(0);

  // Format renewal/cancellation date
  const periodEndDate = subscription?.current_period_end
    ? new Date(subscription.current_period_end)
    : null;
  const formattedDate = periodEndDate
    ? periodEndDate.toLocaleDateString("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : null;

  // Feature display names
  const featureDisplayNames: Record<string, string> = {
    basic_search: "Basic search",
    ai_matching: "AI matching",
    client_portal: "Client portal",
    whatsapp_integration: "WhatsApp integration",
    api_access: "API access",
    white_label: "White label",
    priority_support: "Priority support",
    dedicated_support: "Dedicated support",
    manual_matching: "Manual matching only",
  };

  return (
    <div
      className={cn(
        "rounded-xl border p-6",
        isFreePlan
          ? "border-gray-200 bg-white"
          : "border-gold-200 bg-gradient-to-br from-gold-50 to-white"
      )}
    >
      <div className="mb-4 flex items-start justify-between">
        <div>
          <div className="mb-1 flex items-center gap-2">
            <span
              className={cn(
                "rounded-full px-2.5 py-0.5 text-xs font-bold",
                isCanceling
                  ? "bg-burgundy-100 text-burgundy-800"
                  : "bg-gold-200 text-gold-800"
              )}
            >
              {isCanceling ? "CANCELING" : "CURRENT PLAN"}
            </span>
          </div>
          <h3 className="text-2xl font-bold text-navy-900">{plan.name}</h3>
          <p className="text-gray-600">
            <span className="text-4xl font-bold text-navy-800">
              {isFreePlan ? "Free" : `€${displayPrice}`}
            </span>
            {!isFreePlan && (
              <span className="text-gray-500">
                /{billingCycle === "yearly" ? "year" : "month"}
              </span>
            )}
          </p>
          {!isFreePlan && (
            <p className="mt-1 text-sm text-gray-500">
              Billed {billingCycle}
              {formattedDate && (
                <>
                  {" • "}
                  {isCanceling ? "Access until" : "Renews"} {formattedDate}
                </>
              )}
            </p>
          )}
        </div>
        {isFreePlan ? (
          <Button variant="primary" onClick={onUpgrade}>
            <Sparkles className="mr-1.5 size-4" />
            Upgrade Plan
          </Button>
        ) : (
          <div className="flex gap-2">
            <Button variant="secondary" onClick={onChangePlan}>
              Change Plan
            </Button>
          </div>
        )}
      </div>

      {/* Features */}
      <div className="mb-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {/* Limits */}
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Check className="size-4 text-success-600" />
          {plan.max_candidates
            ? `${plan.max_candidates} candidates`
            : "Unlimited candidates"}
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Check className="size-4 text-success-600" />
          {plan.max_active_jobs
            ? `${plan.max_active_jobs} active jobs`
            : "Unlimited jobs"}
        </div>
        {/* Features */}
        {plan.features.slice(0, 4).map((feature: string) => (
          <div
            key={feature}
            className="flex items-center gap-2 text-sm text-gray-600"
          >
            <Check className="size-4 text-success-600" />
            {featureDisplayNames[feature] || feature}
          </div>
        ))}
      </div>

      {/* Platform fee */}
      <div className="mb-4 rounded-lg bg-gray-50 px-4 py-3 text-sm text-gray-600">
        <span className="font-medium text-navy-800">Platform fee:</span>{" "}
        {plan.placement_fee_percent}% of placements
      </div>

      {/* Action buttons */}
      {!isFreePlan && !isCanceling && (
        <div className="flex items-center justify-between border-t border-gray-100 pt-4">
          <button
            onClick={onCancel}
            className="text-sm font-medium text-gray-500 hover:text-burgundy-600"
          >
            Cancel Subscription
          </button>
          <button
            onClick={onChangePlan}
            className="flex items-center gap-1 text-sm font-medium text-gold-600 hover:text-gold-700"
          >
            View all plans
            <ArrowRight className="size-4" />
          </button>
        </div>
      )}

      {isCanceling && (
        <div className="rounded-lg border border-burgundy-200 bg-burgundy-50 p-4">
          <p className="text-sm text-burgundy-700">
            Your subscription will end on {formattedDate}. You'll lose access to
            premium features after this date.
          </p>
          <Button
            variant="secondary"
            size="sm"
            className="mt-3"
            onClick={() => {
              // TODO: Implement reactivation
            }}
          >
            Keep My Subscription
          </Button>
        </div>
      )}
    </div>
  );
}
