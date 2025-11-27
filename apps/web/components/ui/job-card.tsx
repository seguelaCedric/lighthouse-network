"use client";

import * as React from "react";
import { Building2, Calendar, Clock, DollarSign, Users, Globe } from "lucide-react";
import { cn } from "@/lib/utils";
import { StatusBadge, type StatusType } from "./status-badge";

export interface JobCardProps {
  title: string;
  client: string;
  salaryMin?: number;
  salaryMax?: number;
  salaryCurrency?: string;
  salaryPeriod?: "hourly" | "daily" | "weekly" | "monthly" | "yearly";
  startDate?: Date | string;
  status: StatusType;
  daysOpen?: number;
  candidatesCount?: number;
  applicantsCount?: number;
  onClick?: () => void;
  selected?: boolean;
  className?: string;
}

const formatCurrency = (
  amount: number,
  currency: string = "USD"
): string => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

const formatDate = (date: Date | string): string => {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

const periodLabels: Record<string, string> = {
  hourly: "/hr",
  daily: "/day",
  weekly: "/wk",
  monthly: "/mo",
  yearly: "/yr",
};

const JobCard = React.forwardRef<HTMLDivElement, JobCardProps>(
  (
    {
      title,
      client,
      salaryMin,
      salaryMax,
      salaryCurrency = "USD",
      salaryPeriod = "yearly",
      startDate,
      status,
      daysOpen,
      candidatesCount,
      applicantsCount,
      onClick,
      selected,
      className,
    },
    ref
  ) => {
    const salaryDisplay = React.useMemo(() => {
      if (!salaryMin && !salaryMax) return null;
      if (salaryMin && salaryMax) {
        return `${formatCurrency(salaryMin, salaryCurrency)} - ${formatCurrency(salaryMax, salaryCurrency)}${periodLabels[salaryPeriod]}`;
      }
      if (salaryMin) {
        return `From ${formatCurrency(salaryMin, salaryCurrency)}${periodLabels[salaryPeriod]}`;
      }
      return `Up to ${formatCurrency(salaryMax!, salaryCurrency)}${periodLabels[salaryPeriod]}`;
    }, [salaryMin, salaryMax, salaryCurrency, salaryPeriod]);

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
          <div className="min-w-0 flex-1">
            <h3 className="truncate text-base font-semibold text-navy-900 font-cormorant">
              {title}
            </h3>
            <div className="mt-1 flex items-center gap-1.5 text-sm text-[#7D796F] font-inter">
              <Building2 className="size-4 shrink-0" />
              <span className="truncate">{client}</span>
            </div>
          </div>
          <StatusBadge status={status} />
        </div>

        <div className="space-y-2">
          {salaryDisplay && (
            <div className="flex items-center gap-1.5 text-xl text-navy-700">
              <DollarSign className="size-4 text-gray-400" />
              <span className="font-semibold">{salaryDisplay}</span>
            </div>
          )}

          <div className="flex flex-wrap items-center gap-4">
            {startDate && (
              <div className="flex items-center gap-1.5 text-sm text-[#7D796F] font-inter">
                <Calendar className="size-4" />
                <span>Starts {formatDate(startDate)}</span>
              </div>
            )}
            {daysOpen !== undefined && (
              <div className="flex items-center gap-1.5 text-sm text-[#7D796F] font-inter">
                <Clock className="size-4" />
                <span>
                  {daysOpen === 0
                    ? "Posted today"
                    : daysOpen === 1
                      ? "1 day open"
                      : `${daysOpen} days open`}
                </span>
              </div>
            )}
            {candidatesCount !== undefined && candidatesCount > 0 && (
              <div className="flex items-center gap-1.5 text-sm text-navy-600 font-inter font-medium">
                <Users className="size-4" />
                <span>{candidatesCount} candidate{candidatesCount !== 1 ? "s" : ""}</span>
              </div>
            )}
            {applicantsCount !== undefined && applicantsCount > 0 && (
              <div className="flex items-center gap-1.5 text-sm text-success-600 font-inter font-medium">
                <Globe className="size-4" />
                <span>{applicantsCount} applicant{applicantsCount !== 1 ? "s" : ""}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }
);
JobCard.displayName = "JobCard";

export { JobCard };
