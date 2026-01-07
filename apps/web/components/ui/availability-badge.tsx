"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export type AvailabilityStatus =
  | "available"
  | "not_looking"
  | "on_contract"
  | "notice_period";

export interface AvailabilityBadgeProps {
  status: AvailabilityStatus;
  noticePeriodDays?: number;
  availableFromDate?: string;
  className?: string;
}

const statusConfig: Record<
  AvailabilityStatus,
  { label: string; dotClassName: string; badgeClassName: string; hasPulse?: boolean }
> = {
  available: {
    label: "Available",
    dotClassName: "bg-success-500",
    badgeClassName: "bg-success-50 text-success-700 border border-success-300",
    hasPulse: true,
  },
  not_looking: {
    label: "Not Looking",
    dotClassName: "bg-gray-400",
    badgeClassName: "bg-gray-100 text-gray-500 border border-gray-200",
  },
  on_contract: {
    label: "On Contract",
    dotClassName: "bg-warning-600",
    badgeClassName: "bg-warning-50 text-warning-800 border border-warning-300",
  },
  notice_period: {
    label: "Notice Period",
    dotClassName: "bg-gold-600",
    badgeClassName: "bg-gold-50 text-gold-800 border border-gold-300",
  },
};

const AvailabilityBadge = React.forwardRef<HTMLDivElement, AvailabilityBadgeProps>(
  ({ status, noticePeriodDays, availableFromDate, className }, ref) => {
    const config = statusConfig[status] ?? statusConfig.not_looking;

    let label = config.label;
    // Note: availableFromDate can still be used for display purposes but doesn't change the status
    if (status === "available" && availableFromDate) {
      label = `Available from ${availableFromDate}`;
    }

    return (
      <div
        ref={ref}
        className={cn(
          "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium",
          config.badgeClassName,
          className
        )}
      >
        <span
          className={cn(
            "size-1.5 rounded-full",
            config.dotClassName,
            config.hasPulse && "animate-pulse"
          )}
        />
        {label}
      </div>
    );
  }
);
AvailabilityBadge.displayName = "AvailabilityBadge";

export { AvailabilityBadge };
