"use client";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Check, Star, X } from "lucide-react";
import type { SubscriptionPlan, BillingCycle } from "@lighthouse/database";

interface PlanCardProps {
  plan: SubscriptionPlan;
  billingCycle: BillingCycle;
  isCurrentPlan?: boolean;
  isRecommended?: boolean;
  onSelect: () => void;
  isLoading?: boolean;
}

// Feature display names and descriptions
const featureInfo: Record<string, { name: string; description?: string }> = {
  basic_search: { name: "Basic search" },
  ai_matching: { name: "AI matching", description: "Smart candidate matching" },
  client_portal: { name: "Client portal", description: "Share shortlists" },
  whatsapp_integration: { name: "WhatsApp integration" },
  api_access: { name: "API access" },
  white_label: { name: "White label", description: "Your branding" },
  priority_support: { name: "Priority support" },
  dedicated_support: { name: "Dedicated support" },
  manual_matching: { name: "Manual matching" },
};

export function PlanCard({
  plan,
  billingCycle,
  isCurrentPlan,
  isRecommended,
  onSelect,
  isLoading,
}: PlanCardProps) {
  const price =
    billingCycle === "yearly" ? plan.price_yearly : plan.price_monthly;
  const displayPrice = (price / 100).toFixed(0);
  const isFreePlan = plan.slug === "free";
  const isEnterprise = plan.slug === "enterprise";

  // Calculate yearly savings
  const monthlyTotal = plan.price_monthly * 12;
  const yearlySavings =
    billingCycle === "yearly" && monthlyTotal > plan.price_yearly
      ? Math.round(((monthlyTotal - plan.price_yearly) / monthlyTotal) * 100)
      : 0;

  return (
    <div
      className={cn(
        "relative flex flex-col rounded-2xl border p-6 transition-all",
        isCurrentPlan
          ? "border-gold-300 bg-gold-50/50 ring-2 ring-gold-200"
          : isRecommended
            ? "border-navy-200 bg-white ring-2 ring-navy-100"
            : "border-gray-200 bg-white hover:border-gray-300 hover:shadow-md"
      )}
    >
      {/* Badges */}
      {isRecommended && !isCurrentPlan && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <span className="inline-flex items-center gap-1 rounded-full bg-navy-900 px-3 py-1 text-xs font-semibold text-white">
            <Star className="size-3 fill-gold-400 text-gold-400" />
            RECOMMENDED
          </span>
        </div>
      )}
      {isCurrentPlan && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <span className="inline-flex items-center gap-1 rounded-full bg-gold-500 px-3 py-1 text-xs font-semibold text-white">
            <Check className="size-3" />
            CURRENT PLAN
          </span>
        </div>
      )}

      {/* Plan name */}
      <h3 className="mb-2 text-center text-lg font-bold text-navy-900">
        {plan.name}
      </h3>

      {/* Price */}
      <div className="mb-4 text-center">
        {isFreePlan ? (
          <div className="text-4xl font-bold text-navy-800">Free</div>
        ) : isEnterprise ? (
          <div className="text-2xl font-bold text-navy-800">Contact Us</div>
        ) : (
          <>
            <div className="text-4xl font-bold text-navy-800">
              €{displayPrice}
              <span className="text-base font-normal text-gray-500">
                /{billingCycle === "yearly" ? "year" : "month"}
              </span>
            </div>
            {billingCycle === "yearly" && yearlySavings > 0 && (
              <p className="mt-1 text-sm text-success-600">
                Save {yearlySavings}% vs monthly
              </p>
            )}
            {billingCycle === "monthly" && plan.price_yearly > 0 && (
              <p className="mt-1 text-sm text-gray-500">
                €{(plan.price_yearly / 100).toFixed(0)}/year if billed annually
              </p>
            )}
          </>
        )}
      </div>

      {/* Divider */}
      <div className="mb-4 border-t border-gray-200" />

      {/* Limits */}
      <div className="mb-4 space-y-2">
        <div className="flex items-center gap-2 text-sm">
          <Check className="size-4 text-success-600" />
          <span className="text-gray-700">
            {plan.max_candidates
              ? `${plan.max_candidates.toLocaleString()} candidates`
              : "Unlimited candidates"}
          </span>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <Check className="size-4 text-success-600" />
          <span className="text-gray-700">
            {plan.max_active_jobs
              ? `${plan.max_active_jobs} active jobs`
              : "Unlimited jobs"}
          </span>
        </div>
        {plan.max_team_members && (
          <div className="flex items-center gap-2 text-sm">
            <Check className="size-4 text-success-600" />
            <span className="text-gray-700">
              {plan.max_team_members} team members
            </span>
          </div>
        )}
      </div>

      {/* Features */}
      <div className="mb-6 flex-1 space-y-2">
        {plan.features.map((feature: string) => {
          const info = featureInfo[feature];
          return (
            <div key={feature} className="flex items-center gap-2 text-sm">
              <Check className="size-4 text-success-600" />
              <span className="text-gray-700">{info?.name || feature}</span>
            </div>
          );
        })}
      </div>

      {/* Platform fee */}
      <div className="mb-4 rounded-lg bg-gray-50 px-3 py-2 text-center text-sm text-gray-600">
        <span className="font-semibold text-navy-800">
          {plan.placement_fee_percent}%
        </span>{" "}
        platform fee
      </div>

      {/* CTA Button */}
      {isCurrentPlan ? (
        <Button variant="secondary" disabled className="w-full">
          Current Plan
        </Button>
      ) : isEnterprise ? (
        <Button variant="secondary" onClick={onSelect} className="w-full">
          Contact Sales
        </Button>
      ) : (
        <Button
          variant={isRecommended ? "primary" : "secondary"}
          onClick={onSelect}
          disabled={isLoading}
          className="w-full"
        >
          {isLoading ? "Processing..." : isFreePlan ? "Downgrade" : "Upgrade"}
        </Button>
      )}
    </div>
  );
}
