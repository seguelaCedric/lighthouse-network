"use client";

import * as React from "react";
import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Plus,
  FileText,
  Clock,
  CheckCircle2,
  AlertCircle,
  Users,
  ChevronRight,
  Calendar,
  MapPin,
  Ship,
  Home,
  Loader2,
  Search,
  Filter,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface Brief {
  id: string;
  title: string;
  positions: string[];
  hiring_for: "yacht" | "household" | "both";
  vessel_name?: string;
  property_location?: string;
  status: "draft" | "submitted" | "reviewing" | "matching" | "shortlisted" | "closed";
  created_at: string;
  candidates_matched: number;
  timeline?: string;
}

// Status badge component
function StatusBadge({ status }: { status: Brief["status"] }) {
  const config = {
    draft: {
      label: "Draft",
      icon: FileText,
      className: "bg-gray-100 text-gray-700",
    },
    submitted: {
      label: "Submitted",
      icon: Clock,
      className: "bg-amber-100 text-amber-700",
    },
    reviewing: {
      label: "Under Review",
      icon: AlertCircle,
      className: "bg-blue-100 text-blue-700",
    },
    matching: {
      label: "Matching",
      icon: Users,
      className: "bg-purple-100 text-purple-700",
    },
    shortlisted: {
      label: "Candidates Ready",
      icon: CheckCircle2,
      className: "bg-success-100 text-success-700",
    },
    closed: {
      label: "Closed",
      icon: CheckCircle2,
      className: "bg-gray-100 text-gray-500",
    },
  };

  const { label, icon: Icon, className } = config[status];

  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium", className)}>
      <Icon className="size-3.5" />
      {label}
    </span>
  );
}

// Brief card component
function BriefCard({ brief }: { brief: Brief }) {
  return (
    <Link
      href={`/employer/portal/briefs/${brief.id}`}
      className="group block rounded-xl border border-gray-200 bg-white p-5 transition-all hover:border-gold-200 hover:shadow-md"
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="mb-2 flex items-center gap-2">
            <StatusBadge status={brief.status} />
            {brief.hiring_for === "yacht" ? (
              <Ship className="size-4 text-navy-400" />
            ) : brief.hiring_for === "household" ? (
              <Home className="size-4 text-navy-400" />
            ) : (
              <div className="flex items-center gap-1">
                <Ship className="size-4 text-navy-400" />
                <Home className="size-4 text-navy-400" />
              </div>
            )}
          </div>

          <h3 className="font-medium text-navy-900 group-hover:text-gold-600">
            {brief.title}
          </h3>

          <div className="mt-2 flex flex-wrap gap-1.5">
            {brief.positions.slice(0, 3).map((position) => (
              <span
                key={position}
                className="rounded-md bg-navy-50 px-2 py-0.5 text-xs text-navy-700"
              >
                {position}
              </span>
            ))}
            {brief.positions.length > 3 && (
              <span className="rounded-md bg-gray-100 px-2 py-0.5 text-xs text-gray-500">
                +{brief.positions.length - 3} more
              </span>
            )}
          </div>
        </div>

        <ChevronRight className="size-5 text-gray-400 group-hover:text-gold-600" />
      </div>

      <div className="mt-4 flex items-center gap-4 text-sm text-gray-500">
        {brief.vessel_name && (
          <span className="flex items-center gap-1">
            <Ship className="size-3.5" />
            {brief.vessel_name}
          </span>
        )}
        {brief.property_location && (
          <span className="flex items-center gap-1">
            <MapPin className="size-3.5" />
            {brief.property_location}
          </span>
        )}
        <span className="flex items-center gap-1">
          <Calendar className="size-3.5" />
          {new Date(brief.created_at).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
          })}
        </span>
        {brief.candidates_matched > 0 && (
          <span className="flex items-center gap-1 text-success-600">
            <Users className="size-3.5" />
            {brief.candidates_matched} matched
          </span>
        )}
      </div>
    </Link>
  );
}

// Empty state component
function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-200 bg-gray-50 px-6 py-16">
      <div className="flex size-16 items-center justify-center rounded-full bg-gold-100">
        <FileText className="size-8 text-gold-600" />
      </div>
      <h3 className="mt-4 font-serif text-lg font-medium text-navy-900">
        No Briefs Yet
      </h3>
      <p className="mt-2 max-w-sm text-center text-gray-500">
        Tell us what you're looking for and we'll match you with qualified candidates.
      </p>
      <Link href="/employer/portal/briefs/new">
        <Button variant="primary" className="mt-6">
          <Plus className="mr-2 size-4" />
          Submit Your First Brief
        </Button>
      </Link>
    </div>
  );
}

