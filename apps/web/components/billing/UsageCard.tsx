"use client";

import { cn } from "@/lib/utils";
import { Users, Briefcase, Award, TrendingUp } from "lucide-react";
import type { SubscriptionUsage } from "@lighthouse/database";

interface UsageCardProps {
  usage: SubscriptionUsage | null;
  pendingFees?: number; // in cents
  placementFeePercent?: number;
  isLoading?: boolean;
}

function UsageItem({
  icon: Icon,
  label,
  used,
  limit,
  color = "navy",
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  used: number;
  limit: number | null;
  color?: "navy" | "gold" | "success";
}) {
  const isUnlimited = limit === null;
  const percentage = isUnlimited ? 0 : Math.min((used / limit) * 100, 100);
  const isNearLimit = !isUnlimited && percentage >= 80;
  const isAtLimit = !isUnlimited && percentage >= 100;

  const colorClasses = {
    navy: "bg-navy-600",
    gold: "bg-gold-500",
    success: "bg-success-500",
  };

  return (
    <div className="rounded-lg bg-gray-50 p-4">
      <div className="mb-2 flex items-center gap-2">
        <Icon className="size-4 text-gray-500" />
        <span className="text-sm text-gray-600">{label}</span>
      </div>
      <p className="text-3xl font-bold text-navy-800">
        {used.toLocaleString()}
        <span className="text-base font-normal text-gray-400">
          /{isUnlimited ? "∞" : limit.toLocaleString()}
        </span>
      </p>
      <div className="mt-2 h-2 overflow-hidden rounded-full bg-gray-200">
        <div
          className={cn(
            "h-full rounded-full transition-all",
            isAtLimit
              ? "bg-burgundy-500"
              : isNearLimit
                ? "bg-gold-500"
                : colorClasses[color]
          )}
          style={{
            width: isUnlimited ? "0%" : `${percentage}%`,
          }}
        />
      </div>
      {isNearLimit && !isAtLimit && (
        <p className="mt-1 text-xs text-gold-600">
          {(100 - percentage).toFixed(0)}% remaining
        </p>
      )}
      {isAtLimit && (
        <p className="mt-1 text-xs text-burgundy-600">Limit reached</p>
      )}
    </div>
  );
}

export function UsageCard({
  usage,
  pendingFees = 0,
  placementFeePercent = 10,
  isLoading,
}: UsageCardProps) {
  if (isLoading) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white p-6 animate-pulse">
        <div className="mb-4 h-6 w-40 rounded bg-gray-200" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="rounded-lg bg-gray-100 p-4">
              <div className="mb-2 h-4 w-20 rounded bg-gray-200" />
              <div className="h-9 w-24 rounded bg-gray-200" />
              <div className="mt-2 h-2 w-full rounded-full bg-gray-200" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  const placementsCount = usage?.placements_this_month?.used || 0;
  const formattedPendingFees =
    pendingFees > 0 ? `€${(pendingFees / 100).toFixed(0)}` : "€0";

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6">
      <h3 className="mb-4 font-semibold text-navy-900">Usage This Period</h3>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <UsageItem
          icon={Users}
          label="Candidates"
          used={usage?.candidates?.used || 0}
          limit={usage?.candidates?.limit ?? null}
          color="navy"
        />
        <UsageItem
          icon={Briefcase}
          label="Active Jobs"
          used={usage?.active_jobs?.used || 0}
          limit={usage?.active_jobs?.limit ?? null}
          color="success"
        />
        <UsageItem
          icon={Users}
          label="Team Members"
          used={usage?.team_members?.used || 0}
          limit={usage?.team_members?.limit ?? null}
          color="navy"
        />

        {/* Placements with pending fees */}
        <div className="rounded-lg bg-gray-50 p-4">
          <div className="mb-2 flex items-center gap-2">
            <Award className="size-4 text-gray-500" />
            <span className="text-sm text-gray-600">Placements</span>
          </div>
          <p className="text-3xl font-bold text-navy-800">{placementsCount}</p>
          {pendingFees > 0 && (
            <div className="mt-2 flex items-center gap-1 rounded-md bg-gold-50 px-2 py-1 text-xs text-gold-700">
              <TrendingUp className="size-3" />
              {formattedPendingFees} platform fees pending
            </div>
          )}
          {pendingFees === 0 && placementsCount === 0 && (
            <p className="mt-2 text-xs text-gray-500">No placements yet</p>
          )}
          {pendingFees === 0 && placementsCount > 0 && (
            <p className="mt-2 text-xs text-gray-500">
              {placementFeePercent}% platform fee per placement
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
