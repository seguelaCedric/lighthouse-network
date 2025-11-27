"use client";

import * as React from "react";
import { useState, useEffect } from "react";
import Link from "next/link";
import {
  FileText,
  Plus,
  Search,
  Filter,
  ChevronDown,
  Mail,
  MessageSquare,
  Phone,
  User,
  Calendar,
  Eye,
  CheckCircle2,
  Clock,
  AlertCircle,
  XCircle,
  Loader2,
  ChevronLeft,
  ChevronRight,
  LayoutGrid,
  List as ListIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { Brief, BriefStatus, CommChannel } from "@lighthouse/database/types";

// Types
interface BriefWithDetails extends Brief {
  client?: {
    id: string;
    name: string;
  };
  assigned_user?: {
    id: string;
    name: string;
  };
}

interface PaginatedResponse {
  data: BriefWithDetails[];
  total: number;
  page: number;
  per_page: number;
  total_pages: number;
}

type ViewMode = "table" | "grid";

// Status configuration
const statusConfig: Record<BriefStatus, { label: string; color: string; icon: React.ReactNode }> = {
  new: {
    label: "New",
    color: "bg-blue-100 text-blue-700 border-blue-200",
    icon: <FileText className="size-4" />,
  },
  parsing: {
    label: "Parsing",
    color: "bg-purple-100 text-purple-700 border-purple-200",
    icon: <Loader2 className="size-4 animate-spin" />,
  },
  parsed: {
    label: "Parsed",
    color: "bg-success-100 text-success-700 border-success-200",
    icon: <CheckCircle2 className="size-4" />,
  },
  needs_clarification: {
    label: "Needs Clarification",
    color: "bg-warning-100 text-warning-700 border-warning-200",
    icon: <AlertCircle className="size-4" />,
  },
  converted: {
    label: "Converted",
    color: "bg-navy-100 text-navy-700 border-navy-200",
    icon: <CheckCircle2 className="size-4" />,
  },
  abandoned: {
    label: "Abandoned",
    color: "bg-gray-100 text-gray-700 border-gray-200",
    icon: <XCircle className="size-4" />,
  },
};

// Source icons
const sourceIcons: Record<CommChannel, React.ReactNode> = {
  email: <Mail className="size-4" />,
  whatsapp: <MessageSquare className="size-4" />,
  sms: <MessageSquare className="size-4" />,
  phone: <Phone className="size-4" />,
  platform: <User className="size-4" />,
  in_person: <User className="size-4" />,
};

// Helper functions
function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatTimeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (seconds < 60) return "Just now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
  return formatDate(dateString);
}

function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + "...";
}

// Components
function BriefCard({ brief }: { brief: BriefWithDetails }) {
  const status = statusConfig[brief.status];

  return (
    <Link
      href={`/briefs/${brief.id}`}
      className="block rounded-lg border border-gray-200 bg-white p-4 transition-all hover:border-gold-500 hover:shadow-md"
    >
      <div className="mb-3 flex items-start justify-between">
        <div className="flex items-center gap-2">
          {sourceIcons[brief.source]}
          <span className="text-xs text-gray-500 capitalize">{brief.source}</span>
        </div>
        <span
          className={cn(
            "flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium",
            status.color
          )}
        >
          {status.icon}
          {status.label}
        </span>
      </div>

      <div className="mb-3">
        <p className="mb-1 line-clamp-2 text-sm font-medium text-navy-900">
          {truncateText(brief.raw_content, 120)}
        </p>
        {brief.client && (
          <p className="text-xs text-gray-500">Client: {brief.client.name}</p>
        )}
      </div>

      <div className="flex items-center justify-between text-xs text-gray-500">
        <div className="flex items-center gap-1">
          <Calendar className="size-3" />
          {formatTimeAgo(brief.received_at)}
        </div>
        {brief.assigned_user && (
          <div className="flex items-center gap-1">
            <div className="flex size-5 items-center justify-center rounded-full bg-navy-100 text-[10px] font-medium text-navy-700">
              {brief.assigned_user.name.charAt(0)}
            </div>
            <span>{brief.assigned_user.name.split(" ")[0]}</span>
          </div>
        )}
      </div>
    </Link>
  );
}

