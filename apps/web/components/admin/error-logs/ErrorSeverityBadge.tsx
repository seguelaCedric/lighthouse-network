"use client";

import { cn } from "@/lib/utils";

type Severity = "debug" | "info" | "warning" | "error" | "critical";

interface ErrorSeverityBadgeProps {
  severity: Severity;
}

const severityConfig: Record<
  Severity,
  { label: string; className: string }
> = {
  critical: {
    label: "Critical",
    className: "bg-error-100 text-error-700 border-error-200",
  },
  error: {
    label: "Error",
    className: "bg-error-50 text-error-600 border-error-100",
  },
  warning: {
    label: "Warning",
    className: "bg-gold-100 text-gold-700 border-gold-200",
  },
  info: {
    label: "Info",
    className: "bg-blue-100 text-blue-700 border-blue-200",
  },
  debug: {
    label: "Debug",
    className: "bg-gray-100 text-gray-600 border-gray-200",
  },
};

export function ErrorSeverityBadge({ severity }: ErrorSeverityBadgeProps) {
  const config = severityConfig[severity] || severityConfig.error;

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium",
        config.className
      )}
    >
      {config.label}
    </span>
  );
}
