"use client";

import {
  Activity,
  BarChart3,
  Users,
  TrendingUp,
  ArrowUpRight,
} from "lucide-react";

const kpis = [
  {
    label: "Active agencies",
    value: "42",
    change: "+8%",
    icon: Users,
    iconStyle: "bg-navy-50 text-navy-700",
  },
  {
    label: "Weekly placements",
    value: "18",
    change: "+12%",
    icon: TrendingUp,
    iconStyle: "bg-success-50 text-success-700",
  },
  {
    label: "Billing volume",
    value: "€84.2k",
    change: "+5%",
    icon: BarChart3,
    iconStyle: "bg-gold-50 text-gold-700",
  },
];

const highlights = [
  {
    title: "Top performing agencies",
    body: "Atlantic Crew leads placements with a 94% response rate.",
  },
  {
    title: "Time-to-hire",
    body: "Median time-to-hire dropped to 18 days this month.",
  },
  {
    title: "Pipeline health",
    body: "55% of active briefs have 3+ candidates in review.",
  },
];

export default function AdminAnalyticsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-navy-900">Analytics</h2>
        <p className="text-sm text-gray-500">
          Snapshot of agency activity and platform performance.
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {kpis.map((kpi) => {
          const Icon = kpi.icon;
          return (
            <div
              key={kpi.label}
              className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm"
            >
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <p className="text-sm text-gray-500">{kpi.label}</p>
                  <p className="text-2xl font-semibold text-navy-900">
                    {kpi.value}
                  </p>
                  <p className="inline-flex items-center gap-1 text-xs text-success-600">
                    <ArrowUpRight className="size-3" />
                    {kpi.change} vs last month
                  </p>
                </div>
                <div
                  className={`flex size-11 items-center justify-center rounded-xl ${kpi.iconStyle}`}
                >
                  <Icon className="size-5" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-xl bg-burgundy-50 text-burgundy-700">
              <Activity className="size-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-navy-900">
                Live activity feed
              </h3>
              <p className="text-sm text-gray-500">
                Recent platform signals from the last 24 hours.
              </p>
            </div>
          </div>
          <ul className="mt-4 space-y-3 text-sm text-gray-600">
            <li>12 new candidates added by agencies in the last 6 hours.</li>
            <li>4 briefs moved from review to interview stage.</li>
            <li>2 invoices marked as paid by agencies.</li>
          </ul>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <h3 className="text-base font-semibold text-navy-900">
            Key highlights
          </h3>
          <div className="mt-4 space-y-4">
            {highlights.map((item) => (
              <div
                key={item.title}
                className="rounded-lg border border-gray-100 bg-gray-50 p-4"
              >
                <p className="text-sm font-semibold text-navy-900">
                  {item.title}
                </p>
                <p className="text-xs text-gray-500">{item.body}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
