"use client";

import * as React from "react";
import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Search,
  ChevronRight,
  Clock,
  Users,
  Plus,
  Filter,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface JobSearch {
  id: string;
  title: string;
  position_category: string;
  vessel_name: string;
  status: string;
  is_urgent: boolean;
  created_at: string;
  submission_stats: {
    total: number;
    shortlisted: number;
    interviewing: number;
    offered: number;
  };
}

function SearchStatusBadge({ status }: { status: string }) {
  const config: Record<string, { label: string; className: string }> = {
    draft: { label: "Draft", className: "bg-gray-100 text-gray-700" },
    open: { label: "Open", className: "bg-blue-100 text-blue-700" },
    shortlisting: { label: "Shortlisting", className: "bg-purple-100 text-purple-700" },
    interviewing: { label: "Interviewing", className: "bg-warning-100 text-warning-700" },
    offer: { label: "Offer Stage", className: "bg-orange-100 text-orange-700" },
    filled: { label: "Filled", className: "bg-success-100 text-success-700" },
    cancelled: { label: "Cancelled", className: "bg-gray-100 text-gray-500" },
    on_hold: { label: "On Hold", className: "bg-gray-100 text-gray-600" },
  };

  const { label, className } = config[status] || config.open;
  return (
    <span className={cn("rounded-full px-2.5 py-1 text-xs font-medium", className)}>
      {label}
    </span>
  );
}

function SearchCard({ job }: { job: JobSearch }) {
  const daysOpen = Math.floor(
    (Date.now() - new Date(job.created_at).getTime()) / (1000 * 60 * 60 * 24)
  );

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 transition-all hover:border-gray-300 hover:shadow-sm">
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-semibold text-navy-900">{job.title}</h3>
            {job.is_urgent && (
              <span className="rounded-full bg-error-100 px-2 py-0.5 text-xs font-bold text-error-600">
                URGENT
              </span>
            )}
          </div>
          <p className="mt-1 text-sm text-gray-500">{job.vessel_name}</p>
        </div>
        <SearchStatusBadge status={job.status} />
      </div>

      <div className="mt-4 grid grid-cols-4 gap-4 rounded-lg bg-gray-50 p-3">
        <div className="text-center">
          <p className="text-2xl font-bold text-navy-900">{job.submission_stats.total}</p>
          <p className="text-xs text-gray-500">In Pipeline</p>
        </div>
        <div className="text-center border-x border-gray-200">
          <p className="text-2xl font-bold text-gold-600">{job.submission_stats.shortlisted}</p>
          <p className="text-xs text-gray-500">Shortlisted</p>
        </div>
        <div className="text-center border-r border-gray-200">
          <p className="text-2xl font-bold text-purple-600">{job.submission_stats.interviewing}</p>
          <p className="text-xs text-gray-500">Interviewing</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-success-600">{job.submission_stats.offered}</p>
          <p className="text-xs text-gray-500">Offered</p>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between">
        <div className="flex items-center gap-1 text-xs text-gray-400">
          <Clock className="size-3" />
          Opened {daysOpen} days ago
        </div>
        <Link href={`/client/shortlist/${job.id}`}>
          <Button variant="primary" size="sm">
            View Candidates
            <ChevronRight className="ml-1 size-4" />
          </Button>
        </Link>
      </div>
    </div>
  );
}

export default function SearchesPage() {
  const [jobs, setJobs] = useState<JobSearch[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>("all");

  useEffect(() => {
    const fetchJobs = async () => {
      try {
        const response = await fetch("/api/client/jobs");
        if (!response.ok) {
          throw new Error("Failed to fetch jobs");
        }
        const result = await response.json();
        setJobs(result.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setLoading(false);
      }
    };

    fetchJobs();
  }, []);

  const filteredJobs = jobs.filter((job) => {
    if (filter === "all") return true;
    if (filter === "active") return ["open", "shortlisting", "interviewing", "offer"].includes(job.status);
    if (filter === "completed") return job.status === "filled";
    return true;
  });

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="size-8 animate-spin text-gold-500" />
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen">
      {/* Header */}
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto max-w-6xl px-6 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-serif font-semibold text-navy-800">My Searches</h1>
              <p className="mt-1 text-gray-500">Track all your crew searches in one place</p>
            </div>
            <Link href="/client/briefs/new">
              <Button variant="primary" leftIcon={<Plus className="size-4" />}>
                Submit New Brief
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-6">
        {/* Filters */}
        <div className="mb-6 flex items-center gap-2">
          <Filter className="size-4 text-gray-400" />
          <div className="flex gap-2">
            {[
              { value: "all", label: "All" },
              { value: "active", label: "Active" },
              { value: "completed", label: "Completed" },
            ].map((option) => (
              <button
                key={option.value}
                onClick={() => setFilter(option.value)}
                className={cn(
                  "rounded-full px-3 py-1.5 text-sm font-medium transition-colors",
                  filter === option.value
                    ? "bg-navy-900 text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                )}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        {/* Jobs List */}
        {error ? (
          <div className="rounded-xl border border-error-200 bg-error-50 p-6 text-center text-error-700">
            {error}
          </div>
        ) : filteredJobs.length > 0 ? (
          <div className="space-y-4">
            {filteredJobs.map((job) => (
              <SearchCard key={job.id} job={job} />
            ))}
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-gray-300 bg-white p-12 text-center">
            <Search className="mx-auto size-12 text-gray-300" />
            <h3 className="mt-4 text-lg font-medium text-navy-900">No searches found</h3>
            <p className="mt-2 text-gray-500">
              {filter !== "all"
                ? "No searches match your current filter"
                : "Submit a brief to start finding your perfect crew"}
            </p>
            <Link href="/client/briefs/new">
              <Button variant="primary" className="mt-4">
                <Plus className="mr-2 size-4" />
                Submit New Brief
              </Button>
            </Link>
          </div>
        )}
      </main>
    </div>
  );
}
