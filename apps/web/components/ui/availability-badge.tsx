"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export type AvailabilityStatus =
  | "available"
  | "available_from"
  | "notice_period"
  | "not_looking"
  | "on_contract";

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
    label: "Available Now",
    dotClassName: "bg-success-500",
    badgeClassName: "bg-success-50 text-success-700 border border-success-300",
    hasPulse: true,
  },
  available_from: {
    label: "Available From",
    dotClassName: "bg-navy-500",
    badgeClassName: "bg-navy-50 text-navy-700 border border-navy-200",
  },
  notice_period: {
    label: "Notice Period",
    dotClassName: "bg-warning-500",
    badgeClassName: "bg-warning-50 text-warning-700 border border-warning-300",
  },
  not_looking: {
    label: "Not Looking",
    dotClassName: "bg-gray-400",
    badgeClassName: "bg-gray-100 text-gray-500 border border-gray-200",
  },
  on_contract: {
    label: "On Contract",
    dotClassName: "bg-burgundy-500",
    badgeClassName: "bg-burgundy-50 text-burgundy-700 border border-burgundy-200",
  },
};

const AvailabilityBadge = React.forwardRef<HTMLDivElement, AvailabilityBadgeProps>(
  ({ status, noticePeriodDays, availableFromDate, className }, ref) => {
    const config = statusConfig[status] ?? statusConfig.not_looking;

    let label = config.label;
    if (status === "notice_period" && noticePeriodDays) {
      label = `${noticePeriodDays}d Notice`;
    } else if (status === "available_from" && availableFromDate) {
      label = `From ${availableFromDate}`;
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
