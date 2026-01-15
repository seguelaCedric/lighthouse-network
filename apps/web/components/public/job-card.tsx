"use client";

import Link from "next/link";
import {
  MapPin,
  Calendar,
  DollarSign,
  Ship,
  Clock,
  Zap,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { formatSalaryRange } from "@/lib/utils/currency";

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
  is_urgent: boolean | null;
  apply_deadline: string | null;
  applications_count: number | null;
  views_count: number | null;
  created_at: string;
  published_at: string | null;
  agency_name: string | null;
}

interface JobCardProps {
  job: PublicJob;
  featured?: boolean;
}

export function JobCard({ job, featured = false }: JobCardProps) {
  const formatSalary = () => {
    if (!job.salary_min && !job.salary_max) return null;

    const result = formatSalaryRange(
      job.salary_min,
      job.salary_max,
      job.salary_currency || "EUR",
      job.salary_period || "monthly",
      { style: "compact", periodStyle: "short" }
    );

    return result === "Competitive" ? null : result;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30)
      return `${Math.floor(diffDays / 7)} week${diffDays >= 14 ? "s" : ""} ago`;
    return date.toLocaleDateString("en-GB", { month: "short", day: "numeric" });
  };

  const formatStartDate = () => {
    if (!job.start_date) return null;
    const date = new Date(job.start_date);
    const now = new Date();

    if (date <= now) return "ASAP";

    return date.toLocaleDateString("en-GB", {
      month: "short",
      day: "numeric",
      year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
    });
  };

  const salary = formatSalary();
  const startDate = formatStartDate();

  return (
    <Link href={`/jobs/${job.id}`}>
      <article
        className={cn(
          "group relative overflow-hidden rounded-xl border bg-white transition-all duration-300",
          "hover:shadow-lg hover:shadow-gold-500/10 hover:-translate-y-1",
          featured
            ? "border-gold-300 shadow-md shadow-gold-500/10"
            : "border-gray-200 hover:border-gold-300/50"
        )}
      >
        {/* Urgent Badge */}
        {job.is_urgent && (
          <div className="absolute right-3 top-3 z-10">
            <span className="inline-flex items-center gap-1 rounded-full bg-error-500 px-2.5 py-1 text-xs font-semibold text-white">
              <Zap className="size-3" />
              Urgent
            </span>
          </div>
        )}

        {/* Featured Indicator */}
        {featured && (
          <div className="absolute left-0 top-0 h-1 w-full bg-gold-gradient" />
        )}

        <div className="p-5">
          {/* Header */}
          <div className="mb-4">
            <div className="mb-1 flex items-center gap-2">
              {job.position_category && (
                <span className="text-xs font-medium uppercase tracking-wider text-gold-600">
                  {job.position_category.replace(/_/g, " ")}
                </span>
              )}
            </div>
            <h3 className="text-lg font-semibold text-navy-800 transition-colors group-hover:text-gold-600">
              {job.title}
            </h3>
            {job.agency_name && (
              <p className="mt-0.5 text-sm text-gray-500">
                via {job.agency_name}
              </p>
            )}
          </div>

          {/* Key Details */}
          <div className="mb-4 flex flex-wrap gap-3">
            {job.primary_region && (
              <div className="flex items-center gap-1.5 text-sm text-gray-600">
                <MapPin className="size-4 text-gray-400" />
                <span>{job.primary_region}</span>
              </div>
            )}

            {job.vessel_type && (
              <div className="flex items-center gap-1.5 text-sm text-gray-600">
                <Ship className="size-4 text-gray-400" />
                <span className="capitalize">
                  {job.vessel_type}
                  {job.vessel_size_meters && ` (${job.vessel_size_meters}m)`}
                </span>
              </div>
            )}

            {startDate && (
              <div className="flex items-center gap-1.5 text-sm text-gray-600">
                <Calendar className="size-4 text-gray-400" />
                <span>{startDate}</span>
              </div>
            )}
          </div>

          {/* Description Preview */}
          {job.description && (
            <p className="mb-4 line-clamp-2 text-sm leading-relaxed text-gray-600">
              {job.description}
            </p>
          )}

          {/* Contract & Salary */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {job.contract_type && (
                <span className="rounded-full bg-navy-50 px-2.5 py-1 text-xs font-medium capitalize text-navy-600">
                  {job.contract_type}
                </span>
              )}
              {job.rotation_schedule && (
                <span className="text-xs text-gray-500">
                  {job.rotation_schedule}
                </span>
              )}
            </div>

            {salary && (
              <div className="flex items-center gap-1 text-sm font-semibold text-navy-800">
                <DollarSign className="size-4 text-gold-500" />
                <span>{salary}</span>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="mt-4 flex items-center justify-between border-t border-gray-100 pt-4">
            <div className="flex items-center gap-1 text-xs text-gray-400">
              <Clock className="size-3.5" />
              <span>Posted {formatDate(job.created_at)}</span>
              {job.applications_count !== null && job.applications_count > 0 && (
                <>
                  <span className="mx-1">·</span>
                  <span>
                    {job.applications_count} application
                    {job.applications_count !== 1 ? "s" : ""}
                  </span>
                </>
              )}
              <span className="mx-1">·</span>
              <span className="font-mono">ID: {job.id.slice(0, 8).toUpperCase()}</span>
            </div>

            <span className="flex items-center gap-1 text-sm font-medium text-gold-600 opacity-0 transition-opacity group-hover:opacity-100">
              View Details
              <ChevronRight className="size-4" />
            </span>
          </div>
        </div>
      </article>
    </Link>
  );
}

// Skeleton loader for job cards
export function JobCardSkeleton() {
  return (
    <div className="animate-pulse overflow-hidden rounded-xl border border-gray-200 bg-white p-5">
      <div className="mb-4">
        <div className="mb-2 h-3 w-20 rounded bg-gray-200" />
        <div className="h-6 w-3/4 rounded bg-gray-200" />
        <div className="mt-1 h-4 w-1/3 rounded bg-gray-200" />
      </div>

      <div className="mb-4 flex gap-3">
        <div className="h-5 w-24 rounded bg-gray-200" />
        <div className="h-5 w-24 rounded bg-gray-200" />
        <div className="h-5 w-20 rounded bg-gray-200" />
      </div>

      <div className="mb-4 space-y-2">
        <div className="h-4 w-full rounded bg-gray-200" />
        <div className="h-4 w-4/5 rounded bg-gray-200" />
      </div>

      <div className="flex items-center justify-between">
        <div className="h-6 w-20 rounded-full bg-gray-200" />
        <div className="h-5 w-24 rounded bg-gray-200" />
      </div>

      <div className="mt-4 flex items-center justify-between border-t border-gray-100 pt-4">
        <div className="h-4 w-32 rounded bg-gray-200" />
        <div className="h-4 w-20 rounded bg-gray-200" />
      </div>
    </div>
  );
}
