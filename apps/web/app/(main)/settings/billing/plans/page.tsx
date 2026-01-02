"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { PlanCard, ChangePlanModal } from "@/components/billing";
import { ArrowLeft } from "lucide-react";
import type {
  SubscriptionPlan,
  AgencySubscriptionWithPlan,
  BillingCycle,
} from "@lighthouse/database";

interface BillingData {
  subscription: AgencySubscriptionWithPlan | null;
  plan: SubscriptionPlan | null;
  is_on_free_plan: boolean;
}

export default function PlansPage() {
  const router = useRouter();
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [billingData, setBillingData] = useState<BillingData | null>(null);
  const [billingCycle, setBillingCycle] = useState<BillingCycle>("monthly");
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan | null>(
    null
  );
  const [showChangePlanModal, setShowChangePlanModal] = useState(false);
  const [isChangingPlan, setIsChangingPlan] = useState(false);

  // Fetch plans and current subscription
  useEffect(() => {
    async function fetchData() {
      try {
        const [plansRes, subscriptionRes] = await Promise.all([
          fetch("/api/billing/plans"),
          fetch("/api/billing/subscription"),
        ]);

        if (plansRes.ok) {
          const data = await plansRes.json();
          setPlans(data.plans || []);
        }

        if (subscriptionRes.ok) {
          const data = await subscriptionRes.json();
          setBillingData(data);
          // Set initial billing cycle from current subscription
          if (data.subscription?.billing_cycle) {
            setBillingCycle(data.subscription.billing_cycle);
          }
        }
      } catch (error) {
        console.error("Failed to fetch plans:", error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchData();
  }, []);

  const handleSelectPlan = (plan: SubscriptionPlan) => {
    // Skip if it's the current plan
    if (billingData?.plan?.id === plan.id) return;

    // For enterprise, redirect to contact
    if (plan.slug === "enterprise") {
      window.location.href = "mailto:sales@lighthouse.crew?subject=Enterprise%20Plan%20Inquiry";
      return;
    }

    setSelectedPlan(plan);
    setShowChangePlanModal(true);
  };

  const handleConfirmPlanChange = async () => {
    if (!selectedPlan) return;

    setIsChangingPlan(true);

    try {
      // If upgrading from free, create checkout session
      if (billingData?.is_on_free_plan) {
        const res = await fetch("/api/billing/subscribe", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            plan_id: selectedPlan.id,
            billing_cycle: billingCycle,
            success_url: `${window.location.origin}/settings/billing?success=true`,
            cancel_url: window.location.href,
          }),
        });

        if (res.ok) {
          const data = await res.json();
          if (data.checkout_url) {
            window.location.href = data.checkout_url;
            return;
          }
        } else {
          const data = await res.json();
          throw new Error(data.error || "Failed to start checkout");
        }
      } else {
        // Changing existing subscription
        const res = await fetch("/api/billing/change-plan", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            plan_id: selectedPlan.id,
            billing_cycle: billingCycle,
          }),
        });

        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || "Failed to change plan");
        }

        // Refresh billing data and redirect
        router.push("/settings/billing?success=true");
      }
    } finally {
      setIsChangingPlan(false);
    }
  };

  // Determine which plan is recommended
  const getRecommendedPlan = () => {
    // Recommend Pro for free users, Enterprise for Pro users
    if (billingData?.is_on_free_plan) {
      return plans.find((p) => p.slug === "pro");
    }
    if (billingData?.plan?.slug === "pro") {
      return plans.find((p) => p.slug === "enterprise");
    }
    return null;
  };

  const recommendedPlan = getRecommendedPlan();

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <div className="h-10 w-10 rounded-lg bg-gray-100 animate-pulse" />
          <div className="space-y-2">
            <div className="h-6 w-40 rounded bg-gray-200 animate-pulse" />
            <div className="h-4 w-64 rounded bg-gray-100 animate-pulse" />
          </div>
        </div>
        <div className="flex justify-center gap-2">
          <div className="h-10 w-32 rounded-lg bg-gray-100 animate-pulse" />
          <div className="h-10 w-40 rounded-lg bg-gray-100 animate-pulse" />
        </div>
        <div className="grid gap-6 md:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-[500px] rounded-2xl border border-gray-200 bg-gray-50 animate-pulse"
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with back button */}
      <div className="flex items-center gap-4">
        <Link
          href="/settings/billing"
          className="flex size-10 items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 hover:text-gray-700"
        >
          <ArrowLeft className="size-5" />
        </Link>
        <div>
          <h2 className="text-2xl font-serif font-medium text-navy-800">
            Choose Your Plan
          </h2>
          <p className="text-sm text-gray-500">
            Select the plan that best fits your recruitment needs
          </p>
        </div>
      </div>

      {/* Billing cycle toggle */}
      <div className="flex justify-center">
        <div className="inline-flex rounded-lg border border-gray-200 bg-gray-50 p-1">
          <button
            onClick={() => setBillingCycle("monthly")}
            className={`rounded-md px-4 py-2 text-sm font-medium transition-colors ${
              billingCycle === "monthly"
                ? "bg-white text-navy-900 shadow-sm"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            Monthly
          </button>
          <button
            onClick={() => setBillingCycle("yearly")}
            className={`rounded-md px-4 py-2 text-sm font-medium transition-colors ${
              billingCycle === "yearly"
                ? "bg-white text-navy-900 shadow-sm"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            Yearly
            <span className="ml-1.5 rounded-full bg-success-100 px-2 py-0.5 text-xs font-semibold text-success-700">
              Save 20%
            </span>
          </button>
        </div>
      </div>

      {/* Plans grid */}
      <div className="grid gap-6 md:grid-cols-3">
        {plans.map((plan) => (
          <PlanCard
            key={plan.id}
            plan={plan}
            billingCycle={billingCycle}
            isCurrentPlan={billingData?.plan?.id === plan.id}
            isRecommended={recommendedPlan?.id === plan.id}
            onSelect={() => handleSelectPlan(plan)}
            isLoading={isChangingPlan && selectedPlan?.id === plan.id}
          />
        ))}
      </div>

      {/* FAQ or additional info */}
      <div className="rounded-xl border border-gray-200 bg-white p-6">
        <h3 className="mb-4 font-semibold text-navy-900">
          Frequently Asked Questions
        </h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <h4 className="font-medium text-navy-800">
              Can I change plans anytime?
            </h4>
            <p className="text-sm text-gray-600">
              Yes, you can upgrade or downgrade at any time. Changes are
              prorated.
            </p>
          </div>
          <div>
            <h4 className="font-medium text-navy-800">
              What are platform fees?
            </h4>
            <p className="text-sm text-gray-600">
              Platform fees are a percentage of placement value when you
              successfully place a candidate.
            </p>
          </div>
          <div>
            <h4 className="font-medium text-navy-800">
              What happens if I downgrade?
            </h4>
            <p className="text-sm text-gray-600">
              You'll keep access to premium features until your current billing
              period ends.
            </p>
          </div>
          <div>
            <h4 className="font-medium text-navy-800">
              Do you offer refunds?
            </h4>
            <p className="text-sm text-gray-600">
              We offer prorated refunds for downgrades. Contact support for full
              refund requests.
            </p>
          </div>
        </div>
      </div>

      {/* Change Plan Modal */}
      {selectedPlan && (
        <ChangePlanModal
          open={showChangePlanModal}
          onOpenChange={setShowChangePlanModal}
          currentPlan={billingData?.plan || null}
          newPlan={selectedPlan}
          billingCycle={billingCycle}
          onConfirm={handleConfirmPlanChange}
        />
      )}
    </div>
  );
}
