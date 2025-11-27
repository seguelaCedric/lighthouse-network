"use client";

import * as React from "react";
import {
  DollarSign,
  Users,
  TrendingUp,
  Clock,
  Wallet,
  CheckCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface ReferralStatsProps {
  totalEarned: number;
  availableBalance: number;
  pendingRewards: number;
  totalReferrals: number;
  signedUp: number;
  applied: number;
  placed: number;
  className?: string;
}

function formatCurrency(cents: number): string {
  return new Intl.NumberFormat("en-EU", {
    style: "currency",
    currency: "EUR",
  }).format(cents / 100);
}

export function ReferralStats({
  totalEarned,
  availableBalance,
  pendingRewards,
  totalReferrals,
  signedUp,
  applied,
  placed,
  className,
}: ReferralStatsProps) {
  const conversionRate =
    totalReferrals > 0 ? Math.round((signedUp / totalReferrals) * 100) : 0;

  return (
    <div className={cn("space-y-6", className)}>
      {/* Earnings Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <div className="mb-3 flex items-center gap-2">
            <div className="flex size-10 items-center justify-center rounded-full bg-success-100">
              <DollarSign className="size-5 text-success-600" />
            </div>
            <span className="text-sm font-medium text-gray-600">Total Earned</span>
          </div>
          <p className="text-3xl font-bold text-navy-900">
            {formatCurrency(totalEarned)}
          </p>
          <p className="mt-1 text-xs text-gray-500">Lifetime earnings</p>
        </div>

        <div className="rounded-xl border border-gold-200 bg-gold-50 p-5">
          <div className="mb-3 flex items-center gap-2">
            <div className="flex size-10 items-center justify-center rounded-full bg-gold-100">
              <Wallet className="size-5 text-gold-600" />
            </div>
            <span className="text-sm font-medium text-gold-700">Available</span>
          </div>
          <p className="text-3xl font-bold text-gold-800">
            {formatCurrency(availableBalance)}
          </p>
          <p className="mt-1 text-xs text-gold-600">Ready to withdraw</p>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <div className="mb-3 flex items-center gap-2">
            <div className="flex size-10 items-center justify-center rounded-full bg-gray-100">
              <Clock className="size-5 text-gray-600" />
            </div>
            <span className="text-sm font-medium text-gray-600">Pending</span>
          </div>
          <p className="text-3xl font-bold text-navy-900">
            {formatCurrency(pendingRewards)}
          </p>
          <p className="mt-1 text-xs text-gray-500">Awaiting approval</p>
        </div>
      </div>

      {/* Referral Stats */}
      <div className="rounded-xl border border-gray-200 bg-white p-5">
        <h4 className="mb-4 font-serif text-lg font-medium text-navy-800">
          Referral Performance
        </h4>

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div className="text-center">
            <div className="mb-1 flex items-center justify-center gap-1">
              <Users className="size-4 text-gray-400" />
              <span className="text-2xl font-bold text-navy-900">{totalReferrals}</span>
            </div>
            <p className="text-xs text-gray-500">Total Referrals</p>
          </div>

          <div className="text-center">
            <div className="mb-1 flex items-center justify-center gap-1">
              <CheckCircle className="size-4 text-success-500" />
              <span className="text-2xl font-bold text-navy-900">{signedUp}</span>
            </div>
            <p className="text-xs text-gray-500">Signed Up</p>
          </div>

          <div className="text-center">
            <div className="mb-1 flex items-center justify-center gap-1">
              <TrendingUp className="size-4 text-gold-500" />
              <span className="text-2xl font-bold text-navy-900">{applied}</span>
            </div>
            <p className="text-xs text-gray-500">Applied</p>
          </div>

          <div className="text-center">
            <div className="mb-1 flex items-center justify-center gap-1">
              <DollarSign className="size-4 text-success-500" />
              <span className="text-2xl font-bold text-navy-900">{placed}</span>
            </div>
            <p className="text-xs text-gray-500">Placed</p>
          </div>
        </div>

        {/* Conversion Funnel Visual */}
        <div className="mt-6">
          <div className="mb-2 flex items-center justify-between text-sm">
            <span className="text-gray-600">Conversion Rate</span>
            <span className="font-medium text-navy-900">{conversionRate}%</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-gray-200">
            <div
              className="h-full rounded-full bg-gradient-to-r from-gold-400 to-gold-500 transition-all duration-500"
              style={{ width: `${conversionRate}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