export default function EmployerBriefsPage() {
  const [briefs, setBriefs] = useState<Brief[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "active" | "closed">("all");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    async function fetchBriefs() {
      try {
        const response = await fetch("/api/employer/briefs");
        if (response.ok) {
          const data = await response.json();
          setBriefs(data.briefs || []);
        }
      } catch (error) {
        console.error("Error fetching briefs:", error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchBriefs();
  }, []);

  // Filter briefs
  const filteredBriefs = briefs.filter((brief) => {
    const matchesFilter =
      filter === "all" ||
      (filter === "active" && brief.status !== "closed") ||
      (filter === "closed" && brief.status === "closed");

    const matchesSearch =
      !searchQuery ||
      brief.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      brief.positions.some((p) => p.toLowerCase().includes(searchQuery.toLowerCase()));

    return matchesFilter && matchesSearch;
  });

  // Group briefs by status for active view
  const activeBriefs = filteredBriefs.filter((b) => b.status !== "closed");
  const closedBriefs = filteredBriefs.filter((b) => b.status === "closed");

  return (
    <div className="p-6 lg:p-8">
      {/* Header */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-serif text-2xl font-semibold text-navy-900">
            Hiring Briefs
          </h1>
          <p className="mt-1 text-gray-500">
            Manage your hiring requests and track candidate matches.
          </p>
        </div>
        <Link href="/employer/portal/briefs/new">
          <Button variant="primary">
            <Plus className="mr-2 size-4" />
            New Brief
          </Button>
        </Link>
      </div>

      {/* Filters */}
      {briefs.length > 0 && (
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search briefs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-10 w-full rounded-lg border border-gray-300 bg-white pl-10 pr-4 text-sm focus:border-gold-500 focus:outline-none focus:ring-2 focus:ring-gold-500/20"
            />
          </div>

          {/* Filter Tabs */}
          <div className="flex items-center gap-1 rounded-lg border border-gray-200 bg-gray-50 p-1">
            {(["all", "active", "closed"] as const).map((filterOption) => (
              <button
                key={filterOption}
                onClick={() => setFilter(filterOption)}
                className={cn(
                  "rounded-md px-4 py-1.5 text-sm font-medium transition-colors",
                  filter === filterOption
                    ? "bg-white text-navy-900 shadow-sm"
                    : "text-gray-500 hover:text-navy-900"
                )}
              >
                {filterOption === "all" ? "All" : filterOption === "active" ? "Active" : "Closed"}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Content */}
      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="size-8 animate-spin text-gold-600" />
        </div>
      ) : briefs.length === 0 ? (
        <EmptyState />
      ) : filteredBriefs.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Filter className="size-12 text-gray-300" />
          <h3 className="mt-4 font-medium text-navy-900">No Matching Briefs</h3>
          <p className="mt-1 text-gray-500">Try adjusting your search or filter.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Active Briefs */}
          {(filter === "all" || filter === "active") && activeBriefs.length > 0 && (
            <div>
              {filter === "all" && (
                <h2 className="mb-3 text-sm font-medium uppercase tracking-wider text-gray-500">
                  Active ({activeBriefs.length})
                </h2>
              )}
              <div className="grid gap-4">
                {activeBriefs.map((brief) => (
                  <BriefCard key={brief.id} brief={brief} />
                ))}
              </div>
            </div>
          )}

          {/* Closed Briefs */}
          {(filter === "all" || filter === "closed") && closedBriefs.length > 0 && (
            <div>
              {filter === "all" && (
                <h2 className="mb-3 text-sm font-medium uppercase tracking-wider text-gray-500">
                  Closed ({closedBriefs.length})
                </h2>
              )}
              <div className="grid gap-4">
                {closedBriefs.map((brief) => (
                  <BriefCard key={brief.id} brief={brief} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Help Card */}
      <div className="mt-8 rounded-xl border border-gray-200 bg-gradient-to-r from-navy-50 to-white p-6">
        <div className="flex items-start gap-4">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-navy-100">
            <AlertCircle className="size-5 text-navy-600" />
          </div>
          <div>
            <h3 className="font-medium text-navy-900">How It Works</h3>
            <ol className="mt-2 space-y-1 text-sm text-gray-600">
              <li><span className="font-medium text-navy-700">1.</span> Submit a brief describing your ideal candidate</li>
              <li><span className="font-medium text-navy-700">2.</span> Our team reviews and matches you with candidates</li>
              <li><span className="font-medium text-navy-700">3.</span> View your shortlist and provide feedback</li>
              <li><span className="font-medium text-navy-700">4.</span> Schedule interviews with your top picks</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
}