function BriefTableRow({ brief }: { brief: BriefWithDetails }) {
  const status = statusConfig[brief.status];

  return (
    <Link
      href={`/briefs/${brief.id}`}
      className="flex items-center border-b border-gray-100 px-6 py-4 transition-colors hover:bg-gray-50"
    >
      <div className="flex flex-1 items-center gap-4">
        {/* Source */}
        <div className="flex w-24 items-center gap-2">
          {sourceIcons[brief.source]}
          <span className="text-sm capitalize text-gray-700">{brief.source}</span>
        </div>

        {/* Content Preview */}
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-navy-900">
            {truncateText(brief.raw_content, 100)}
          </p>
          {brief.client && (
            <p className="text-xs text-gray-500">Client: {brief.client.name}</p>
          )}
        </div>

        {/* Status */}
        <div className="w-40">
          <span
            className={cn(
              "inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-medium",
              status.color
            )}
          >
            {status.icon}
            {status.label}
          </span>
        </div>

        {/* Date */}
        <div className="w-32 text-sm text-gray-500">
          {formatTimeAgo(brief.received_at)}
        </div>

        {/* Assigned */}
        <div className="w-32">
          {brief.assigned_user && (
            <div className="flex items-center gap-2">
              <div className="flex size-6 items-center justify-center rounded-full bg-navy-100 text-xs font-medium text-navy-700">
                {brief.assigned_user.name.charAt(0)}
              </div>
              <span className="text-sm text-gray-700">
                {brief.assigned_user.name.split(" ")[0]}
              </span>
            </div>
          )}
        </div>

        {/* Action */}
        <div className="w-20">
          <Eye className="size-4 text-gray-400" />
        </div>
      </div>
    </Link>
  );
}

