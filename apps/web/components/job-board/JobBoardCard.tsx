"use client";

import {
  MapPin,
  Calendar,
  Ship,
  DollarSign,
  Clock,
  Briefcase,
  AlertTriangle,
  ChevronRight,
  Palmtree,
  Ruler,
} from "lucide-react";
import Link from "next/link";
import { formatDescriptionPreview } from "@/lib/utils/format-description";

export interface PublicJob {
  id: string;
  title: string;
  description: string | null;
  position_category: string | null;
  vessel_type: string | null;
  vessel_size_meters: number | null;
  contract_type: string | null;
  start_date: string | null;
  end_date: string | null;
  rotation_schedule: string | null;
  primary_region: string | null;
  salary_min: number | null;
  salary_max: number | null;
  salary_currency: string | null;
  salary_period: string | null;
  benefits: string[] | null;
  requirements: string[] | null;
  holiday_days: number | null;
  is_urgent: boolean;
  apply_deadline: string | null;
  applications_count: number | null;
  views_count: number | null;
  created_at: string;
  published_at: string | null;
  agency_name: string | null;
}

interface JobBoardCardProps {
  job: PublicJob;
  matchScore?: number; // 0-100, only shown for authenticated users
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

// Format salary for display
function formatSalary(
  min: number | null,
  max: number | null,
  currency: string | null,
  period: string | null
): string {
  const currencySymbol = currency === "USD" ? "$" : currency === "GBP" ? "£" : "€";
  const periodLabel = period === "yearly" ? "/yr" : period === "daily" ? "/day" : "/mo";

  if (min && max) {
    if (min === max) {
      return `${currencySymbol}${min.toLocaleString("en-US")}${periodLabel}`;
    }
    return `${currencySymbol}${min.toLocaleString("en-US")} - ${currencySymbol}${max.toLocaleString("en-US")}${periodLabel}`;
  }
  if (min) {
    return `From ${currencySymbol}${min.toLocaleString("en-US")}${periodLabel}`;
  }
  if (max) {
    return `Up to ${currencySymbol}${max.toLocaleString("en-US")}${periodLabel}`;
  }
  return "Salary TBD";
}

// Format date for display
function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

// Check if date is soon (within 14 days)
function isStartingSoon(dateString: string): boolean {
  const date = new Date(dateString);
  const now = new Date();
  const diffDays = Math.ceil((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  return diffDays >= 0 && diffDays <= 14;
}

// Get match score color
function getMatchScoreColor(score: number): string {
  if (score >= 80) return "from-emerald-500 to-emerald-600";
  if (score >= 60) return "from-gold-500 to-gold-600";
  if (score >= 40) return "from-amber-500 to-amber-600";
  return "from-gray-400 to-gray-500";
}

export function JobBoardCard({ job, matchScore }: JobBoardCardProps) {
  const hasSalary = job.salary_min || job.salary_max;
  const startingSoon = job.start_date && isStartingSoon(job.start_date);

  return (
    <Link href={`/job-board/${job.id}`} className="group block">
      <article className="relative bg-white rounded-2xl border border-gray-100 shadow-lg overflow-hidden transition-all duration-300 hover:shadow-xl hover:border-gold-300 hover:-translate-y-1 ring-1 ring-black/5 hover:ring-gold-500/20">
        {/* Match Score Badge */}
        {matchScore !== undefined && (
          <div className="absolute top-4 right-4 z-10">
            <div
              className={`flex items-center gap-1.5 rounded-full bg-gradient-to-r ${getMatchScoreColor(matchScore)} px-3 py-1.5 text-xs font-bold text-white shadow-lg`}
            >
              <span>{matchScore}%</span>
              <span className="text-white/80">Match</span>
            </div>
          </div>
        )}

        {/* Urgent Badge */}
        {job.is_urgent && (
          <div className="absolute top-4 left-4 z-10">
            <div className="flex items-center gap-1 rounded-full bg-red-500 px-3 py-1.5 text-xs font-bold text-white shadow-lg animate-pulse">
              <AlertTriangle className="h-3 w-3" />
              URGENT
            </div>
          </div>
        )}

        {/* Header with gradient accent */}
        <div className="relative px-6 pt-6 pb-4">
          {/* Position Category Badge */}
          {job.position_category && (
            <div className="inline-flex items-center gap-1.5 rounded-full bg-gold-100 px-3 py-1 text-xs font-semibold text-gold-700 uppercase tracking-wide mb-3">
              <Briefcase className="h-3 w-3" />
              {formatPositionCategory(job.position_category)}
            </div>
          )}

          {/* Title */}
          <h3 className="text-xl font-semibold text-navy-900 group-hover:text-gold-600 transition-colors line-clamp-2 pr-16">
            {job.title}
          </h3>

          {/* Agency */}
          {job.agency_name && (
            <p className="text-sm text-gray-500 mt-1">
              Posted by {job.agency_name}
            </p>
          )}
        </div>

        {/* Details Grid */}
        <div className="px-6 pb-4 grid grid-cols-2 gap-3">
          {/* Location */}
          {job.primary_region && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <MapPin className="h-4 w-4 text-gold-500 flex-shrink-0" />
              <span className="truncate">{job.primary_region}</span>
            </div>
          )}

          {/* Salary */}
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <DollarSign className="h-4 w-4 text-gold-500 flex-shrink-0" />
            <span className={`truncate font-medium ${hasSalary ? "text-navy-800" : "text-gray-400"}`}>
              {hasSalary
                ? formatSalary(
                    job.salary_min,
                    job.salary_max,
                    job.salary_currency,
                    job.salary_period
                  )
                : "TBD"}
            </span>
          </div>

          {/* Vessel Type */}
          {job.vessel_type && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Ship className="h-4 w-4 text-gold-500 flex-shrink-0" />
              <span className="truncate">{formatVesselType(job.vessel_type)}</span>
              {job.vessel_size_meters && (
                <span className="text-gray-400">({job.vessel_size_meters}m)</span>
              )}
            </div>
          )}

          {/* Contract Type - Show "Rotational" if rotation_schedule exists */}
          {(job.contract_type || job.rotation_schedule) && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Clock className="h-4 w-4 text-gold-500 flex-shrink-0" />
              <span className="truncate">{job.rotation_schedule ? "Rotational" : formatContractType(job.contract_type!)}</span>
            </div>
          )}

          {/* Start Date */}
          {job.start_date && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Calendar className="h-4 w-4 text-gold-500 flex-shrink-0" />
              <span className={`truncate ${startingSoon ? "text-amber-600 font-medium" : ""}`}>
                {startingSoon ? "Starts " : ""}
                {formatDate(job.start_date)}
              </span>
            </div>
          )}

