"use client";

import { AlertTriangle, Eye, Trash2, ExternalLink } from "lucide-react";
import { ErrorSeverityBadge } from "./ErrorSeverityBadge";

export interface ErrorLog {
  id: string;
  message: string;
  stack_trace?: string;
  error_code?: string;
  severity: "debug" | "info" | "warning" | "error" | "critical";
  path: string;
  method: string;
  status_code?: number;
  request_id?: string;
  user_id?: string;
  auth_id?: string;
  organization_id?: string;
  metadata?: Record<string, unknown>;
  query_params?: Record<string, string>;
  environment?: string;
  fingerprint?: string;
  created_at: string;
}

interface ErrorLogsTableProps {
  logs: ErrorLog[];
  isLoading: boolean;
  onViewLog: (log: ErrorLog) => void;
  onDeleteLog?: (log: ErrorLog) => void;
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatTime(dateString: string): string {
  return new Date(dateString).toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

function truncateMessage(message: string, maxLength: number = 60): string {
  if (message.length <= maxLength) return message;
  return message.slice(0, maxLength) + "...";
}

function getMethodColor(method: string): string {
  switch (method) {
    case "GET":
      return "text-blue-600 bg-blue-50";
    case "POST":
      return "text-green-600 bg-green-50";
    case "PUT":
      return "text-gold-600 bg-gold-50";
    case "PATCH":
      return "text-purple-600 bg-purple-50";
    case "DELETE":
      return "text-error-600 bg-error-50";
    default:
      return "text-gray-600 bg-gray-50";
  }
}

export function ErrorLogsTable({
  logs,
  isLoading,
  onViewLog,
  onDeleteLog,
}: ErrorLogsTableProps) {
  if (isLoading) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white">
        <div className="p-8">
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-center gap-4 animate-pulse">
                <div className="h-6 w-20 rounded bg-gray-200" />
                <div className="h-4 w-16 rounded bg-gray-200" />
                <div className="h-4 w-48 rounded bg-gray-200" />
                <div className="h-4 w-64 rounded bg-gray-200" />
                <div className="h-4 w-24 rounded bg-gray-200" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (logs.length === 0) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white">
        <div className="p-8 text-center">
          <AlertTriangle className="mx-auto size-12 text-gray-300" />
          <h3 className="mt-4 font-medium text-navy-900">No error logs found</h3>
          <p className="mt-1 text-sm text-gray-500">
            Great news! No errors match your current filters.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
      {/* Table Header */}
      <div className="border-b border-gray-100 bg-gray-50 px-4 py-3">
        <div className="flex items-center gap-4 text-xs font-medium uppercase text-gray-500">
          <div className="w-20">Severity</div>
          <div className="w-16">Method</div>
          <div className="w-48">Path</div>
          <div className="flex-1 min-w-0">Message</div>
          <div className="w-16 hidden md:block">Status</div>
          <div className="w-32 hidden sm:block">Time</div>
          <div className="w-16" />
        </div>
      </div>

      {/* Table Body */}
      <div className="divide-y divide-gray-100">
        {logs.map((log) => (
          <div
            key={log.id}
            className="flex items-center gap-4 px-4 py-3 hover:bg-gray-50 cursor-pointer"
            onClick={() => onViewLog(log)}
          >
            {/* Severity */}
            <div className="w-20">
              <ErrorSeverityBadge severity={log.severity} />
            </div>

            {/* Method */}
            <div className="w-16">
              <span
                className={`inline-flex items-center rounded px-1.5 py-0.5 text-xs font-mono font-medium ${getMethodColor(
                  log.method
                )}`}
              >
                {log.method}
              </span>
            </div>

            {/* Path */}
            <div className="w-48">
              <code className="text-xs text-gray-700 truncate block">
                {log.path}
              </code>
            </div>

            {/* Message */}
            <div className="flex-1 min-w-0">
              <p className="text-sm text-gray-700 truncate">
                {truncateMessage(log.message)}
              </p>
              {log.error_code && (
                <p className="text-xs text-gray-400">{log.error_code}</p>
              )}
            </div>

            {/* Status Code */}
            <div className="w-16 hidden md:block">
              {log.status_code && (
                <span
                  className={`text-xs font-medium ${
                    log.status_code >= 500
                      ? "text-error-600"
                      : log.status_code >= 400
                      ? "text-gold-600"
                      : "text-gray-500"
                  }`}
                >
                  {log.status_code}
                </span>
              )}
            </div>

            {/* Date/Time */}
            <div className="w-32 hidden sm:block">
              <p className="text-xs text-gray-600">{formatDate(log.created_at)}</p>
              <p className="text-xs text-gray-400">{formatTime(log.created_at)}</p>
            </div>

            {/* Actions */}
            <div className="w-16 flex items-center justify-end gap-1">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onViewLog(log);
                }}
                className="rounded p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                title="View details"
              >
                <Eye className="size-4" />
              </button>
              {onDeleteLog && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteLog(log);
                  }}
                  className="rounded p-1.5 text-gray-400 hover:bg-error-50 hover:text-error-600"
                  title="Delete"
                >
                  <Trash2 className="size-4" />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
