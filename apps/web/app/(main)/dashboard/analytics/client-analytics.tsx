"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  TrendingUp,
  TrendingDown,
  Users,
  Briefcase,
  DollarSign,
  Target,
  ArrowUpRight,
  Building2,
  Ship,
  User,
  Anchor,
  BarChart3,
  PieChart,
  UserCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { DateRangeSelector } from "@/components/ui/date-range-selector";
import {
  DateRangeValue,
  toDateRangeParams,
  formatDateRangeDisplay,
} from "@/lib/utils/date-range";

interface ClientStats {
  id: string;
  name: string;
  type: string;
  status: string;
  vessel_size: number | null;
  total_jobs: number;
  total_placements: number;
  total_revenue: number;
  last_placement_at: string | null;
  created_at: string;
}

interface MonthlyRevenue {
  month: string;
  revenue: number;
  placements: number;
}

interface TeamMemberStats {
  name: string;
  jobs_count: number;           // Jobs brought/created by this person
  placements_count: number;     // Filled jobs they brought
  placements_made: number;      // Actual placements they made (as placed_by)
  revenue: number;              // Revenue from placements they made
  conversion_rate: number;
}

interface AnalyticsData {
  totals: {
    total_clients: number;
    active_clients: number;
    total_jobs: number;
    total_placements: number;
    total_revenue: number;
    avg_conversion_rate: number;
    avg_placement_value: number;
  };
  top_clients_by_revenue: ClientStats[];
  top_clients_by_placements: ClientStats[];
  recent_placements: {
    id: string;
    candidate_name: string;
    job_title: string;
    client_name: string;
    total_fee: number;
    start_date: string;
    created_at: string;
  }[];
  monthly_revenue: MonthlyRevenue[];
  placement_trends: { month: string; placed: number; jobs_created: number }[];
  client_type_breakdown: {
    type: string;
    count: number;
    revenue: number;
    placements: number;
  }[];
  team_member_stats: TeamMemberStats[];
}

// Type icons
const typeIcons: Record<string, React.ReactNode> = {
  yacht: <Anchor className="size-4" />,
  management_co: <Building2 className="size-4" />,
  private_owner: <User className="size-4" />,
  charter_co: <Ship className="size-4" />,
};

const typeLabels: Record<string, string> = {
  yacht: "Yacht",
  management_co: "Management Co.",
  private_owner: "Private Owner",
  charter_co: "Charter Co.",
};

