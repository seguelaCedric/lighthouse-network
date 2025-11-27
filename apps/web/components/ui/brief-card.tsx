"use client";

import * as React from "react";
import { FileText, Sparkles, AlertCircle, CheckCircle2, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

export type BriefStatus = "processing" | "ready" | "error" | "draft";

export interface BriefCardProps {
  preview: string;
  confidenceScore?: number;
  status: BriefStatus;
  title?: string;
  createdAt?: Date | string;
  onClick?: () => void;
  selected?: boolean;
  className?: string;
}

const statusConfig: Record<
  BriefStatus,
  { label: string; icon: React.ElementType; className: string }
> = {
  processing: {
    label: "Processing",
    icon: Clock,
    className: "bg-warning-100 text-warning-700",
  },
  ready: {
    label: "Ready",
    icon: CheckCircle2,
    className: "bg-success-100 text-success-700",
  },
  error: {
    label: "Error",
    icon: AlertCircle,
    className: "bg-error-100 text-error-700",
  },
  draft: {
    label: "Draft",
    icon: FileText,
    className: "bg-gray-100 text-gray-600",
  },
};

const BriefCard = React.forwardRef<HTMLDivElement, BriefCardProps>(
  (
    {
      preview,
      confidenceScore,
      status,
      title,
      createdAt,
      onClick,
      selected,
      className,
    },
    ref
  ) => {
    const config = statusConfig[status];
    const StatusIcon = config.icon;

    const formatDate = (date: Date | string) => {
      const d = typeof date === "string" ? new Date(date) : date;
      return d.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
      });
    };

    return (
      <div
        ref={ref}
        onClick={onClick}
        role={onClick ? "button" : undefined}
        tabIndex={onClick ? 0 : undefined}
        onKeyDown={
          onClick
            ? (e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  onClick();
                }
              }
            : undefined
        }
        className={cn(
          "rounded-lg border border-gray-300/60 bg-white p-6 shadow-[0px_2px_4px_rgba(26,24,22,0.06)] transition-shadow duration-250 ease-out",
          onClick && "cursor-pointer hover:shadow-[0px_4px_8px_rgba(26,24,22,0.08)]",
          selected && "border-gold-500 ring-2 ring-gold-500/20",
          className
        )}
      >
        <div className="mb-3 flex items-start justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="flex size-8 items-center justify-center rounded-lg bg-navy-100">
              <FileText className="size-4 text-navy-600" />
            </div>
            {title && (
              <h3 className="truncate text-sm font-semibold text-navy-900 font-cormorant">
                {title}
              </h3>
            )}
          </div>
          <div
            className={cn(
              "flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium",
              config.className
            )}
          >
            <StatusIcon className="size-3" />
            {config.label}
          </div>
        </div>

        <p className="mb-3 line-clamp-3 text-sm text-[#7D796F] font-inter">{preview}</p>

        <div className="flex items-center justify-between">
          {confidenceScore !== undefined && status === "ready" && (
            <div className="flex items-center gap-1.5">
              <Sparkles className="size-4 text-gold-500" />
              <span className="text-xs text-[#7D796F] font-inter">Confidence</span>
              <div className="flex items-center gap-1">
                <div className="h-1.5 w-16 overflow-hidden rounded-full bg-gray-200">
                  <div
                    className="h-full rounded-full transition-all bg-gradient-to-r from-gold-500 to-gold-400"
                    style={{ width: `${confidenceScore}%` }}
                  />
                </div>
                <span className="text-xs font-medium text-navy-700 font-inter">
                  {confidenceScore}%
                </span>
              </div>
            </div>
          )}
          {createdAt && (
            <span className="text-xs text-[#7D796F] font-inter">{formatDate(createdAt)}</span>
          )}
        </div>
      </div>
    );
  }
);
BriefCard.displayName = "BriefCard";

export { BriefCard };
