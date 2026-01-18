"use client";

import { X, Copy, Check, ExternalLink, User, Clock, Server } from "lucide-react";
import { useState } from "react";
import { ErrorSeverityBadge } from "./ErrorSeverityBadge";
import type { ErrorLog } from "./ErrorLogsTable";
import { Button } from "@/components/ui/button";

interface ErrorLogDetailPanelProps {
  log: ErrorLog | null;
  isOpen: boolean;
  onClose: () => void;
  similarErrors?: Array<{ id: string; created_at: string }>;
  user?: {
    id: string;
    name: string;
    email: string;
    role: string;
  } | null;
}

function formatDateTime(dateString: string): string {
  return new Date(dateString).toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

function CopyButton({ text, label }: { text: string; label: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      onClick={handleCopy}
      className="flex items-center gap-1 rounded px-2 py-1 text-xs text-gray-500 hover:bg-gray-100 hover:text-gray-700"
      title={`Copy ${label}`}
    >
      {copied ? (
        <>
          <Check className="size-3" />
          Copied
        </>
      ) : (
        <>
          <Copy className="size-3" />
          Copy
        </>
      )}
    </button>
  );
}

export function ErrorLogDetailPanel({
  log,
  isOpen,
  onClose,
  similarErrors,
  user,
}: ErrorLogDetailPanelProps) {
  if (!isOpen || !log) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/30"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="relative w-full max-w-2xl overflow-y-auto bg-white shadow-xl">
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-gray-200 bg-white px-6 py-4">
          <div className="flex items-center gap-3">
            <ErrorSeverityBadge severity={log.severity} />
            <span className="text-sm font-medium text-gray-500">
              {log.method} {log.path}
            </span>
          </div>
          <button
            onClick={onClose}
            className="rounded p-1 hover:bg-gray-100"
          >
            <X className="size-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="space-y-6 p-6">
          {/* Message */}
          <div>
            <div className="mb-2 flex items-center justify-between">
              <h3 className="text-sm font-medium text-gray-500">Error Message</h3>
              <CopyButton text={log.message} label="message" />
            </div>
            <p className="rounded-lg bg-error-50 p-4 text-sm text-error-700 font-mono">
              {log.message}
            </p>
          </div>

          {/* Quick Info */}
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            <div>
              <p className="text-xs text-gray-500">Status Code</p>
              <p className="font-medium text-navy-900">{log.status_code || "N/A"}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Environment</p>
              <p className="font-medium text-navy-900">{log.environment || "N/A"}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Request ID</p>
              <p className="font-mono text-xs text-gray-700 truncate">
                {log.request_id || "N/A"}
              </p>
            </div>
          </div>

          {/* Timestamp */}
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Clock className="size-4" />
            <span>{formatDateTime(log.created_at)}</span>
          </div>

          {/* User Info */}
          {(log.user_id || user) && (
            <div className="rounded-lg border border-gray-200 p-4">
              <div className="mb-2 flex items-center gap-2">
                <User className="size-4 text-gray-400" />
                <h3 className="text-sm font-medium text-gray-700">User Context</h3>
              </div>
              <div className="space-y-1 text-sm">
                {user && (
                  <>
                    <p>
                      <span className="text-gray-500">Name:</span>{" "}
                      <span className="text-navy-900">{user.name}</span>
                    </p>
                    <p>
                      <span className="text-gray-500">Email:</span>{" "}
                      <span className="text-navy-900">{user.email}</span>
                    </p>
                    <p>
                      <span className="text-gray-500">Role:</span>{" "}
                      <span className="text-navy-900">{user.role}</span>
                    </p>
                  </>
                )}
                <p className="font-mono text-xs">
                  <span className="text-gray-500">User ID:</span>{" "}
                  <span className="text-gray-700">{log.user_id || "N/A"}</span>
                </p>
                {log.auth_id && (
                  <p className="font-mono text-xs">
                    <span className="text-gray-500">Auth ID:</span>{" "}
                    <span className="text-gray-700">{log.auth_id}</span>
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Stack Trace */}
          {log.stack_trace && (
            <div>
              <div className="mb-2 flex items-center justify-between">
                <h3 className="text-sm font-medium text-gray-500">Stack Trace</h3>
                <CopyButton text={log.stack_trace} label="stack trace" />
              </div>
              <pre className="max-h-64 overflow-auto rounded-lg bg-gray-900 p-4 text-xs text-gray-100 font-mono">
                {log.stack_trace}
              </pre>
            </div>
          )}

          {/* Query Params */}
          {log.query_params && Object.keys(log.query_params).length > 0 && (
            <div>
              <h3 className="mb-2 text-sm font-medium text-gray-500">Query Parameters</h3>
              <div className="rounded-lg bg-gray-50 p-4">
                <pre className="text-xs text-gray-700 font-mono">
                  {JSON.stringify(log.query_params, null, 2)}
                </pre>
              </div>
            </div>
          )}

          {/* Metadata */}
          {log.metadata && Object.keys(log.metadata).length > 0 && (
            <div>
              <h3 className="mb-2 text-sm font-medium text-gray-500">Metadata</h3>
              <div className="rounded-lg bg-gray-50 p-4">
                <pre className="text-xs text-gray-700 font-mono overflow-auto max-h-48">
                  {JSON.stringify(log.metadata, null, 2)}
                </pre>
              </div>
            </div>
          )}

          {/* Similar Errors */}
          {similarErrors && similarErrors.length > 0 && (
            <div>
              <h3 className="mb-2 text-sm font-medium text-gray-500">
                Similar Errors ({similarErrors.length})
              </h3>
              <p className="mb-2 text-xs text-gray-400">
                Errors with the same fingerprint: {log.fingerprint}
              </p>
              <div className="space-y-1">
                {similarErrors.slice(0, 5).map((similar) => (
                  <div
                    key={similar.id}
                    className="flex items-center justify-between rounded bg-gray-50 px-3 py-2 text-xs"
                  >
                    <span className="font-mono text-gray-600">
                      {similar.id.slice(0, 8)}...
                    </span>
                    <span className="text-gray-400">
                      {formatDateTime(similar.created_at)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Fingerprint */}
          {log.fingerprint && (
            <div className="border-t border-gray-200 pt-4">
              <p className="text-xs text-gray-400">
                <span className="text-gray-500">Fingerprint:</span>{" "}
                <span className="font-mono">{log.fingerprint}</span>
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