// Helper functions
function formatCurrency(amount: number, compact = false): string {
  if (compact) {
    if (amount >= 1000000) return `€${(amount / 1000000).toFixed(1)}M`;
    if (amount >= 1000) return `€${(amount / 1000).toFixed(0)}k`;
    return `€${amount.toFixed(0)}`;
  }
  return new Intl.NumberFormat("en-EU", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatDate(dateString: string | null): string {
  if (!dateString) return "N/A";
  return new Date(dateString).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatMonth(monthStr: string): string {
  const [year, month] = monthStr.split("-");
  const date = new Date(parseInt(year), parseInt(month) - 1);
  return date.toLocaleDateString("en-GB", { month: "short", year: "2-digit" });
}

// Stat Card Component
function StatCard({
  title,
  value,
  subtitle,
  icon,
  trend,
  trendLabel,
  color = "navy",
}: {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ReactNode;
  trend?: number;
  trendLabel?: string;
  color?: "navy" | "gold" | "success" | "purple";
}) {
  const colorClasses = {
    navy: "bg-navy-100 text-navy-600",
    gold: "bg-gold-100 text-gold-600",
    success: "bg-success-100 text-success-600",
    purple: "bg-purple-100 text-purple-600",
  };

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6">
      <div className="flex items-center justify-between">
        <div className={cn("flex size-10 items-center justify-center rounded-lg", colorClasses[color])}>
          {icon}
        </div>
        {trend !== undefined && (
          <div
            className={cn(
              "flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium",
              trend >= 0 ? "bg-success-100 text-success-700" : "bg-error-100 text-error-700"
            )}
          >
            {trend >= 0 ? <TrendingUp className="size-3" /> : <TrendingDown className="size-3" />}
            {Math.abs(trend).toFixed(1)}%
          </div>
        )}
      </div>
      <div className="mt-4">
        <p className="text-sm font-medium text-gray-500">{title}</p>
        <p className="mt-1 text-3xl font-bold text-navy-900">{value}</p>
        {subtitle && <p className="mt-1 text-sm text-gray-500">{subtitle}</p>}
        {trendLabel && <p className="mt-1 text-xs text-gray-400">{trendLabel}</p>}
      </div>
    </div>
  );
}

// Simple Bar Chart Component
function SimpleBarChart({
  data,
  maxValue,
}: {
  data: { label: string; value: number; secondary?: number }[];
  maxValue: number;
}) {
  return (
    <div className="space-y-3">
      {data.map((item, idx) => (
        <div key={idx} className="space-y-1">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">{item.label}</span>
            <span className="font-medium text-navy-900">{formatCurrency(item.value, true)}</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-gray-100">
            <div
              className="h-full rounded-full bg-gold-500 transition-all"
              style={{ width: `${(item.value / maxValue) * 100}%` }}
            />
          </div>
          {item.secondary !== undefined && (
            <p className="text-xs text-gray-400">{item.secondary} placements</p>
          )}
        </div>
      ))}
    </div>
  );
}

// Revenue Chart Component (Simplified)
function RevenueChart({ data }: { data: MonthlyRevenue[] }) {
  const maxRevenue = Math.max(...data.map((d) => d.revenue), 1);
  const maxPlacements = Math.max(...data.map((d) => d.placements), 1);

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-navy-900">Monthly Revenue</h3>
          <p className="text-sm text-gray-500">Last 12 months performance</p>
        </div>
        <div className="flex items-center gap-4 text-sm">
          <span className="flex items-center gap-2">
            <span className="size-3 rounded-full bg-gold-500" />
            Revenue
          </span>
          <span className="flex items-center gap-2">
            <span className="size-3 rounded-full bg-navy-400" />
            Placements
          </span>
        </div>
      </div>

      <div className="relative h-64">
        {/* Y-axis labels */}
        <div className="absolute left-0 top-0 flex h-full flex-col justify-between text-xs text-gray-400">
          <span>{formatCurrency(maxRevenue, true)}</span>
          <span>{formatCurrency(maxRevenue / 2, true)}</span>
          <span>€0</span>
        </div>

        {/* Chart area */}
        <div className="ml-12 flex h-full items-end justify-between gap-2">
          {data.map((item, idx) => (
            <div key={idx} className="group relative flex h-full flex-1 flex-col items-center justify-end">
              {/* Revenue bar */}
              <div
                className="w-full max-w-8 rounded-t bg-gold-500 transition-all group-hover:bg-gold-600"
                style={{ height: `${(item.revenue / maxRevenue) * 85}%`, minHeight: item.revenue > 0 ? "4px" : "0" }}
              />

              {/* Placements dot */}
              <div
                className="absolute w-2 h-2 rounded-full bg-navy-500 transition-all"
                style={{ bottom: `${(item.placements / maxPlacements) * 85}%` }}
              />

              {/* Label */}
              <span className="mt-2 text-xs text-gray-400">{formatMonth(item.month)}</span>

              {/* Tooltip */}
              <div className="absolute bottom-full mb-2 hidden rounded-lg bg-navy-900 px-3 py-2 text-xs text-white shadow-lg group-hover:block">
                <p className="font-semibold">{formatMonth(item.month)}</p>
                <p>Revenue: {formatCurrency(item.revenue)}</p>
                <p>Placements: {item.placements}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Client Type Breakdown Component
function ClientTypeBreakdown({
  data,
}: {
  data: { type: string; count: number; revenue: number; placements: number }[];
}) {
  const totalRevenue = data.reduce((sum, d) => sum + d.revenue, 0);
  const colors = ["bg-navy-500", "bg-gold-500", "bg-purple-500", "bg-success-500"];

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-navy-900">Revenue by Client Type</h3>
          <p className="text-sm text-gray-500">Breakdown of revenue sources</p>
        </div>
        <PieChart className="size-5 text-gray-400" />
      </div>

      {/* Progress bar representation */}
      <div className="mb-6 flex h-4 overflow-hidden rounded-full">
        {data.map((item, idx) => (
          <div
            key={item.type}
            className={cn("transition-all", colors[idx % colors.length])}
            style={{ width: `${(item.revenue / totalRevenue) * 100}%` }}
          />
        ))}
      </div>

      {/* Legend */}
      <div className="space-y-3">
        {data.map((item, idx) => (
          <div key={item.type} className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className={cn("size-3 rounded-full", colors[idx % colors.length])} />
              <div className="flex items-center gap-2">
                {typeIcons[item.type]}
                <span className="text-sm text-gray-700">{typeLabels[item.type] || item.type}</span>
              </div>
            </div>
            <div className="text-right">
              <p className="font-semibold text-navy-900">{formatCurrency(item.revenue, true)}</p>
              <p className="text-xs text-gray-400">
                {item.count} clients · {item.placements} placements
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Top Clients Table Component
function TopClientsTable({
  clients,
  title,
  subtitle,
  metric,
}: {
  clients: ClientStats[];
  title: string;
  subtitle: string;
  metric: "revenue" | "placements";
}) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-navy-900">{title}</h3>
          <p className="text-sm text-gray-500">{subtitle}</p>
        </div>
        <Link
          href="/clients"
          className="flex items-center gap-1 text-sm font-medium text-gold-600 hover:text-gold-700"
        >
          View all
          <ArrowUpRight className="size-4" />
        </Link>
      </div>

      <div className="space-y-3">
        {clients.slice(0, 5).map((client, idx) => (
          <Link
            key={client.id}
            href={`/clients/${client.id}`}
            className="flex items-center justify-between rounded-lg p-2 transition-colors hover:bg-gray-50"
          >
            <div className="flex items-center gap-3">
              <span className="flex size-8 items-center justify-center rounded-lg bg-gray-100 text-sm font-semibold text-gray-600">
                {idx + 1}
              </span>
              <div>
                <p className="font-medium text-navy-900">{client.name}</p>
                <p className="text-xs text-gray-500">
                  {client.total_jobs} jobs · {client.total_placements} placements
                </p>
              </div>
            </div>
            <div className="text-right">
              {metric === "revenue" ? (
                <p className="font-semibold text-gold-600">{formatCurrency(client.total_revenue, true)}</p>
              ) : (
                <p className="font-semibold text-navy-900">{client.total_placements}</p>
              )}
              <p className="text-xs text-gray-400">
                {client.total_jobs > 0
                  ? `${Math.round((client.total_placements / client.total_jobs) * 100)}% conversion`
                  : "No jobs"}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

// Recent Placements Component
function RecentPlacements({
  placements,
}: {
  placements: {
    id: string;
    candidate_name: string;
    job_title: string;
    client_name: string;
    total_fee: number;
    start_date: string;
    created_at: string;
  }[];
}) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6">
      <div className="mb-4">
        <h3 className="font-semibold text-navy-900">Recent Placements</h3>
        <p className="text-sm text-gray-500">Latest successful placements</p>
      </div>

      {placements.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <Users className="size-10 text-gray-300" />
          <p className="mt-2 text-sm text-gray-500">No placements yet</p>
        </div>
      ) : (
        <div className="space-y-3">
          {placements.map((p) => (
            <div
              key={p.id}
              className="flex items-center justify-between rounded-lg border border-gray-100 p-3"
            >
              <div>
                <p className="font-medium text-navy-900">{p.candidate_name}</p>
                <p className="text-sm text-gray-600">{p.job_title}</p>
                <p className="text-xs text-gray-400">{p.client_name}</p>
              </div>
              <div className="text-right">
                <p className="font-semibold text-gold-600">{formatCurrency(p.total_fee, true)}</p>
                <p className="text-xs text-gray-400">{formatDate(p.start_date || p.created_at)}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// Team Performance Component
function TeamPerformance({ members }: { members: TeamMemberStats[] }) {
  const maxJobs = Math.max(...members.map((m) => m.jobs_count), 1);
  const maxPlacements = Math.max(...members.map((m) => m.placements_made), 1);
  const maxRevenue = Math.max(...members.map((m) => m.revenue), 1);

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-navy-900">Team Performance</h3>
          <p className="text-sm text-gray-500">Jobs brought vs placements made by team member</p>
        </div>
        <UserCheck className="size-5 text-gray-400" />
      </div>

      {members.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <Users className="size-10 text-gray-300" />
          <p className="mt-2 text-sm text-gray-500">No team data available</p>
          <p className="text-xs text-gray-400">Run the backfill scripts to populate this data</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 text-left text-xs font-medium uppercase text-gray-500">
                <th className="pb-3 pr-4">#</th>
                <th className="pb-3 pr-4">Team Member</th>
                <th className="pb-3 pr-4 text-right">Jobs Brought</th>
                <th className="pb-3 pr-4 text-right">Placements Made</th>
                <th className="pb-3 pr-4 text-right">Revenue</th>
                <th className="pb-3 text-right">Conversion</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {members.slice(0, 15).map((member, idx) => (
                <tr key={member.name} className="hover:bg-gray-50">
                  <td className="py-3 pr-4">
                    <span className="flex size-6 items-center justify-center rounded-full bg-navy-100 text-xs font-semibold text-navy-600">
                      {idx + 1}
                    </span>
                  </td>
                  <td className="py-3 pr-4">
                    <span className="font-medium text-navy-900">{member.name}</span>
                  </td>
                  <td className="py-3 pr-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <div className="h-2 w-16 overflow-hidden rounded-full bg-gray-100">
                        <div
                          className="h-full rounded-full bg-navy-400"
                          style={{ width: `${(member.jobs_count / maxJobs) * 100}%` }}
                        />
                      </div>
                      <span className="w-10 text-sm font-semibold text-navy-900">{member.jobs_count}</span>
                    </div>
                  </td>
                  <td className="py-3 pr-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <div className="h-2 w-16 overflow-hidden rounded-full bg-gray-100">
                        <div
                          className="h-full rounded-full bg-gold-500"
                          style={{ width: maxPlacements > 0 ? `${(member.placements_made / maxPlacements) * 100}%` : '0%' }}
                        />
                      </div>
                      <span className="w-10 text-sm font-semibold text-gold-600">{member.placements_made}</span>
                    </div>
                  </td>
                  <td className="py-3 pr-4 text-right">
                    <span className="text-sm font-semibold text-success-600">
                      {member.revenue > 0 ? formatCurrency(member.revenue, true) : '—'}
                    </span>
                  </td>
                  <td className="py-3 text-right">
                    <span
                      className={cn(
                        "rounded-full px-2 py-0.5 text-xs font-medium",
                        member.conversion_rate >= 30
                          ? "bg-success-100 text-success-700"
                          : member.conversion_rate >= 15
                          ? "bg-gold-100 text-gold-700"
                          : "bg-gray-100 text-gray-600"
                      )}
                    >
                      {member.jobs_count > 0 ? `${member.conversion_rate.toFixed(0)}%` : '—'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Legend */}
          <div className="mt-4 flex gap-6 border-t border-gray-100 pt-4 text-xs text-gray-500">
            <span className="flex items-center gap-2">
              <span className="size-2 rounded-full bg-navy-400" />
              Jobs Brought: Enquiries brought by this person
            </span>
            <span className="flex items-center gap-2">
              <span className="size-2 rounded-full bg-gold-500" />
              Placements Made: Candidates placed by this person
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

// Main Dashboard Component
export function ClientAnalyticsDashboard({
  data,
  dateRange,
}: {
  data: AnalyticsData;
  dateRange: DateRangeValue;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleDateRangeChange = (newRange: DateRangeValue) => {
    const params = new URLSearchParams(searchParams.toString());

    // Clear existing date params
    params.delete("from");
    params.delete("to");
    params.delete("preset");

    // Set new params
    const newParams = toDateRangeParams(newRange);
    params.set("preset", newParams.preset);
    if (newParams.from) params.set("from", newParams.from);
    if (newParams.to) params.set("to", newParams.to);

    // Navigate and refresh data
    router.push(`/dashboard/analytics?${params.toString()}`);
    router.refresh();
  };

  const isFiltered = dateRange.preset !== "all_time";
  const periodLabel = isFiltered ? formatDateRangeDisplay(dateRange) : "All time";

  return (
    <main className="flex-1 overflow-y-auto">
      <div className="mx-auto max-w-7xl p-6">
        {/* Header */}
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="font-serif text-4xl font-semibold text-navy-800">Client Analytics</h1>
            <p className="mt-1 text-gray-600">
              Performance insights and revenue metrics
              {isFiltered && (
                <span className="ml-1 text-gold-600 font-medium">({periodLabel})</span>
              )}
            </p>
          </div>
          <DateRangeSelector value={dateRange} onChange={handleDateRangeChange} />
        </div>

        {/* Key Metrics */}
        <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Total Revenue"
            value={formatCurrency(data.totals.total_revenue)}
            subtitle={isFiltered ? `In ${periodLabel.toLowerCase()}` : "All-time placement fees"}
            icon={<DollarSign className="size-5" />}
            color="gold"
          />
          <StatCard
            title="Placements"
            value={data.totals.total_placements}
            subtitle={`From ${data.totals.total_jobs} jobs`}
            icon={<Users className="size-5" />}
            color="success"
          />
          <StatCard
            title="Conversion Rate"
            value={`${data.totals.avg_conversion_rate.toFixed(1)}%`}
            subtitle="Jobs to placements"
            icon={<Target className="size-5" />}
            color="purple"
          />
          <StatCard
            title="Avg. Placement Value"
            value={formatCurrency(data.totals.avg_placement_value)}
            subtitle="Average fee per placement"
            icon={<BarChart3 className="size-5" />}
            color="navy"
          />
        </div>

        {/* Secondary Metrics */}
        <div className="mb-8 grid gap-4 sm:grid-cols-3">
          <div className="flex items-center gap-4 rounded-xl border border-gray-200 bg-white p-4">
            <div className="flex size-12 items-center justify-center rounded-lg bg-navy-100">
              <Building2 className="size-6 text-navy-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-navy-900">{data.totals.total_clients}</p>
              <p className="text-sm text-gray-500">
                Total Clients ({data.totals.active_clients} active)
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4 rounded-xl border border-gray-200 bg-white p-4">
            <div className="flex size-12 items-center justify-center rounded-lg bg-gold-100">
              <Briefcase className="size-6 text-gold-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-navy-900">{data.totals.total_jobs}</p>
              <p className="text-sm text-gray-500">Total Jobs Created</p>
            </div>
          </div>
          <div className="flex items-center gap-4 rounded-xl border border-gray-200 bg-white p-4">
            <div className="flex size-12 items-center justify-center rounded-lg bg-success-100">
              <TrendingUp className="size-6 text-success-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-navy-900">
                {data.totals.total_placements > 0
                  ? formatCurrency(data.totals.total_revenue / data.totals.total_placements / 12)
                  : "€0"}
              </p>
              <p className="text-sm text-gray-500">Monthly Run Rate (avg)</p>
            </div>
          </div>
        </div>

        {/* Charts Row */}
        <div className="mb-8 grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <RevenueChart data={data.monthly_revenue} />
          </div>
          <ClientTypeBreakdown data={data.client_type_breakdown} />
        </div>

        {/* Top Clients and Recent Placements */}
        <div className="mb-8 grid gap-6 lg:grid-cols-3">
          <TopClientsTable
            clients={data.top_clients_by_revenue}
            title="Top Clients by Revenue"
            subtitle="Highest earning client relationships"
            metric="revenue"
          />
          <TopClientsTable
            clients={data.top_clients_by_placements}
            title="Top Clients by Placements"
            subtitle="Most successful placement count"
            metric="placements"
          />
          <RecentPlacements placements={data.recent_placements} />
        </div>

        {/* Team Performance */}
        <TeamPerformance members={data.team_member_stats} />
      </div>
    </main>
  );
}
