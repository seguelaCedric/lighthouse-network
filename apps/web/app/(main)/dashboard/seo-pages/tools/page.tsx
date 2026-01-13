"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  RefreshCw,
  Calendar,
  CheckCircle,
  AlertCircle,
  Loader2,
  FileText,
  Globe,
} from "lucide-react";
import { ContentLayout } from "@/components/dashboard/ContentLayout";

interface FreshnessStats {
  cornerstone: {
    total: number;
    stale_30_days: number;
    stale_60_days: number;
    fresh: number;
  };
  landing: {
    total: number;
    stale_30_days: number;
    stale_60_days: number;
    fresh: number;
  };
  checked_at: string;
}

interface RefreshResult {
  success: boolean;
  message: string;
  results: {
    cornerstone_updated: number;
    landing_updated: number;
  };
  refreshed_at: string;
}

export default function SeoToolsPage() {
  const [stats, setStats] = useState<FreshnessStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<RefreshResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch("/api/seo-pages/refresh-dates");
      if (!response.ok) {
        throw new Error("Failed to fetch freshness stats");
      }
      const data = await response.json();
      setStats(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load stats");
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async (type: "all" | "cornerstone" | "landing") => {
    try {
      setRefreshing(true);
      setError(null);
      const response = await fetch("/api/seo-pages/refresh-dates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, olderThanDays: 30 }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to refresh dates");
      }

      const result = await response.json();
      setLastRefresh(result);
      // Refresh stats after update
      await fetchStats();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to refresh");
    } finally {
      setRefreshing(false);
    }
  };

  if (loading) {
    return (
      <ContentLayout
        title="SEO Tools"
        description="Manage content freshness and SEO settings"
      >
        <div className="flex h-96 items-center justify-center">
          <div className="text-center">
            <Loader2 className="mx-auto h-8 w-8 animate-spin text-gold-600" />
            <p className="mt-4 text-gray-600">Loading SEO tools...</p>
          </div>
        </div>
      </ContentLayout>
    );
  }

  return (
    <ContentLayout
      title="SEO Tools"
      description="Manage content freshness and SEO settings"
    >
      <div className="space-y-6">
        {/* Error Alert */}
        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-4">
            <div className="flex items-center gap-3">
              <AlertCircle className="h-5 w-5 text-red-600" />
              <p className="text-sm font-medium text-red-800">{error}</p>
            </div>
          </div>
        )}

        {/* Success Alert */}
        {lastRefresh && (
          <div className="rounded-xl border border-green-200 bg-green-50 p-4">
            <div className="flex items-center gap-3">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-sm font-medium text-green-800">
                  {lastRefresh.message}
                </p>
                <p className="text-xs text-green-600 mt-1">
                  Refreshed at {new Date(lastRefresh.refreshed_at).toLocaleString()}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Content Freshness Card */}
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gold-100">
                <Calendar className="h-6 w-6 text-gold-600" />
              </div>
              <div>
                <h3 className="font-semibold text-navy-900">Content Freshness</h3>
                <p className="text-sm text-gray-600">
                  Update the "last reviewed" date on SEO pages for search engine freshness signals
                </p>
              </div>
            </div>
            <Button
              onClick={() => handleRefresh("all")}
              disabled={refreshing}
              className="flex items-center gap-2"
            >
              {refreshing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
              Refresh All Pages
            </Button>
          </div>

          {/* Stats Grid */}
          {stats && (
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              {/* Cornerstone Pages */}
              <div className="rounded-lg border border-gray-100 bg-gray-50 p-4">
                <div className="flex items-center gap-2 mb-3">
                  <FileText className="h-4 w-4 text-navy-600" />
                  <h4 className="font-medium text-navy-900">Cornerstone Pages</h4>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total pages</span>
                    <span className="font-medium">{stats.cornerstone.total}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-green-600">Fresh (under 30 days)</span>
                    <span className="font-medium text-green-600">{stats.cornerstone.fresh}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-amber-600">Stale (30+ days)</span>
                    <span className="font-medium text-amber-600">{stats.cornerstone.stale_30_days}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-red-600">Very stale (60+ days)</span>
                    <span className="font-medium text-red-600">{stats.cornerstone.stale_60_days}</span>
                  </div>
                </div>
                <Button
                  variant="secondary"
                  size="sm"
                  className="mt-4 w-full"
                  onClick={() => handleRefresh("cornerstone")}
                  disabled={refreshing}
                >
                  Refresh Cornerstone Pages
                </Button>
              </div>

              {/* Landing Pages */}
              <div className="rounded-lg border border-gray-100 bg-gray-50 p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Globe className="h-4 w-4 text-navy-600" />
                  <h4 className="font-medium text-navy-900">Landing Pages</h4>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total pages</span>
                    <span className="font-medium">{stats.landing.total}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-green-600">Fresh (under 30 days)</span>
                    <span className="font-medium text-green-600">{stats.landing.fresh}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-amber-600">Stale (30+ days)</span>
                    <span className="font-medium text-amber-600">{stats.landing.stale_30_days}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-red-600">Very stale (60+ days)</span>
                    <span className="font-medium text-red-600">{stats.landing.stale_60_days}</span>
                  </div>
                </div>
                <Button
                  variant="secondary"
                  size="sm"
                  className="mt-4 w-full"
                  onClick={() => handleRefresh("landing")}
                  disabled={refreshing}
                >
                  Refresh Landing Pages
                </Button>
              </div>
            </div>
          )}

          <p className="mt-4 text-xs text-gray-500">
            Tip: Run this monthly to signal content freshness to search engines. Pages older than 30 days will be updated.
          </p>
        </div>
      </div>
    </ContentLayout>
  );
}
