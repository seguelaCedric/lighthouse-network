import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getClientSessionFromCookie } from "@/lib/auth/client-session";

/**
 * GET /api/client/dashboard
 * Get dashboard data for the client portal
 */
export async function GET() {
  try {
    const session = await getClientSessionFromCookie();

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = await createClient();

    // Get client details
    const { data: client } = await supabase
      .from("clients")
      .select(`
        id,
        name,
        type,
        primary_contact_name,
        primary_contact_email,
        vessel_name,
        vessel_type,
        vessel_size,
        total_placements,
        agency_id
      `)
      .eq("id", session.clientId)
      .single();

    // Get active jobs count
    const { count: activeSearches } = await supabase
      .from("jobs")
      .select("id", { count: "exact", head: true })
      .eq("client_id", session.clientId)
      .in("status", ["open", "shortlisting", "interviewing"]);

    // Get total shortlisted candidates across all jobs (limited query for job IDs)
    const { data: jobs } = await supabase
      .from("jobs")
      .select("id")
      .eq("client_id", session.clientId)
      .limit(100); // Limit to prevent unbounded queries

    const jobIds = jobs?.map((j) => j.id) || [];

    let shortlistedCount = 0;
    let interviewsScheduled = 0;

    // Run these counts in parallel
    const [shortlistedResult, interviewsResult] = await Promise.all([
      jobIds.length > 0
        ? supabase
            .from("submissions")
            .select("id", { count: "exact", head: true })
            .in("job_id", jobIds)
            .eq("status", "shortlisted")
        : Promise.resolve({ count: 0 }),
      supabase
        .from("interview_requests")
        .select("id", { count: "exact", head: true })
        .eq("client_id", session.clientId)
        .eq("status", "scheduled"),
    ]);

    shortlistedCount = shortlistedResult.count || 0;
    interviewsScheduled = interviewsResult.count || 0;

    // Get active searches with details
    const { data: activeJobs } = await supabase
      .from("jobs")
      .select(`
        id,
        title,
        position_category,
        status,
        is_urgent,
        created_at,
        submissions_count
      `)
      .eq("client_id", session.clientId)
      .in("status", ["open", "shortlisting", "interviewing"])
      .order("created_at", { ascending: false })
      .limit(5);

    // Get submission stats for active jobs using efficient COUNT queries
    const activeJobIds = (activeJobs || []).map((j) => j.id);

    // Batch fetch submission counts instead of N+1 queries
    let submissionStats: Record<string, { total: number; shortlisted: number }> = {};

    if (activeJobIds.length > 0) {
      // Get total submissions per job and shortlisted count in parallel
      const [totalCountsResult, shortlistedCountsResult] = await Promise.all([
        // Get total submissions per job
        Promise.all(
          activeJobIds.map(async (jobId) => {
            const { count } = await supabase
              .from("submissions")
              .select("id", { count: "exact", head: true })
              .eq("job_id", jobId);
            return { jobId, count: count ?? 0 };
          })
        ),
        // Get shortlisted count per job
        Promise.all(
          activeJobIds.map(async (jobId) => {
            const { count } = await supabase
              .from("submissions")
              .select("id", { count: "exact", head: true })
              .eq("job_id", jobId)
              .eq("status", "shortlisted");
            return { jobId, count: count ?? 0 };
          })
        ),
      ]);

      // Build stats map
      totalCountsResult.forEach(({ jobId, count }) => {
        submissionStats[jobId] = { total: count, shortlisted: 0 };
      });
      shortlistedCountsResult.forEach(({ jobId, count }) => {
        if (submissionStats[jobId]) {
          submissionStats[jobId].shortlisted = count;
        }
      });
    }

    const activeSearchesWithStats = (activeJobs || []).map((job) => ({
      id: job.id,
      position: job.title,
      status: job.status,
      urgent: job.is_urgent,
      daysOpen: Math.floor(
        (Date.now() - new Date(job.created_at).getTime()) /
          (1000 * 60 * 60 * 24)
      ),
      candidatesInPipeline: submissionStats[job.id]?.total || 0,
      shortlisted: submissionStats[job.id]?.shortlisted || 0,
    }));

    // Get recent shortlisted candidates
    const { data: recentShortlisted } = await supabase
      .from("submissions")
      .select(`
        id,
        submitted_at,
        status,
        match_score,
        cover_note,
        client_feedback_rating,
        job_id,
        jobs (
          id,
          title
        ),
        candidates (
          id,
          first_name,
          last_name,
          primary_position,
          years_experience,
          current_location,
          verification_tier
        )
      `)
      .in("job_id", jobIds)
      .eq("status", "shortlisted")
      .order("submitted_at", { ascending: false })
      .limit(4);

    const shortlistedCandidates = (recentShortlisted || []).map((s) => {
      const candidate = s.candidates as unknown as Record<string, unknown> | null;
      const job = s.jobs as unknown as Record<string, unknown> | null;

      return {
        id: s.id,
        firstName: candidate?.first_name || "Unknown",
        lastInitial: candidate?.last_name
          ? (candidate.last_name as string).charAt(0)
          : "",
        position: candidate?.primary_position || (job?.title as string) || "",
        verificationTier: candidate?.verification_tier || "basic",
        matchPercentage: s.match_score || 0,
        yearsExperience: candidate?.years_experience || 0,
        currentLocation: candidate?.current_location || "Unknown",
        sharedDate: s.submitted_at,
        status: s.client_feedback_rating
          ? "feedback_given"
          : "pending_review",
        recruiterNote: s.cover_note,
      };
    });

    // Get upcoming interviews
    const { data: upcomingInterviews } = await supabase
      .from("interview_requests")
      .select(`
        id,
        scheduled_at,
        requested_type,
        meeting_link,
        notes,
        candidates (
          first_name,
          last_name,
          primary_position
        ),
        jobs (
          title
        )
      `)
      .eq("client_id", session.clientId)
      .eq("status", "scheduled")
      .gt("scheduled_at", new Date().toISOString())
      .order("scheduled_at", { ascending: true })
      .limit(4);

    const interviews = (upcomingInterviews || []).map((i) => {
      const candidate = i.candidates as unknown as Record<string, unknown> | null;
      const job = i.jobs as unknown as Record<string, unknown> | null;

      return {
        id: i.id,
        candidateName: `${candidate?.first_name || "Unknown"} ${
          candidate?.last_name
            ? (candidate.last_name as string).charAt(0) + "."
            : ""
        }`,
        position: candidate?.primary_position || (job?.title as string) || "",
        dateTime: i.scheduled_at,
        type: i.requested_type || "video",
        meetingLink: i.meeting_link,
        notes: i.notes,
      };
    });

    return NextResponse.json({
      data: {
        client: {
          name: client?.name || session.clientName,
          contactName: client?.primary_contact_name || session.primaryContactName,
          vesselName: client?.vessel_name,
          vesselType: client?.vessel_type,
          vesselSize: client?.vessel_size,
        },
        stats: {
          activeSearches: activeSearches || 0,
          candidatesShortlisted: shortlistedCount,
          interviewsScheduled,
          successfulPlacements: client?.total_placements || 0,
        },
        activeSearches: activeSearchesWithStats,
        shortlistedCandidates,
        upcomingInterviews: interviews,
      },
    });
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
