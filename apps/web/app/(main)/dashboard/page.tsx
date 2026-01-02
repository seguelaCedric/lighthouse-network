import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { DashboardClient } from "./dashboard-client";
import { DashboardSkeleton } from "./dashboard-skeleton";
import type { BriefStatus } from "@lighthouse/database";

// Types for dashboard data
export interface DashboardStats {
  newBriefsCount: number;
  openJobsCount: number;
  placementsThisMonth: number;
}

export interface DashboardBrief {
  id: string;
  clientName: string;
  position: string;
  receivedAt: Date;
  status: BriefStatus;
  confidenceScore?: number;
}

export interface DashboardJob {
  id: string;
  title: string;
  client: string;
  daysSinceActivity: number;
  candidateCount: number;
  salary?: string;
}

export interface DashboardApplication {
  id: string;
  candidateName: string;
  jobTitle: string;
  jobId: string;
  vesselName: string;
  appliedAt: Date;
  source: string;
}

async function getDashboardData() {
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
    .select("id, organization_id, first_name")
    .eq("auth_id", user.id)
    .single();

  const agencyId = userData?.organization_id;
  const userName = userData?.first_name || "there";

  // Get start of current month for placements query
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

  // Run all queries in parallel
  const [
    newBriefsResult,
    openJobsResult,
    placementsResult,
    recentBriefsResult,
    staleJobsResult,
    recentApplicationsResult,
  ] = await Promise.all([
    // Count briefs where status = 'new'
    supabase
      .from("briefs")
      .select("id", { count: "exact", head: true })
      .eq("status", "new")
      .eq("assigned_agency_id", agencyId),

    // Count jobs where status = 'open'
    supabase
      .from("jobs")
      .select("id", { count: "exact", head: true })
      .eq("status", "open")
      .eq("created_by_agency_id", agencyId)
      .is("deleted_at", null),

    // Count applications where stage = 'placed' AND created_at this month
    supabase
      .from("applications")
      .select("id", { count: "exact", head: true })
      .eq("stage", "placed")
      .eq("agency_id", agencyId)
      .gte("created_at", startOfMonth),

    // Get last 5 briefs ordered by received_at desc
    supabase
      .from("briefs")
      .select(`
        id,
        status,
        received_at,
        parsing_confidence,
        parsed_data,
        client:organizations!briefs_client_id_fkey (
          id,
          name,
          vessel_name
        )
      `)
      .eq("assigned_agency_id", agencyId)
      .order("received_at", { ascending: false })
      .limit(5),

    // Get jobs with low activity
    // First get all open jobs, then we'll filter for stale ones
    supabase
      .from("jobs")
      .select(`
        id,
        title,
        vessel_name,
        salary_min,
        salary_max,
        salary_currency,
        updated_at,
        client:organizations!jobs_client_id_fkey (
          id,
          name,
          vessel_name
        )
      `)
      .eq("status", "open")
      .eq("created_by_agency_id", agencyId)
      .is("deleted_at", null)
      .order("updated_at", { ascending: true })
      .limit(10),

    // Get recent applications from job board
    supabase
      .from("applications")
      .select(`
        id,
        applied_at,
        source,
        candidate:candidates (
          id,
          first_name,
          last_name
        ),
        job:jobs (
          id,
          title,
          vessel_name
        )
      `)
      .eq("agency_id", agencyId)
      .eq("source", "job_board")
      .order("applied_at", { ascending: false })
      .limit(5),
  ]);

  // Process stats
  const stats: DashboardStats = {
    newBriefsCount: newBriefsResult.count ?? 0,
    openJobsCount: openJobsResult.count ?? 0,
    placementsThisMonth: placementsResult.count ?? 0,
  };

  // Process recent briefs
  const recentBriefs: DashboardBrief[] = (recentBriefsResult.data ?? []).map((brief) => {
    const client = brief.client as { name?: string; vessel_name?: string } | null;
    const parsedData = brief.parsed_data as { position?: string } | null;

    return {
      id: brief.id,
      clientName: client?.vessel_name || client?.name || "Unknown Client",
      position: parsedData?.position || "Position TBD",
      receivedAt: new Date(brief.received_at),
      status: brief.status as BriefStatus,
      confidenceScore: brief.parsing_confidence ?? undefined,
    };
  });

  // Process stale jobs (calculate days since activity)
  const fiveDaysAgo = new Date();
  fiveDaysAgo.setDate(fiveDaysAgo.getDate() - 5);

  // Get application counts for the jobs
  const jobIds = (staleJobsResult.data ?? []).map((j) => j.id);

  let applicationCounts: Record<string, number> = {};
  if (jobIds.length > 0) {
    const { data: appData } = await supabase
      .from("applications")
      .select("job_id")
      .in("job_id", jobIds);

    applicationCounts = (appData ?? []).reduce((acc, app) => {
      acc[app.job_id] = (acc[app.job_id] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
  }

  const staleJobs: DashboardJob[] = (staleJobsResult.data ?? [])
    .map((job) => {
      const client = job.client as { name?: string; vessel_name?: string } | null;
      const updatedAt = new Date(job.updated_at);
      const daysSinceActivity = Math.floor(
        (now.getTime() - updatedAt.getTime()) / (1000 * 60 * 60 * 24)
      );

      // Format salary
      let salary: string | undefined;
      if (job.salary_min || job.salary_max) {
        const currency = job.salary_currency || "EUR";
        const symbol = currency === "EUR" ? "€" : currency === "GBP" ? "£" : "$";
        if (job.salary_min && job.salary_max) {
          salary = `${symbol}${(job.salary_min / 1000).toFixed(0)}k-${(job.salary_max / 1000).toFixed(0)}k`;
        } else if (job.salary_min) {
          salary = `${symbol}${(job.salary_min / 1000).toFixed(0)}k+`;
        } else if (job.salary_max) {
          salary = `Up to ${symbol}${(job.salary_max / 1000).toFixed(0)}k`;
        }
      }

      return {
        id: job.id,
        title: job.title,
        client: client?.vessel_name || client?.name || job.vessel_name || "Unknown",
        daysSinceActivity,
        candidateCount: applicationCounts[job.id] || 0,
        salary,
      };
    })
    // Filter to only jobs with 5+ days of inactivity
    .filter((job) => job.daysSinceActivity >= 5)
    .slice(0, 4);

  // Process recent applications
  const recentApplications: DashboardApplication[] = (recentApplicationsResult.data ?? []).map((app) => {
    const candidate = app.candidate as { first_name?: string; last_name?: string } | null;
    const job = app.job as { id?: string; title?: string; vessel_name?: string } | null;

    return {
      id: app.id,
      candidateName: candidate ? `${candidate.first_name || ""} ${candidate.last_name || ""}`.trim() : "Unknown",
      jobTitle: job?.title || "Unknown Position",
      jobId: job?.id || "",
      vesselName: job?.vessel_name || "",
      appliedAt: new Date(app.applied_at),
      source: app.source || "job_board",
    };
  });

  return {
    stats,
    recentBriefs,
    staleJobs,
    recentApplications,
    userName,
  };
}

export default async function DashboardPage() {
  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <DashboardContent />
    </Suspense>
  );
}

async function DashboardContent() {
  const data = await getDashboardData();
  return <DashboardClient {...data} />;
}
