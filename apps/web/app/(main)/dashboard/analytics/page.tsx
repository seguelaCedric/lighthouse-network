import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { ClientAnalyticsDashboard } from "./client-analytics";
import { parseDateRangeParams, DateRangeValue } from "@/lib/utils/date-range";

export const metadata = {
  title: "Client Analytics | Lighthouse Careers",
  description: "Client performance analytics and revenue insights",
};

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

interface PlacementTrend {
  month: string;
  placed: number;
  jobs_created: number;
}

interface TeamMemberStats {
  name: string;
  jobs_count: number;           // Jobs brought/created by this person
  placements_count: number;     // Placements made by this person (filled jobs they own)
  placements_made: number;      // Actual placements where they are the placed_by
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
  placement_trends: PlacementTrend[];
  client_type_breakdown: {
    type: string;
    count: number;
    revenue: number;
    placements: number;
  }[];
  team_member_stats: TeamMemberStats[];
}

async function getAnalyticsData(
  startDate: Date | null,
  endDate: Date | null
): Promise<AnalyticsData> {
  const supabase = await createClient();

  // Check authentication
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect("/login");
  }

  // Get user's organization
  const { data: userData } = await supabase
    .from("users")
    .select("id, organization_id, user_type")
    .eq("auth_id", user.id)
    .single();

  if (userData?.user_type === "candidate") {
    redirect("/crew/dashboard?redirected=agency_access");
  }

  const agencyId = userData?.organization_id;

  // Date filter helpers
  const startDateStr = startDate?.toISOString().split("T")[0];
  const endDateStr = endDate?.toISOString().split("T")[0];
  const hasDateFilter = startDate || endDate;


  // Build filtered queries - filter by created_at (when business activity happened)
  const buildPlacementsQuery = () => {
    let query = supabase
      .from("placements")
      .select("id, total_fee, start_date, created_at, job_id");
    if (startDate) query = query.gte("created_at", startDate.toISOString());
    if (endDate) query = query.lte("created_at", endDate.toISOString());
    return query;
  };

  const buildRecentPlacementsQuery = () => {
    let query = supabase
      .from("placements")
      .select(`
        id,
        total_fee,
        start_date,
        created_at,
        candidate:candidates (
          first_name,
          last_name
        ),
        job:jobs (
          title,
          client_id
        ),
        client:clients (
          name
        )
      `);
    if (startDate) query = query.gte("created_at", startDate.toISOString());
    if (endDate) query = query.lte("created_at", endDate.toISOString());
    return query.order("created_at", { ascending: false }).limit(10);
  };

  const buildJobsQuery = () => {
    let query = supabase
      .from("jobs")
      .select("id, job_owner_name, status, client_id, created_at")
      .not("job_owner_name", "is", null);
    if (startDate) query = query.gte("created_at", startDate.toISOString());
    if (endDate) query = query.lte("created_at", endDate.toISOString());
    return query;
  };

  const buildPlacementsByPlacedByQuery = () => {
    let query = supabase
      .from("placements")
      .select("id, placed_by_name, total_fee, created_at")
      .not("placed_by_name", "is", null);
    if (startDate) query = query.gte("created_at", startDate.toISOString());
    if (endDate) query = query.lte("created_at", endDate.toISOString());
    return query;
  };

  // Run queries in parallel
  const [
    clientsResult,
    placementsResult,
    recentPlacementsResult,
    monthlyRevenueResult,
    placementTrendsResult,
    jobsByOwnerResult,
    placementsByPlacedByResult,
    // Additional query for client stats calculation when filtering
    placementsWithClientResult,
  ] = await Promise.all([
    // Get all clients (base info)
    supabase
      .from("clients")
      .select("id, name, type, status, vessel_size, total_jobs, total_placements, total_revenue, last_placement_at, created_at")
      .order("total_revenue", { ascending: false }),

    // Get placements with date filter
    buildPlacementsQuery(),

    // Get recent placements with details
    buildRecentPlacementsQuery(),

    // Get monthly revenue for the last 12 months (ignore for now, will calculate manually)
    supabase.rpc("get_monthly_placement_revenue"),

    // Get placement trends
    supabase.rpc("get_monthly_placement_trends"),

    // Get jobs with owner info for team member stats
    buildJobsQuery(),

    // Get placements by placed_by for team member stats
    buildPlacementsByPlacedByQuery(),

    // Get placements with client_id for recalculating client stats
    hasDateFilter
      ? (() => {
          let query = supabase
            .from("placements")
            .select("id, total_fee, created_at, job:jobs(client_id)");
          if (startDate) query = query.gte("created_at", startDate.toISOString());
          if (endDate) query = query.lte("created_at", endDate.toISOString());
          return query;
        })()
      : Promise.resolve({ data: null }),
  ]);

  const clients = (clientsResult.data || []) as ClientStats[];
  const placements = placementsResult.data || [];
  const recentPlacements = recentPlacementsResult.data || [];
  const jobsData = jobsByOwnerResult.data || [];

  // When date filtering, recalculate client stats from filtered placements
  let clientStatsMap = new Map<string, { placements: number; revenue: number; jobs: number }>();

  if (hasDateFilter) {
    const placementsWithClient = placementsWithClientResult.data || [];

    // Calculate placements and revenue per client from filtered data
    for (const p of placementsWithClient as any[]) {
      const clientId = p.job?.client_id;
      if (!clientId) continue;

      const existing = clientStatsMap.get(clientId) || { placements: 0, revenue: 0, jobs: 0 };
      clientStatsMap.set(clientId, {
        ...existing,
        placements: existing.placements + 1,
        revenue: existing.revenue + (parseFloat(p.total_fee) || 0),
      });
    }

    // Count jobs per client from filtered jobs
    for (const job of jobsData as any[]) {
      const clientId = job.client_id;
      if (!clientId) continue;

      const existing = clientStatsMap.get(clientId) || { placements: 0, revenue: 0, jobs: 0 };
      clientStatsMap.set(clientId, {
        ...existing,
        jobs: existing.jobs + 1,
      });
    }
  }

  // Calculate totals - use filtered stats when date filtering, otherwise use denormalized
  let totalClients: number;
  let activeClients: number;
  let totalJobs: number;
  let totalPlacements: number;
  let totalRevenue: number;

  if (hasDateFilter) {
    // Count only clients with activity in the date range
    const clientsWithActivity = new Set<string>();
    for (const [clientId, stats] of clientStatsMap.entries()) {
      if (stats.jobs > 0 || stats.placements > 0) {
        clientsWithActivity.add(clientId);
      }
    }
    totalClients = clientsWithActivity.size;
    // Count active clients among those with activity
    activeClients = clients.filter(
      (c) => c.status === "active" && clientsWithActivity.has(c.id)
    ).length;
    totalJobs = jobsData.length;
    totalPlacements = placements.length;
    totalRevenue = placements.reduce((sum, p: any) => sum + (parseFloat(p.total_fee) || 0), 0);
  } else {
    totalClients = clients.length;
    activeClients = clients.filter((c) => c.status === "active").length;
    totalJobs = clients.reduce((sum, c) => sum + (c.total_jobs || 0), 0);
    totalPlacements = clients.reduce((sum, c) => sum + (c.total_placements || 0), 0);
    totalRevenue = clients.reduce((sum, c) => sum + (c.total_revenue || 0), 0);
  }

  const avgConversionRate = totalJobs > 0 ? (totalPlacements / totalJobs) * 100 : 0;
  const avgPlacementValue = totalPlacements > 0 ? totalRevenue / totalPlacements : 0;

  // Create client list with potentially filtered stats
  const clientsWithFilteredStats = hasDateFilter
    ? clients.map((c) => {
        const filteredStats = clientStatsMap.get(c.id);
        return {
          ...c,
          total_jobs: filteredStats?.jobs || 0,
          total_placements: filteredStats?.placements || 0,
          total_revenue: filteredStats?.revenue || 0,
        };
      })
    : clients;

  // Top clients by revenue (top 10)
  const topClientsByRevenue = [...clientsWithFilteredStats]
    .sort((a, b) => (b.total_revenue || 0) - (a.total_revenue || 0))
    .filter((c) => c.total_revenue > 0)
    .slice(0, 10);

  // Top clients by placements (top 10)
  const topClientsByPlacements = [...clientsWithFilteredStats]
    .sort((a, b) => (b.total_placements || 0) - (a.total_placements || 0))
    .filter((c) => c.total_placements > 0)
    .slice(0, 10);

  // Process recent placements
  const processedRecentPlacements = recentPlacements.map((p: any) => ({
    id: p.id,
    candidate_name: p.candidate
      ? `${p.candidate.first_name || ""} ${p.candidate.last_name || ""}`.trim()
      : "Unknown",
    job_title: p.job?.title || "Unknown",
    client_name: p.client?.name || "Unknown",
    total_fee: parseFloat(p.total_fee) || 0,
    start_date: p.start_date,
    created_at: p.created_at,
  }));

  // Client type breakdown - use filtered stats when filtering
  const typeBreakdown = new Map<string, { count: number; revenue: number; placements: number }>();
  for (const client of clientsWithFilteredStats) {
    // Only count clients that have activity in the filtered period
    if (hasDateFilter && client.total_revenue === 0 && client.total_placements === 0) {
      continue;
    }
    const existing = typeBreakdown.get(client.type) || { count: 0, revenue: 0, placements: 0 };
    typeBreakdown.set(client.type, {
      count: existing.count + 1,
      revenue: existing.revenue + (client.total_revenue || 0),
      placements: existing.placements + (client.total_placements || 0),
    });
  }

  const clientTypeBreakdown = Array.from(typeBreakdown.entries()).map(([type, data]) => ({
    type,
    ...data,
  }));

  // Generate monthly data - always calculate from filtered placements when filtering
  let monthlyRevenue: MonthlyRevenue[] = [];
  let placementTrends: PlacementTrend[] = [];

  // Always generate from filtered placements data for consistency (use created_at)
  const monthlyMap = new Map<string, { revenue: number; placements: number }>();
  for (const p of placements as any[]) {
    const date = new Date(p.created_at);
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
    const existing = monthlyMap.get(monthKey) || { revenue: 0, placements: 0 };
    monthlyMap.set(monthKey, {
      revenue: existing.revenue + (parseFloat(p.total_fee) || 0),
      placements: existing.placements + 1,
    });
  }

  if (hasDateFilter && startDate && endDate) {
    // Show months within the filtered range
    const rangeStart = new Date(startDate.getFullYear(), startDate.getMonth(), 1);
    const rangeEnd = new Date(endDate.getFullYear(), endDate.getMonth(), 1);

    let current = new Date(rangeStart);
    while (current <= rangeEnd) {
      const monthKey = `${current.getFullYear()}-${String(current.getMonth() + 1).padStart(2, "0")}`;
      const data = monthlyMap.get(monthKey) || { revenue: 0, placements: 0 };
      monthlyRevenue.push({
        month: monthKey,
        revenue: data.revenue,
        placements: data.placements,
      });
      current = new Date(current.getFullYear(), current.getMonth() + 1, 1);
    }
  } else {
    // Get last 12 months (default view)
    const now = new Date();
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      const data = monthlyMap.get(monthKey) || { revenue: 0, placements: 0 };
      monthlyRevenue.push({
        month: monthKey,
        revenue: data.revenue,
        placements: data.placements,
      });
    }
  }

  if (placementTrendsResult.data) {
    placementTrends = placementTrendsResult.data;
  } else {
    // Use monthly revenue data for trends
    placementTrends = monthlyRevenue.map((m) => ({
      month: m.month,
      placed: m.placements,
      jobs_created: 0, // Would need separate query
    }));
  }

  // Calculate team member stats from jobs (who brought the job)
  const jobsByOwner = jobsByOwnerResult.data || [];
  const placementsByPlacedBy = placementsByPlacedByResult.data || [];

  // Map: name -> { jobs brought, filled jobs (they own), placements made, revenue }
  const teamMemberMap = new Map<string, {
    jobs: number;
    filled: number;
    placementsMade: number;
    revenue: number;
  }>();

  // Count jobs by owner (who brought the job)
  for (const job of jobsByOwner) {
    const ownerName = job.job_owner_name;
    if (!ownerName) continue;

    const existing = teamMemberMap.get(ownerName) || { jobs: 0, filled: 0, placementsMade: 0, revenue: 0 };
    teamMemberMap.set(ownerName, {
      ...existing,
      jobs: existing.jobs + 1,
      filled: existing.filled + (job.status === "filled" ? 1 : 0),
    });
  }

  // Count placements by placed_by (who actually made the placement)
  for (const placement of placementsByPlacedBy) {
    const placedByName = placement.placed_by_name;
    if (!placedByName) continue;

    const existing = teamMemberMap.get(placedByName) || { jobs: 0, filled: 0, placementsMade: 0, revenue: 0 };
    teamMemberMap.set(placedByName, {
      ...existing,
      placementsMade: existing.placementsMade + 1,
      revenue: existing.revenue + (parseFloat(placement.total_fee) || 0),
    });
  }

  // Build final stats array
  const teamMemberStats: TeamMemberStats[] = Array.from(teamMemberMap.entries())
    .map(([name, data]) => ({
      name,
      jobs_count: data.jobs,
      placements_count: data.filled,      // Filled jobs they brought
      placements_made: data.placementsMade, // Placements they actually made
      revenue: data.revenue,
      conversion_rate: data.jobs > 0 ? (data.filled / data.jobs) * 100 : 0,
    }))
    .sort((a, b) => b.jobs_count - a.jobs_count);

  return {
    totals: {
      total_clients: totalClients,
      active_clients: activeClients,
      total_jobs: totalJobs,
      total_placements: totalPlacements,
      total_revenue: totalRevenue,
      avg_conversion_rate: avgConversionRate,
      avg_placement_value: avgPlacementValue,
    },
    top_clients_by_revenue: topClientsByRevenue,
    top_clients_by_placements: topClientsByPlacements,
    recent_placements: processedRecentPlacements,
    monthly_revenue: monthlyRevenue,
    placement_trends: placementTrends,
    client_type_breakdown: clientTypeBreakdown,
    team_member_stats: teamMemberStats,
  };
}

