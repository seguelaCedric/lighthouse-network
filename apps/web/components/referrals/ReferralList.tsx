"use client";

import * as React from "react";
import {
  UserPlus,
  FileText,
  Briefcase,
  Clock,
  CheckCircle,
  XCircle,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Referral {
  id: string;
  referred_name: string;
  referred_photo: string | null;
  status: "pending" | "signed_up" | "applied" | "placed" | "expired" | "invalid";
  clicked_at: string;
  signed_up_at: string | null;
  applied_at: string | null;
  placed_at: string | null;
  source: string;
  expires_at: string;
  rewards_pending: number;
  rewards_earned: number;
}

interface ReferralListProps {
  referrals: Referral[];
  className?: string;
}

function formatCurrency(cents: number): string {
  return new Intl.NumberFormat("en-EU", {
    style: "currency",
    currency: "EUR",
  }).format(cents / 100);
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
  });
}

function getStatusConfig(status: Referral["status"]) {
  switch (status) {
    case "placed":
      return {
        icon: CheckCircle,
        label: "Placed",
        color: "text-success-600",
        bgColor: "bg-success-100",
        borderColor: "border-success-200",
      };
    case "applied":
      return {
        icon: FileText,
        label: "Applied",
        color: "text-gold-600",
        bgColor: "bg-gold-100",
        borderColor: "border-gold-200",
      };
    case "signed_up":
      return {
        icon: UserPlus,
        label: "Signed Up",
        color: "text-blue-600",
        bgColor: "bg-blue-100",
        borderColor: "border-blue-200",
      };
    case "pending":
      return {
        icon: Clock,
        label: "Pending",
        color: "text-gray-500",
        bgColor: "bg-gray-100",
        borderColor: "border-gray-200",
      };
    case "expired":
      return {
        icon: XCircle,
        label: "Expired",
        color: "text-gray-400",
        bgColor: "bg-gray-50",
        borderColor: "border-gray-200",
      };
    case "invalid":
      return {
        icon: XCircle,
        label: "Invalid",
        color: "text-error-500",
        bgColor: "bg-error-50",
        borderColor: "border-error-200",
      };
    default:
      return {
        icon: Clock,
        label: "Unknown",
        color: "text-gray-500",
        bgColor: "bg-gray-100",
        borderColor: "border-gray-200",
      };
  }
}

function ReferralCard({ referral }: { referral: Referral }) {
  const statusConfig = getStatusConfig(referral.status);
  const StatusIcon = statusConfig.icon;

  return (
    <div
      className={cn(
        "rounded-xl border bg-white p-4 transition-shadow hover:shadow-md",
        statusConfig.borderColor
      )}
    >
      <div className="flex items-start justify-between gap-4">
        {/* Left: Avatar + Info */}
        <div className="flex items-start gap-3">
          {/* Avatar */}
          {referral.referred_photo ? (
            <img
              src={referral.referred_photo}
              alt=""
              className="size-12 rounded-full object-cover ring-2 ring-gray-100"
            />
          ) : (
            <div className="flex size-12 items-center justify-center rounded-full bg-gray-100 ring-2 ring-gray-200">
              <span className="text-lg font-semibold text-gray-400">
                {referral.referred_name.charAt(0)}
              </span>
            </div>
          )}

          {/* Info */}
          <div>
            <h4 className="font-medium text-navy-900">{referral.referred_name}</h4>

            {/* Timeline */}
            <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-gray-500">
              <span>Clicked: {formatDate(referral.clicked_at)}</span>
              {referral.signed_up_at && (
                <>
                  <span className="text-gray-300">•</span>
                  <span className="text-blue-600">
                    Signed up: {formatDate(referral.signed_up_at)}
                  </span>
                </>
              )}
              {referral.applied_at && (
                <>
                  <span className="text-gray-300">•</span>
                  <span className="text-gold-600">
                    Applied: {formatDate(referral.applied_at)}
                  </span>
                </>
              )}
              {referral.placed_at && (
                <>
                  <span className="text-gray-300">•</span>
                  <span className="text-success-600">
                    Placed: {formatDate(referral.placed_at)}
                  </span>
                </>
              )}
            </div>

            {/* Rewards */}
            <div className="mt-2 flex items-center gap-3">
              {referral.rewards_earned > 0 && (
                <span className="inline-flex items-center rounded-full bg-success-100 px-2 py-0.5 text-xs font-medium text-success-700">
                  Earned: {formatCurrency(referral.rewards_earned)}
                </span>
              )}
              {referral.rewards_pending > 0 && (
                <span className="inline-flex items-center rounded-full bg-gold-100 px-2 py-0.5 text-xs font-medium text-gold-700">
                  Pending: {formatCurrency(referral.rewards_pending)}
                </span>
              )}
              {referral.status === "pending" && (
                <span className="text-xs text-gray-400">
                  Expires: {formatDate(referral.expires_at)}
                </span>
              )}
              {referral.status === "signed_up" && (
                <span className="text-xs text-gray-500">
                  €10 when they apply
                </span>
              )}
              {referral.status === "applied" && (
                <span className="text-xs text-gray-500">
                  €50 when placed
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Right: Status Badge */}
        <div
          className={cn(
            "flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5",
            statusConfig.bgColor
          )}
        >
          <StatusIcon className={cn("size-4", statusConfig.color)} />
          <span className={cn("text-sm font-medium", statusConfig.color)}>
            {statusConfig.label}
          </span>
        </div>
      </div>
    </div>
  );
}

export function ReferralList({ referrals, className }: ReferralListProps) {
  if (referrals.length === 0) {
    return (
      <div className={cn("rounded-xl border border-gray-200 bg-white p-8 text-center", className)}>
        <div className="mx-auto mb-3 flex size-16 items-center justify-center rounded-full bg-gray-100">
          <UserPlus className="size-8 text-gray-400" />
        </div>
        <h4 className="mb-1 font-medium text-navy-900">No referrals yet</h4>
        <p className="text-sm text-gray-500">
          Share your link with friends to start earning rewards!
        </p>
      </div>
    );
  }

  return (
    <div className={cn("space-y-3", className)}>
      {referrals.map((referral) => (
        <ReferralCard key={referral.id} referral={referral} />
      ))}
    </div>
  );
}
