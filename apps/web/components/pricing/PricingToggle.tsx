"use client";

import { cn } from "@/lib/utils";

interface PricingToggleProps {
  billingCycle: "monthly" | "yearly";
  onToggle: (cycle: "monthly" | "yearly") => void;
}

export function PricingToggle({ billingCycle, onToggle }: PricingToggleProps) {
  return (
    <div className="flex items-center justify-center gap-3">
      <button
        onClick={() => onToggle("monthly")}
        className={cn(
          "px-4 py-2 text-sm font-medium rounded-lg transition-colors",
          billingCycle === "monthly"
            ? "bg-navy-800 text-white"
            : "bg-gray-100 text-gray-600 hover:bg-gray-200"
        )}
      >
        Monthly
      </button>
      <button
        onClick={() => onToggle("yearly")}
        className={cn(
          "px-4 py-2 text-sm font-medium rounded-lg transition-colors flex items-center gap-2",
          billingCycle === "yearly"
            ? "bg-navy-800 text-white"
            : "bg-gray-100 text-gray-600 hover:bg-gray-200"
        )}
      >
        Yearly
        <span
          className={cn(
            "text-xs px-2 py-0.5 rounded-full",
            billingCycle === "yearly"
              ? "bg-gold-500 text-white"
              : "bg-gold-100 text-gold-700"
          )}
        >
          Save 20%
        </span>
      </button>
    </div>
  );
}