          {/* Holiday Days */}
          {job.holiday_days && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Palmtree className="h-4 w-4 text-gold-500 flex-shrink-0" />
              <span className="truncate">{job.holiday_days} days leave</span>
            </div>
          )}

          {/* Vessel Size (if no vessel type shown) */}
          {!job.vessel_type && job.vessel_size_meters && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Ruler className="h-4 w-4 text-gold-500 flex-shrink-0" />
              <span className="truncate">{job.vessel_size_meters}m vessel</span>
            </div>
          )}
        </div>

        {/* Description Preview */}
        {(() => {
          const preview = formatDescriptionPreview(job.description);
          return preview ? (
            <div className="px-6 pb-4">
              <p className="text-sm text-gray-600 line-clamp-2">{preview}</p>
            </div>
          ) : null;
        })()}

        {/* Footer */}
        <div className="px-6 py-4 bg-gray-50/50 border-t border-gray-100 flex items-center justify-between">
          {/* Rotation Schedule */}
          {job.rotation_schedule && (
            <span className="text-xs text-gray-500 bg-gray-100 rounded-full px-2.5 py-1">
              {job.rotation_schedule}
            </span>
          )}

          {/* Posted Date & View Button */}
          <div className="flex items-center gap-4 ml-auto">
            {job.published_at && (
              <span className="text-xs text-gray-400">
                Posted {formatDate(job.published_at)}
              </span>
            )}
            <span className="flex items-center gap-1 text-sm font-medium text-gold-600 group-hover:text-gold-700 transition-colors">
              View Details
              <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </span>
          </div>
        </div>

        {/* Starting Soon Banner */}
        {startingSoon && !job.is_urgent && (
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-400 to-amber-500" />
        )}

        {/* Urgent Banner */}
        {job.is_urgent && (
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-red-400 to-red-500" />
        )}
      </article>
    </Link>
  );
}

// Skeleton loader for job cards
export function JobBoardCardSkeleton() {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-lg overflow-hidden animate-pulse">
      <div className="px-6 pt-6 pb-4">
        <div className="h-5 w-24 bg-gray-200 rounded-full mb-3" />
        <div className="h-6 w-3/4 bg-gray-200 rounded mb-2" />
        <div className="h-4 w-1/3 bg-gray-100 rounded" />
      </div>
      <div className="px-6 pb-4 grid grid-cols-2 gap-3">
        <div className="h-4 w-full bg-gray-100 rounded" />
        <div className="h-4 w-full bg-gray-100 rounded" />
        <div className="h-4 w-full bg-gray-100 rounded" />
        <div className="h-4 w-full bg-gray-100 rounded" />
      </div>
      <div className="px-6 pb-4">
        <div className="h-4 w-full bg-gray-100 rounded mb-1" />
        <div className="h-4 w-2/3 bg-gray-100 rounded" />
      </div>
      <div className="px-6 py-4 bg-gray-50/50 border-t border-gray-100 flex justify-between">
        <div className="h-4 w-20 bg-gray-100 rounded" />
        <div className="h-4 w-24 bg-gray-100 rounded" />
      </div>
    </div>
  );
}
