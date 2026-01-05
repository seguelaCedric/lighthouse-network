"use client";

import * as React from "react";
import { Building2, CheckCircle2, Briefcase, Euro } from "lucide-react";
import { cn } from "@/lib/utils";

interface EmployerEnquiryStatsProps {
  totalEnquiries: number;
  verified: number;
  totalPlacements: number;
  pendingRewards: number;
  totalEarned: number;
  placementReward: number;
  className?: string;
}

function formatCurrency(cents: number): string {
  return new Intl.NumberFormat("en-EU", {
    style: "currency",
    currency: "EUR",
  }).format(cents / 100);
}

export function EmployerEnquiryStats({
  totalEnquiries,
  verified,
  totalPlacements,
  pendingRewards,
  totalEarned,
  placementReward,
  className,
}: EmployerEnquiryStatsProps) {
  return (
    <div className={cn("grid gap-4 sm:grid-cols-2 lg:grid-cols-4", className)}>
      {/* Total Leads */}
      <div className="rounded-xl border border-gray-200 bg-white p-4">
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-lg bg-navy-100">
            <Building2 className="size-5 text-navy-600" />
          </div>
          <div>
            <p className="text-sm text-gray-500">Leads Submitted</p>
            <p className="text-2xl font-bold text-navy-900">{totalEnquiries}</p>
          </div>
        </div>
      </div>

      {/* Verified */}
      <div className="rounded-xl border border-gray-200 bg-white p-4">
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-lg bg-green-100">
            <CheckCircle2 className="size-5 text-green-600" />
          </div>
          <div>
            <p className="text-sm text-gray-500">Verified</p>
            <p className="text-2xl font-bold text-navy-900">{verified}</p>
          </div>
        </div>
      </div>

      {/* Placements */}
      <div className="rounded-xl border border-gray-200 bg-white p-4">
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-lg bg-gold-100">
            <Briefcase className="size-5 text-gold-600" />
          </div>
          <div>
            <p className="text-sm text-gray-500">Placements</p>
            <p className="text-2xl font-bold text-navy-900">{totalPlacements}</p>
          </div>
        </div>
      </div>

      {/* Earnings */}
      <div className="rounded-xl border border-gray-200 bg-white p-4">
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-lg bg-success-100">
            <Euro className="size-5 text-success-600" />
          </div>
          <div>
            <p className="text-sm text-gray-500">Total Earned</p>
            <p className="text-2xl font-bold text-success-600">
              {formatCurrency(totalEarned)}
            </p>
            {pendingRewards > 0 && (
              <p className="text-xs text-gray-500">
                +{formatCurrency(pendingRewards)} pending
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Reward info */}
      <div className="col-span-full rounded-lg bg-gold-50 p-4">
        <p className="text-sm text-gold-800">
          <strong>Earn {formatCurrency(placementReward)}</strong> for every
          placement from an employer you refer. Verified leads that result in
          successful placements earn rewards!
        </p>
      </div>
    </div>
  );
}