function AnalyticsSkeleton() {
  return (
    <div className="mx-auto max-w-7xl p-6">
      <div className="mb-8">
        <div className="h-10 w-64 animate-pulse rounded-lg bg-gray-200" />
        <div className="mt-2 h-5 w-96 animate-pulse rounded-lg bg-gray-100" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-32 animate-pulse rounded-xl bg-gray-200" />
        ))}
      </div>
      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <div className="h-80 animate-pulse rounded-xl bg-gray-200" />
        <div className="h-80 animate-pulse rounded-xl bg-gray-200" />
      </div>
    </div>
  );
}

interface PageProps {
  searchParams: Promise<{ from?: string; to?: string; preset?: string }>;
}

async function AnalyticsContent({
  searchParams,
}: {
  searchParams: { from?: string; to?: string; preset?: string };
}) {
  const dateRange = parseDateRangeParams(searchParams);
  const data = await getAnalyticsData(dateRange.from, dateRange.to);
  return <ClientAnalyticsDashboard data={data} dateRange={dateRange} />;
}

export default async function AnalyticsPage({ searchParams }: PageProps) {
  const resolvedSearchParams = await searchParams;
  return (
    <Suspense fallback={<AnalyticsSkeleton />}>
      <AnalyticsContent searchParams={resolvedSearchParams} />
    </Suspense>
  );
}
