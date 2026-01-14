import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getClientSessionFromCookie } from "@/lib/auth/client-session";
import { z } from "zod";
import { sendEmail, isResendConfigured } from "@/lib/email/client";
import { interviewRequestNotificationEmail } from "@/lib/email/templates";

const requestInterviewSchema = z.object({
  submissionId: z.string().uuid(),
  jobId: z.string().uuid(),
  requestedType: z.enum(["video", "phone", "in_person"]).optional(),
  preferredDates: z
    .array(
      z.object({
        start: z.string(),
        end: z.string(),
      })
    )
    .optional(),
  notes: z.string().optional(),
});

/**
 * GET /api/client/interviews
 * Get all interview requests/scheduled interviews for the client
 */
export async function GET() {
  try {
    const session = await getClientSessionFromCookie();

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = await createClient();

    // Get interview requests for this client
    const { data: interviews, error } = await supabase
      .from("interview_requests")
      .select(`
        id,
        status,
        requested_type,
        preferred_dates,
        notes,
        scheduled_at,
        meeting_link,
        meeting_location,
        duration_minutes,
        created_at,
        job_id,
        submission_id,
        candidate_id,
        jobs (
          id,
          title,
          vessel_name
        ),
        candidates (
          id,
          first_name,
          last_name,
          primary_position,
          verification_tier
        )
      `)
      .eq("client_id", session.clientId)
      .order("scheduled_at", { ascending: true, nullsFirst: false })
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Database error:", error);
      return NextResponse.json(
        { error: "Failed to fetch interviews" },
        { status: 500 }
      );
    }

    // Transform data for client view
    const transformedInterviews = (interviews || []).map((interview) => {
      const job = interview.jobs as unknown as Record<string, unknown> | null;
      const candidate = interview.candidates as unknown as Record<string, unknown> | null;

      return {
        id: interview.id,
        status: interview.status,
        requestedType: interview.requested_type,
        preferredDates: interview.preferred_dates,
        notes: interview.notes,
        scheduledAt: interview.scheduled_at,
        meetingLink: interview.meeting_link,
        meetingLocation: interview.meeting_location,
        durationMinutes: interview.duration_minutes,
        createdAt: interview.created_at,
        job: {
          id: job?.id,
          title: job?.title,
          vesselName: job?.vessel_name,
        },
        candidate: {
          id: candidate?.id,
          firstName: candidate?.first_name,
          lastInitial: candidate?.last_name
            ? (candidate.last_name as string).charAt(0)
            : "",
          position: candidate?.primary_position,
          verificationTier: candidate?.verification_tier,
        },
      };
    });

    // Separate into upcoming and past
    const now = new Date();
    const upcoming = transformedInterviews.filter(
      (i) => i.status !== "completed" && i.status !== "cancelled"
    );
    const past = transformedInterviews.filter(
      (i) => i.status === "completed" || i.status === "cancelled"
    );

    return NextResponse.json({
      data: {
        upcoming,
        past,
        totalCount: transformedInterviews.length,
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

/**
 * POST /api/client/interviews
 * Request an interview with a candidate
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getClientSessionFromCookie();

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Parse request body
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    // Validate input
    const parseResult = requestInterviewSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parseResult.error.flatten() },
        { status: 400 }
      );
    }

    const { submissionId, jobId, requestedType, preferredDates, notes } =
      parseResult.data;

    const supabase = await createClient();

    // Verify the job belongs to this client
    const { data: job, error: jobError } = await supabase
      .from("jobs")
      .select("id, client_id")
      .eq("id", jobId)
      .single();

    if (jobError || !job) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    if (job.client_id !== session.clientId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Verify the submission belongs to this job and get candidate_id
    const { data: submission, error: submissionError } = await supabase
      .from("submissions")
      .select("id, job_id, candidate_id, status")
      .eq("id", submissionId)
      .eq("job_id", jobId)
      .single();

    if (submissionError || !submission) {
      return NextResponse.json(
        { error: "Submission not found" },
        { status: 404 }
      );
    }

    // Check if interview request already exists
    const { data: existingRequest } = await supabase
      .from("interview_requests")
      .select("id, status")
      .eq("client_id", session.clientId)
      .eq("submission_id", submissionId)
      .single();

    if (existingRequest && existingRequest.status !== "cancelled") {
      return NextResponse.json(
        { error: "Interview already requested for this candidate" },
        { status: 400 }
      );
    }

    // Create interview request
    const { data: interviewRequest, error: insertError } = await supabase
      .from("interview_requests")
      .insert({
        client_id: session.clientId,
        submission_id: submissionId,
        job_id: jobId,
        candidate_id: submission.candidate_id,
        requested_type: requestedType,
        preferred_dates: preferredDates,
        notes,
        status: "pending",
      })
      .select()
      .single();

    if (insertError) {
      console.error("Database error:", insertError);
      return NextResponse.json(
        { error: "Failed to create interview request" },
        { status: 500 }
      );
    }

    // Update submission status to interviewing
    await supabase
      .from("submissions")
      .update({ status: "interviewing" })
      .eq("id", submissionId);

    // Update client feedback to "interested"
    await supabase
      .from("submissions")
      .update({
        client_feedback_rating: "interested",
        client_feedback_at: new Date().toISOString(),
      })
      .eq("id", submissionId);

    // Send notification to agency recruiters
    if (isResendConfigured()) {
      try {
        // Get job details with client info
        const { data: jobDetails } = await supabase
          .from("jobs")
          .select(`
            title,
            vessel_name,
            agency_id,
            clients (
              name,
              contact_name
            )
          `)
          .eq("id", jobId)
          .single();

        // Get candidate name
        const { data: candidate } = await supabase
          .from("candidates")
          .select("first_name, last_name")
          .eq("id", submission.candidate_id)
          .single();

        const clientData = jobDetails?.clients as unknown as { name?: string; contact_name?: string } | null;
        const clientName = clientData?.name || clientData?.contact_name || "Client";
        const candidateName = candidate ? `${candidate.first_name} ${candidate.last_name}` : "Candidate";

        // Get agency recruiters
        if (jobDetails?.agency_id) {
          const { data: recruiters } = await supabase
            .from("users")
            .select("email, full_name")
            .eq("agency_id", jobDetails.agency_id)
            .in("user_type", ["recruiter", "admin"]);

          const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://lighthouse-careers.com";

          if (recruiters && recruiters.length > 0) {
            await Promise.all(
              recruiters.map(async (recruiter) => {
                const emailData = interviewRequestNotificationEmail({
                  recruiterName: recruiter.full_name || "Team",
                  clientName,
                  candidateName,
                  position: jobDetails.title,
                  vesselName: jobDetails.vessel_name || undefined,
                  requestedType: requestedType || undefined,
                  preferredDates: preferredDates || undefined,
                  notes: notes || undefined,
                  dashboardLink: `${baseUrl}/admin/interviews`,
                });

                await sendEmail({
                  to: recruiter.email,
                  subject: emailData.subject,
                  html: emailData.html,
                  text: emailData.text,
                });
              })
            );
          }
        }
      } catch (emailError) {
        // Log but don't fail the request
        console.error("Failed to send interview request notification:", emailError);
      }
    }

    return NextResponse.json(
      {
        success: true,
        data: interviewRequest,
        message:
          "Interview request submitted. Your recruiter will contact you to schedule.",
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
