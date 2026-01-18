"use client";

import { useState, useEffect, useCallback } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  RefreshCw,
  Trash2,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
} from "lucide-react";
import {
  ErrorLogStats,
  SeverityBreakdown,
  TopErrorPaths,
  ErrorLogsTable,
  ErrorLogFilters,
  ErrorLogDetailPanel,
  type ErrorLog,
} from "@/components/admin/error-logs";

interface ErrorLogStatsData {
  total: number;
  by_severity: Record<string, number>;
  last_24h: number;
  last_7d: number;
  top_paths: Array<{ path: string; count: number }>;
}

interface ErrorLogDetail {
  log: ErrorLog;
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
  } | null;
  similar_errors: Array<{ id: string; created_at: string }>;
}

type Severity = "debug" | "info" | "warning" | "error" | "critical";
type Method = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

export default function AdminErrorLogsPage() {
  // Data state
  const [logs, setLogs] = useState<ErrorLog[]>([]);
  const [stats, setStats] = useState<ErrorLogStatsData | null>(null);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  // Filter state
  const [selectedSeverity, setSelectedSeverity] = useState<Severity | "">("");
  const [selectedMethod, setSelectedMethod] = useState<Method | "">("");
  const [searchQuery, setSearchQuery] = useState("");
  const [pathFilter, setPathFilter] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  // Pagination
  const [offset, setOffset] = useState(0);
  const limit = 50;

  // Detail panel state
  const [selectedLog, setSelectedLog] = useState<ErrorLog | null>(null);
  const [logDetail, setLogDetail] = useState<ErrorLogDetail | null>(null);
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);

  // Delete state
  const [isDeleting, setIsDeleting] = useState(false);

  // Fetch error logs
  const fetchLogs = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        limit: limit.toString(),
        offset: offset.toString(),
      });

      if (selectedSeverity) {
        params.set("severity", selectedSeverity);
      }
      if (selectedMethod) {
        params.set("method", selectedMethod);
      }
      if (searchQuery) {
        params.set("search", searchQuery);
      }
      if (pathFilter) {
        params.set("path", pathFilter);
      }
      if (dateFrom) {
        params.set("date_from", dateFrom);
      }
      if (dateTo) {
        params.set("date_to", dateTo);
      }

      const res = await fetch(`/api/admin/error-logs?${params}`);
      const data = await res.json();

      if (res.ok) {
        setLogs(data.logs || []);
        setTotal(data.total || 0);
        setStats(data.stats || null);
      } else {
        console.error("Error fetching error logs:", data.error);
      }
    } catch (error) {
      console.error("Error fetching error logs:", error);
    } finally {
      setIsLoading(false);
    }
  }, [offset, selectedSeverity, selectedMethod, searchQuery, pathFilter, dateFrom, dateTo]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  // Reset pagination when filters change
  useEffect(() => {
    setOffset(0);
  }, [selectedSeverity, selectedMethod, searchQuery, pathFilter, dateFrom, dateTo]);

  // Handle view log
  const handleViewLog = async (log: ErrorLog) => {
    setSelectedLog(log);
    setIsPanelOpen(true);
    setIsLoadingDetail(true);

    try {
      const res = await fetch(`/api/admin/error-logs/${log.id}`);
      const data = await res.json();

      if (res.ok) {
        setLogDetail(data);
      }
    } catch (error) {
      console.error("Error fetching log detail:", error);
    } finally {
      setIsLoadingDetail(false);
    }
  };

  // Handle delete log
  const handleDeleteLog = async (log: ErrorLog) => {
    if (!confirm("Are you sure you want to delete this error log?")) {
      return;
    }

    try {
      const res = await fetch(`/api/admin/error-logs/${log.id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        setLogs((prev) => prev.filter((l) => l.id !== log.id));
        setTotal((prev) => prev - 1);
        if (selectedLog?.id === log.id) {
          setIsPanelOpen(false);
          setSelectedLog(null);
        }
      } else {
        const data = await res.json();
        alert(data.error || "Failed to delete error log");
      }
    } catch (error) {
      console.error("Error deleting error log:", error);
      alert("Failed to delete error log");
    }
  };

  // Handle bulk delete old logs
  const handleBulkDelete = async () => {
    const days = prompt(
      "Delete error logs older than how many days?\n(Enter a number, e.g., 30)",
      "30"
    );

    if (!days) return;

    const daysNum = parseInt(days, 10);
    if (isNaN(daysNum) || daysNum < 1) {
      alert("Please enter a valid number of days (at least 1)");
      return;
    }

    if (
      !confirm(
        `Are you sure you want to delete all error logs older than ${daysNum} days? This cannot be undone.`
      )
    ) {
      return;
    }

    setIsDeleting(true);
    try {
      const res = await fetch(
        `/api/admin/error-logs?older_than_days=${daysNum}`,
        { method: "DELETE" }
      );
      const data = await res.json();

      if (res.ok) {
        alert(`Successfully deleted ${data.deleted_count} error logs.`);
        fetchLogs();
      } else {
        alert(data.error || "Failed to delete error logs");
      }
    } catch (error) {
      console.error("Error deleting error logs:", error);
      alert("Failed to delete error logs");
    } finally {
      setIsDeleting(false);
    }
  };

  // Handle clear filters
  const handleClearFilters = () => {
    setSelectedSeverity("");
    setSelectedMethod("");
    setSearchQuery("");
    setPathFilter("");
    setDateFrom("");
    setDateTo("");
  };

  // Pagination
  const currentPage = Math.floor(offset / limit) + 1;
  const totalPages = Math.ceil(total / limit);
  const hasPrevious = offset > 0;
  const hasNext = total > offset + logs.length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-navy-900">Error Logs</h1>
          <p className="mt-1 text-gray-500">
            Monitor and debug backend errors across all API routes
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            onClick={handleBulkDelete}
            disabled={isDeleting || isLoading}
          >
            <Trash2 className={cn("mr-2 size-4", isDeleting && "animate-pulse")} />
            Clean Up
          </Button>
          <Button variant="secondary" onClick={fetchLogs} disabled={isLoading}>
            <RefreshCw
              className={cn("mr-2 size-4", isLoading && "animate-spin")}
            />
            Refresh
          </Button>
        </div>
      </div>

      {/* Stats */}
      <ErrorLogStats stats={stats} isLoading={isLoading} />

      {/* Severity Breakdown & Top Paths */}
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-gray-200 bg-white p-4">
          <h3 className="mb-3 font-medium text-navy-900">Severity Breakdown</h3>
          <SeverityBreakdown stats={stats} />
        </div>
        <TopErrorPaths stats={stats} />
      </div>

      {/* Filters */}
      <div className="rounded-xl border border-gray-200 bg-white p-4">
        <ErrorLogFilters
          selectedSeverity={selectedSeverity}
          onSeverityChange={setSelectedSeverity}
          selectedMethod={selectedMethod}
          onMethodChange={setSelectedMethod}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          pathFilter={pathFilter}
          onPathFilterChange={setPathFilter}
          dateFrom={dateFrom}
          dateTo={dateTo}
          onDateFromChange={setDateFrom}
          onDateToChange={setDateTo}
          onClearFilters={handleClearFilters}
        />
      </div>

      {/* Table */}
      <ErrorLogsTable
        logs={logs}
        isLoading={isLoading}
        onViewLog={handleViewLog}
        onDeleteLog={handleDeleteLog}
      />

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between rounded-xl border border-gray-200 bg-white px-4 py-3">
          <p className="text-sm text-gray-500">
            Showing {offset + 1}-{Math.min(offset + logs.length, total)} of{" "}
            {total}
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setOffset(Math.max(0, offset - limit))}
              disabled={!hasPrevious}
            >
              <ChevronLeft className="size-4" />
              Previous
            </Button>
            <span className="px-2 text-sm text-gray-600">
              Page {currentPage} of {totalPages}
            </span>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setOffset(offset + limit)}
              disabled={!hasNext}
            >
              Next
              <ChevronRight className="size-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Detail Panel */}
      <ErrorLogDetailPanel
        log={selectedLog}
        isOpen={isPanelOpen}
        onClose={() => {
          setIsPanelOpen(false);
          setSelectedLog(null);
          setLogDetail(null);
        }}
        similarErrors={logDetail?.similar_errors}
        user={logDetail?.user}
      />
    </div>
  );
}
