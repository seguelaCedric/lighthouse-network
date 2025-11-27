"use client";

import { Check } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";

export interface PricingPlan {
  id: string;
  name: string;
  tagline: string;
  monthlyPrice: number | null;
  yearlyPrice: number | null;
  features: string[];
  platformFee: string;
  ctaText: string;
  ctaHref: string;
  isPopular?: boolean;
  isEnterprise?: boolean;
}

interface PricingCardProps {
  plan: PricingPlan;
  billingCycle: "monthly" | "yearly";
}

export function PricingCard({ plan, billingCycle }: PricingCardProps) {
  const price = billingCycle === "monthly" ? plan.monthlyPrice : plan.yearlyPrice;
  const monthlyEquivalent = plan.yearlyPrice ? Math.round(plan.yearlyPrice / 12) : null;

  return (
    <div
      className={cn(
        "relative flex flex-col rounded-2xl border bg-white p-8 shadow-sm transition-shadow hover:shadow-md",
        plan.isPopular
          ? "border-gold-400 ring-2 ring-gold-400"
          : "border-gray-200"
      )}
    >
      {/* Popular Badge */}
      {plan.isPopular && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <span className="inline-flex items-center gap-1 rounded-full bg-gold-500 px-3 py-1 text-xs font-semibold text-white">
            <svg
              className="size-3"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
            POPULAR
          </span>
        </div>
      )}

      {/* Plan Header */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold uppercase tracking-wide text-gray-500">
          {plan.name}
        </h3>
        <p className="mt-1 text-sm text-gray-600">{plan.tagline}</p>
      </div>

      {/* Pricing */}
      <div className="mb-6">
        {plan.isEnterprise ? (
          <div>
            <span className="text-4xl font-bold text-navy-900">Custom</span>
            <p className="mt-1 text-sm text-gray-500">Contact us for pricing</p>
          </div>
        ) : price === 0 ? (
          <div>
            <span className="text-4xl font-bold text-navy-900">Free</span>
            <p className="mt-1 text-sm text-gray-500">Forever</p>
          </div>
        ) : (
          <div>
            <span className="text-4xl font-bold text-navy-900">
              &euro;{billingCycle === "yearly" && monthlyEquivalent ? monthlyEquivalent : price}
            </span>
            <span className="text-gray-500">/month</span>
            {billingCycle === "yearly" && plan.yearlyPrice && (
              <p className="mt-1 text-sm text-gray-500">
                Billed &euro;{plan.yearlyPrice} yearly
              </p>
            )}
          </div>
        )}
      </div>

      {/* Divider */}
      <div className="mb-6 h-px bg-gray-200" />

      {/* Features */}
      <ul className="mb-6 flex-1 space-y-3">
        {plan.features.map((feature, index) => (
          <li key={index} className="flex items-start gap-3">
            <Check className="mt-0.5 size-4 shrink-0 text-success-500" />
            <span className="text-sm text-gray-700">{feature}</span>
          </li>
        ))}
      </ul>

      {/* Platform Fee */}
      <div className="mb-6 rounded-lg bg-gray-50 px-4 py-3">
        <p className="text-sm text-gray-600">
          <span className="font-medium text-navy-800">Platform fee:</span>{" "}
          {plan.platformFee}
        </p>
      </div>

      {/* CTA */}
      <Link
        href={plan.ctaHref}
        className={cn(
          buttonVariants({ variant: plan.isPopular ? "primary" : "secondary" }),
          "w-full"
        )}
      >
        {plan.ctaText}
      </Link>
    </div>
  );
}
