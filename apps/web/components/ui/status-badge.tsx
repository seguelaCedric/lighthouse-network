"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export type StatusType =
  | "new"
  | "parsing"
  | "shortlisted"
  | "interview"
  | "placed"
  | "offer"
  | "rejected";

export interface StatusBadgeProps {
  status: StatusType;
  className?: string;
}

const statusConfig: Record<
  StatusType,
  { label: string; className: string }
> = {
  new: {
    label: "New",
    className: "bg-navy-50 text-navy-600",
  },
  parsing: {
    label: "Parsing",
    className: "bg-warning-50 text-warning-600",
  },
  shortlisted: {
    label: "Shortlisted",
    className: "bg-burgundy-50 text-burgundy-600",
  },
  interview: {
    label: "Interview",
    className: "bg-gold-100 text-gold-700",
  },
  placed: {
    label: "Placed",
    className: "bg-success-50 text-success-700",
  },
  offer: {
    label: "Offer",
    className: "bg-success-100 text-success-700",
  },
  rejected: {
    label: "Rejected",
    className: "bg-error-100 text-error-700",
  },
};

const StatusBadge = React.forwardRef<HTMLSpanElement, StatusBadgeProps>(
  ({ status, className }, ref) => {
    const config = statusConfig[status];

    return (
      <span
        ref={ref}
        className={cn(
          "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium",
          config.className,
          className
        )}
      >
        {config.label}
      </span>
    );
  }
);
StatusBadge.displayName = "StatusBadge";

export { StatusBadge };
