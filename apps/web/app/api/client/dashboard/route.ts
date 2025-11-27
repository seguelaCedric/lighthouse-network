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

    // Get total shortlisted candidates across all jobs
    const { data: jobs } = await supabase
      .from("jobs")
      .select("id")
      .eq("client_id", session.clientId);

    const jobIds = jobs?.map((j) => j.id) || [];

    let shortlistedCount = 0;
    let interviewsScheduled = 0;

    if (jobIds.length > 0) {
      const { count: shortlisted } = await supabase
        .from("submissions")
        .select("id", { count: "exact", head: true })
        .in("job_id", jobIds)
        .eq("status", "shortlisted");

      shortlistedCount = shortlisted || 0;

      // Get scheduled interviews
      const { count: interviews } = await supabase
        .from("interview_requests")
        .select("id", { count: "exact", head: true })
        .eq("client_id", session.clientId)
        .eq("status", "scheduled");

      interviewsScheduled = interviews || 0;
    }

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

    // Get submission stats for active jobs
    const activeSearchesWithStats = await Promise.all(
      (activeJobs || []).map(async (job) => {
        const { data: submissions } = await supabase
          .from("submissions")
          .select("id, status")
          .eq("job_id", job.id);

        return {
          id: job.id,
          position: job.title,
          status: job.status,
          urgent: job.is_urgent,
          daysOpen: Math.floor(
            (Date.now() - new Date(job.created_at).getTime()) /
              (1000 * 60 * 60 * 24)
          ),
          candidatesInPipeline: submissions?.length || 0,
          shortlisted:
            submissions?.filter((s) => s.status === "shortlisted").length || 0,
        };
      })
    );

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
      const candidate = s.candidates as Record<string, unknown> | null;
      const job = s.jobs as Record<string, unknown> | null;

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
      const candidate = i.candidates as Record<string, unknown> | null;
      const job = i.jobs as Record<string, unknown> | null;

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
