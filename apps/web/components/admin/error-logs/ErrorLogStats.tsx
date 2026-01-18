"use client";

import {
  AlertTriangle,
  AlertCircle,
  XCircle,
  Clock,
  TrendingUp,
} from "lucide-react";

interface ErrorLogStats {
  total: number;
  by_severity: Record<string, number>;
  last_24h: number;
  last_7d: number;
  top_paths: Array<{ path: string; count: number }>;
}

interface ErrorLogStatsProps {
  stats: ErrorLogStats | null;
  isLoading?: boolean;
}

export function ErrorLogStats({ stats, isLoading }: ErrorLogStatsProps) {
  if (isLoading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="animate-pulse rounded-xl border border-gray-200 bg-white p-5"
          >
            <div className="flex items-center gap-3">
              <div className="size-10 rounded-lg bg-gray-200" />
              <div className="space-y-2">
                <div className="h-3 w-20 rounded bg-gray-200" />
                <div className="h-6 w-12 rounded bg-gray-200" />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  const criticalAndErrors =
    (stats?.by_severity?.critical || 0) + (stats?.by_severity?.error || 0);

  const statCards = [
    {
      label: "Total Errors",
      value: stats?.total || 0,
      icon: AlertTriangle,
      bg: "bg-navy-100",
      iconColor: "text-navy-600",
      helper: "All time",
    },
    {
      label: "Last 24 Hours",
      value: stats?.last_24h || 0,
      icon: Clock,
      bg: criticalAndErrors > 0 && stats?.last_24h && stats.last_24h > 10 ? "bg-error-100" : "bg-blue-100",
      iconColor:
        criticalAndErrors > 0 && stats?.last_24h && stats.last_24h > 10
          ? "text-error-600"
          : "text-blue-600",
      helper: "Recent activity",
    },
    {
      label: "Critical / Errors",
      value: criticalAndErrors,
      icon: XCircle,
      bg: criticalAndErrors > 0 ? "bg-error-100" : "bg-gray-100",
      iconColor: criticalAndErrors > 0 ? "text-error-600" : "text-gray-500",
      helper: "Needs attention",
    },
    {
      label: "Last 7 Days",
      value: stats?.last_7d || 0,
      icon: TrendingUp,
      bg: "bg-gold-100",
      iconColor: "text-gold-600",
      helper: "Weekly trend",
    },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {statCards.map((stat) => (
        <div
          key={stat.label}
          className="rounded-xl border border-gray-200 bg-white p-5"
        >
          <div className="flex items-center gap-3">
            <div
              className={`flex size-10 items-center justify-center rounded-lg ${stat.bg}`}
            >
              <stat.icon className={`size-5 ${stat.iconColor}`} />
            </div>
            <div>
              <p className="text-sm text-gray-500">{stat.label}</p>
              <p className="text-2xl font-bold text-navy-900">{stat.value}</p>
              <p className="text-xs text-gray-400">{stat.helper}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// Severity breakdown component
export function SeverityBreakdown({
  stats,
}: {
  stats: ErrorLogStats | null;
}) {
  if (!stats) return null;

  const severities = [
    {
      label: "Critical",
      value: stats.by_severity.critical || 0,
      color: "bg-error-500",
      textColor: "text-error-700",
    },
    {
      label: "Error",
      value: stats.by_severity.error || 0,
      color: "bg-error-400",
      textColor: "text-error-600",
    },
    {
      label: "Warning",
      value: stats.by_severity.warning || 0,
      color: "bg-gold-500",
      textColor: "text-gold-700",
    },
    {
      label: "Info",
      value: stats.by_severity.info || 0,
      color: "bg-blue-500",
      textColor: "text-blue-700",
    },
    {
      label: "Debug",
      value: stats.by_severity.debug || 0,
      color: "bg-gray-400",
      textColor: "text-gray-600",
    },
  ];

  return (
    <div className="flex flex-wrap gap-4">
      {severities.map((severity) => (
        <div
          key={severity.label}
          className="flex items-center gap-2 text-sm text-gray-600"
        >
          <span className={`size-3 rounded-full ${severity.color}`} />
          <span className={severity.textColor}>{severity.label}:</span>
          <span className="font-semibold">{severity.value}</span>
        </div>
      ))}
    </div>
  );
}

// Top error paths component
export function TopErrorPaths({
  stats,
}: {
  stats: ErrorLogStats | null;
}) {
  if (!stats || !stats.top_paths || stats.top_paths.length === 0) return null;

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4">
      <h3 className="mb-3 font-medium text-navy-900">Top Error Paths (7 days)</h3>
      <div className="space-y-2">
        {stats.top_paths.slice(0, 5).map((item, index) => (
          <div
            key={item.path}
            className="flex items-center justify-between text-sm"
          >
            <div className="flex items-center gap-2">
              <span className="text-gray-400">{index + 1}.</span>
              <code className="rounded bg-gray-100 px-2 py-0.5 text-xs text-gray-700">
                {item.path}
              </code>
            </div>
            <span className="font-medium text-error-600">{item.count}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
