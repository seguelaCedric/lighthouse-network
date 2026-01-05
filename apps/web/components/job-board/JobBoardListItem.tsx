"use client";

import {
  AlertTriangle,
  ChevronRight,
} from "lucide-react";
import Link from "next/link";
import type { PublicJob } from "./JobBoardCard";

interface JobBoardListItemProps {
  job: PublicJob;
  matchScore?: number;
}

// Format position category for display
function formatPositionCategory(category: string): string {
  return category
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

// Format contract type for display
function formatContractType(type: string): string {
  const typeMap: Record<string, string> = {
    permanent: "Permanent",
    seasonal: "Seasonal",
    temporary: "Temporary",
    rotational: "Rotational",
    freelance: "Freelance",
  };
  return typeMap[type.toLowerCase()] || type.charAt(0).toUpperCase() + type.slice(1);
}

// Format vessel type for display
function formatVesselType(type: string): string {
  const typeMap: Record<string, string> = {
    motor: "Motor Yacht",
    sail: "Sailing Yacht",
    sailing: "Sailing Yacht",
    catamaran: "Catamaran",
    explorer: "Explorer Yacht",
    gulet: "Gulet",
    classic: "Classic Yacht",
    sportfish: "Sport Fishing",
    superyacht: "Superyacht",
  };
  return typeMap[type.toLowerCase()] || type.charAt(0).toUpperCase() + type.slice(1);
}

// Format salary for display (compact version)
function formatSalaryCompact(
  min: number | null,
  max: number | null,
  currency: string | null,
  period: string | null
): string {
  const currencySymbol = currency === "USD" ? "$" : currency === "GBP" ? "£" : "€";
  const periodLabel = period === "yearly" ? "/yr" : period === "daily" ? "/day" : "/mo";

  if (min && max) {
    if (min === max) {
      return `${currencySymbol}${(min / 1000).toFixed(min >= 1000 ? 0 : 1)}k${periodLabel}`;
    }
    return `${currencySymbol}${(min / 1000).toFixed(0)}-${(max / 1000).toFixed(0)}k${periodLabel}`;
  }
  if (min) {
    return `${currencySymbol}${(min / 1000).toFixed(0)}k+${periodLabel}`;
  }
  if (max) {
    return `≤${currencySymbol}${(max / 1000).toFixed(0)}k${periodLabel}`;
  }
  return "";
}

// Format date for display (compact)
function formatDateCompact(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffDays = Math.ceil((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Tomorrow";
  if (diffDays > 0 && diffDays <= 7) return `In ${diffDays}d`;
  if (diffDays > 7 && diffDays <= 30) return `In ${Math.ceil(diffDays / 7)}w`;

  return date.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
  });
}

// Format posted date
function formatPostedDate(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
  const diffDays = Math.floor(diffHours / 24);

  if (diffHours < 1) return "Just now";
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays}d ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`;
  return date.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

// Check if date is soon (within 14 days)
function isStartingSoon(dateString: string): boolean {
  const date = new Date(dateString);
  const now = new Date();
  const diffDays = Math.ceil((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  return diffDays >= 0 && diffDays <= 14;
}

// Get match score styles
function getMatchScoreStyles(score: number): { bg: string; text: string; ring: string } {
  if (score >= 80) return { bg: "bg-emerald-500", text: "text-white", ring: "ring-emerald-200" };
  if (score >= 60) return { bg: "bg-gold-500", text: "text-white", ring: "ring-gold-200" };
  if (score >= 40) return { bg: "bg-amber-500", text: "text-white", ring: "ring-amber-200" };
  return { bg: "bg-gray-400", text: "text-white", ring: "ring-gray-200" };
}

export function JobBoardListItem({ job, matchScore }: JobBoardListItemProps) {
  const hasSalary = job.salary_min || job.salary_max;
  const startingSoon = job.start_date && isStartingSoon(job.start_date);
  const matchStyles = matchScore !== undefined ? getMatchScoreStyles(matchScore) : null;

  // Build vessel info string
  const vesselInfo = [
    job.vessel_type ? formatVesselType(job.vessel_type) : null,
    job.vessel_size_meters ? `${job.vessel_size_meters}m` : null,
  ].filter(Boolean).join(" · ");

  // Determine contract display
  const contractDisplay = job.rotation_schedule
    ? `${job.rotation_schedule} rotation`
    : job.contract_type
      ? formatContractType(job.contract_type)
      : null;

  // Build benefits string for rotational jobs
  const benefitsInfo = [
    job.holiday_days ? `${job.holiday_days}d leave` : null,
  ].filter(Boolean).join(" · ");

  return (
    <Link href={`/job-board/${job.id}`} className="group block">
      <article
        className={`
          relative bg-white border-b border-gray-100
          hover:bg-gray-50/50 transition-colors duration-150
          ${job.is_urgent ? "bg-red-50/20 hover:bg-red-50/40" : ""}
        `}
      >
        <div className="px-4 sm:px-6 py-4">
          <div className="flex items-start gap-4">
            {/* Match Score - Compact Circle */}
            {matchScore !== undefined && (
              <div className="hidden sm:flex flex-shrink-0">
                <div
                  className={`
                    flex items-center justify-center w-11 h-11 rounded-full
                    ${matchStyles?.bg} ${matchStyles?.ring} ring-2
                    shadow-sm
                  `}
                >
                  <span className={`text-xs font-bold ${matchStyles?.text}`}>
                    {matchScore}%
                  </span>
                </div>
              </div>
            )}

            {/* Main Content */}
            <div className="flex-1 min-w-0">
              {/* Row 1: Title + Salary + Arrow */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    {/* Urgent Badge */}
                    {job.is_urgent && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-bold bg-red-500 text-white">
                        <AlertTriangle className="h-3 w-3" />
                        URGENT
                      </span>
                    )}

                    {/* Title */}
                    <h3 className="text-base font-semibold text-navy-900 group-hover:text-gold-600 transition-colors truncate">
                      {job.title}
                    </h3>
                  </div>

                  {/* Row 2: Key Details as Text Pills */}
                  <div className="mt-1.5 flex flex-wrap items-center gap-x-1.5 gap-y-1">
                    {/* Position Category */}
                    {job.position_category && (
                      <span className="text-sm text-gray-600">
                        {formatPositionCategory(job.position_category)}
                      </span>
                    )}

                    {/* Separator */}
                    {job.position_category && job.primary_region && (
                      <span className="text-gray-300">·</span>
                    )}

                    {/* Location */}
                    {job.primary_region && (
                      <span className="text-sm text-gray-600">
                        {job.primary_region}
                      </span>
                    )}

                    {/* Separator */}
                    {(job.position_category || job.primary_region) && vesselInfo && (
                      <span className="text-gray-300">·</span>
                    )}

                    {/* Vessel Info */}
                    {vesselInfo && (
                      <span className="text-sm text-gray-600">
                        {vesselInfo}
                      </span>
                    )}
                  </div>

                  {/* Row 3: Tags/Badges for Contract, Rotation, Leave */}
                  <div className="mt-2 flex flex-wrap items-center gap-1.5">
                    {/* Contract Type / Rotation */}
                    {contractDisplay && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-navy-50 text-navy-700">
                        {contractDisplay}
                      </span>
                    )}

                    {/* Holiday/Leave */}
                    {benefitsInfo && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700">
                        {benefitsInfo}
                      </span>
                    )}

                    {/* Start Date */}
                    {job.start_date && (
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                        startingSoon
                          ? "bg-amber-50 text-amber-700"
                          : "bg-gray-100 text-gray-600"
                      }`}>
                        {startingSoon ? "Starts " : ""}{formatDateCompact(job.start_date)}
                      </span>
                    )}

                    {/* Agency - Subtle */}
                    {job.agency_name && (
                      <span className="text-xs text-gray-400">
                        via {job.agency_name}
                      </span>
                    )}
                  </div>
                </div>

                {/* Right Side: Salary + Meta */}
                <div className="hidden sm:flex flex-col items-end gap-1 flex-shrink-0">
                  {/* Salary - Most Prominent */}
                  <span className={`text-base font-semibold ${hasSalary ? "text-navy-900" : "text-gray-400"}`}>
                    {hasSalary
                      ? formatSalaryCompact(
                          job.salary_min,
                          job.salary_max,
                          job.salary_currency,
                          job.salary_period
                        )
                      : "TBD"}
                  </span>

                  {/* Posted Date */}
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-400">
                      {job.published_at ? formatPostedDate(job.published_at) : ""}
                    </span>
                    <ChevronRight className="h-4 w-4 text-gray-300 group-hover:text-gold-500 group-hover:translate-x-0.5 transition-all" />
                  </div>
                </div>
              </div>

              {/* Mobile: Salary + Match Score + Posted Date */}
              <div className="mt-2 flex items-center justify-between sm:hidden">
                <div className="flex items-center gap-2">
                  {matchScore !== undefined && (
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${matchStyles?.bg} ${matchStyles?.text}`}>
                      {matchScore}%
                    </span>
                  )}
                  <span className={`text-sm font-semibold ${hasSalary ? "text-navy-900" : "text-gray-400"}`}>
                    {hasSalary
                      ? formatSalaryCompact(
                          job.salary_min,
                          job.salary_max,
                          job.salary_currency,
                          job.salary_period
                        )
                      : "TBD"}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-400">
                  <span>{job.published_at ? formatPostedDate(job.published_at) : ""}</span>
                  <ChevronRight className="h-3.5 w-3.5" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Urgent/Soon Indicator Line */}
        {(job.is_urgent || startingSoon) && (
          <div
            className={`absolute left-0 top-0 bottom-0 w-1 ${
              job.is_urgent ? "bg-red-500" : "bg-amber-400"
            }`}
          />
        )}
      </article>
    </Link>
  );
}

// Skeleton loader for list items
export function JobBoardListItemSkeleton() {
  return (
    <div className="px-4 sm:px-6 py-4 border-b border-gray-100 animate-pulse">
      <div className="flex items-start gap-4">
        <div className="hidden sm:block w-12 h-12 rounded-xl bg-gray-100" />
        <div className="flex-1">
          <div className="h-5 w-48 bg-gray-200 rounded mb-2" />
          <div className="flex flex-wrap gap-3">
            <div className="h-4 w-24 bg-gray-100 rounded" />
            <div className="h-4 w-20 bg-gray-100 rounded" />
            <div className="h-4 w-28 bg-gray-100 rounded" />
            <div className="h-4 w-16 bg-gray-100 rounded" />
          </div>
          <div className="mt-2 h-4 w-full bg-gray-50 rounded" />
        </div>
      </div>
    </div>
  );
}