// Main Component
export default function BriefsPage() {
  const [briefs, setBriefs] = useState<BriefWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<BriefStatus | "all">("all");
  const [sourceFilter, setSourceFilter] = useState<CommChannel | "all">("all");
  const [viewMode, setViewMode] = useState<ViewMode>("table");

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const pageSize = 20;

  // Fetch briefs
  useEffect(() => {
    fetchBriefs();
  }, [currentPage, searchQuery, statusFilter, sourceFilter]);

  async function fetchBriefs() {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: pageSize.toString(),
      });

      if (searchQuery) params.set("search", searchQuery);
      if (statusFilter !== "all") params.set("status", statusFilter);
      if (sourceFilter !== "all") params.set("source", sourceFilter);

      const response = await fetch(`/api/briefs?${params}`);

      if (!response.ok) {
        throw new Error("Failed to fetch briefs");
      }

      const data: PaginatedResponse = await response.json();
      setBriefs(data.data);
      setTotalPages(data.total_pages);
      setTotal(data.total);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  const handleSearch = (value: string) => {
    setSearchQuery(value);
    setCurrentPage(1);
  };

  const handleStatusFilter = (status: BriefStatus | "all") => {
    setStatusFilter(status);
    setCurrentPage(1);
  };

  const handleSourceFilter = (source: CommChannel | "all") => {
    setSourceFilter(source);
    setCurrentPage(1);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto max-w-7xl px-6 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="font-serif text-3xl font-semibold text-navy-900">Briefs</h1>
              <p className="mt-1 text-sm text-gray-600">
                Manage incoming job briefs and requirements
              </p>
            </div>
            <Link href="/briefs/new">
              <Button variant="primary" leftIcon={<Plus className="size-4" />}>
                New Brief
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Filters */}
      <div className="border-b border-gray-200 bg-white">
        <div className="mx-auto max-w-7xl px-6 py-4">
          <div className="flex flex-wrap items-center gap-4">
            {/* Search */}
            <div className="relative flex-1 min-w-[300px]">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search briefs..."
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                className="h-10 w-full rounded-lg border border-gray-300 pl-10 pr-4 text-sm focus:border-gold-500 focus:outline-none focus:ring-2 focus:ring-gold-500/20"
              />
            </div>

            {/* Status Filter */}
            <div className="relative">
              <select
                value={statusFilter}
                onChange={(e) => handleStatusFilter(e.target.value as BriefStatus | "all")}
                className="h-10 appearance-none rounded-lg border border-gray-300 bg-white pl-3 pr-10 text-sm focus:border-gold-500 focus:outline-none focus:ring-2 focus:ring-gold-500/20"
              >
                <option value="all">All Statuses</option>
                {Object.entries(statusConfig).map(([key, config]) => (
                  <option key={key} value={key}>
                    {config.label}
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-gray-400" />
            </div>

            {/* Source Filter */}
            <div className="relative">
              <select
                value={sourceFilter}
                onChange={(e) => handleSourceFilter(e.target.value as CommChannel | "all")}
                className="h-10 appearance-none rounded-lg border border-gray-300 bg-white pl-3 pr-10 text-sm focus:border-gold-500 focus:outline-none focus:ring-2 focus:ring-gold-500/20"
              >
                <option value="all">All Sources</option>
                <option value="email">Email</option>
                <option value="whatsapp">WhatsApp</option>
                <option value="phone">Phone</option>
                <option value="platform">Platform</option>
              </select>
              <ChevronDown className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-gray-400" />
            </div>

            {/* View Toggle */}
            <div className="ml-auto flex gap-1 rounded-lg border border-gray-300 p-1">
              <button
                onClick={() => setViewMode("table")}
                className={cn(
                  "rounded p-1.5 transition-colors",
                  viewMode === "table"
                    ? "bg-gold-500 text-white"
                    : "text-gray-500 hover:bg-gray-100"
                )}
              >
                <ListIcon className="size-4" />
              </button>
              <button
                onClick={() => setViewMode("grid")}
                className={cn(
                  "rounded p-1.5 transition-colors",
                  viewMode === "grid"
                    ? "bg-gold-500 text-white"
                    : "text-gray-500 hover:bg-gray-100"
                )}
              >
                <LayoutGrid className="size-4" />
              </button>
            </div>
          </div>

          {/* Results count */}
          {!loading && (
            <p className="mt-3 text-sm text-gray-500">
              Showing {briefs.length} of {total} briefs
            </p>
          )}
        </div>
      </div>

      {/* Content */}
      <main className="mx-auto max-w-7xl px-6 py-6">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="size-8 animate-spin text-gray-400" />
          </div>
        ) : error ? (
          <div className="rounded-lg border border-error-200 bg-error-50 p-6 text-center">
            <AlertCircle className="mx-auto mb-2 size-8 text-error-600" />
            <p className="font-medium text-error-900">{error}</p>
          </div>
        ) : briefs.length === 0 ? (
          <div className="rounded-lg border border-dashed border-gray-300 bg-white p-12 text-center">
            <FileText className="mx-auto mb-4 size-12 text-gray-300" />
            <h3 className="mb-2 font-semibold text-navy-900">No briefs found</h3>
            <p className="mb-6 text-sm text-gray-600">
              {searchQuery || statusFilter !== "all" || sourceFilter !== "all"
                ? "Try adjusting your filters"
                : "Get started by creating your first brief"}
            </p>
            <Link href="/briefs/new">
              <Button variant="primary" leftIcon={<Plus className="size-4" />}>
                New Brief
              </Button>
            </Link>
          </div>
        ) : viewMode === "grid" ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {briefs.map((brief) => (
              <BriefCard key={brief.id} brief={brief} />
            ))}
          </div>
        ) : (
          <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
            {/* Table Header */}
            <div className="flex items-center border-b border-gray-200 bg-gray-50 px-6 py-3 text-xs font-medium text-gray-500">
              <div className="w-24">Source</div>
              <div className="flex-1">Content</div>
              <div className="w-40">Status</div>
              <div className="w-32">Received</div>
              <div className="w-32">Assigned</div>
              <div className="w-20"></div>
            </div>

            {/* Table Body */}
            <div>
              {briefs.map((brief) => (
                <BriefTableRow key={brief.id} brief={brief} />
              ))}
            </div>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-6 flex items-center justify-between">
            <p className="text-sm text-gray-600">
              Page {currentPage} of {totalPages}
            </p>
            <div className="flex gap-2">
              <Button
                variant="secondary"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                leftIcon={<ChevronLeft className="size-4" />}
              >
                Previous
              </Button>
              <Button
                variant="secondary"
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                rightIcon={<ChevronRight className="size-4" />}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
