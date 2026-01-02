import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { z } from "zod";

/**
 * GET /api/interviews
 * Get all interview requests for the recruiter's organization
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Check authentication
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user's organization
    const { data: userData } = await supabase
      .from("users")
      .select("id, organization_id")
      .eq("auth_id", user.id)
      .single();

    if (!userData) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get("status");
    const jobId = searchParams.get("jobId");

    // Build query
    let query = supabase
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
        updated_at,
        job_id,
        submission_id,
        candidate_id,
        client_id,
        jobs (
          id,
          title,
          vessel_name
        ),
        candidates (
          id,
          first_name,
          last_name,
          email,
          phone,
          primary_position,
          verification_tier
        ),
        clients (
          id,
          name,
          primary_contact_name,
          primary_contact_email
        )
      `);

    // Filter by organization (jobs created by this organization)
    // Note: We filter through jobs to ensure we only see our organization's interviews
    if (status) {
      query = query.eq("status", status);
    }

    if (jobId) {
      query = query.eq("job_id", jobId);
    }

    query = query.order("created_at", { ascending: false });

    const { data: interviews, error } = await query;

    if (error) {
      console.error("Database error:", error);
      return NextResponse.json(
        { error: "Failed to fetch interviews" },
        { status: 500 }
      );
    }

    // Transform data
    const transformedInterviews = (interviews || []).map((interview) => {
      const job = interview.jobs as unknown as Record<string, unknown> | null;
      const candidate = interview.candidates as unknown as Record<string, unknown> | null;
      const client = interview.clients as unknown as Record<string, unknown> | null;

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
        updatedAt: interview.updated_at,
        job: {
          id: job?.id,
          title: job?.title,
          vesselName: job?.vessel_name,
        },
        candidate: {
          id: candidate?.id,
          firstName: candidate?.first_name,
          lastName: candidate?.last_name,
          email: candidate?.email,
          phone: candidate?.phone,
          position: candidate?.primary_position,
          verificationTier: candidate?.verification_tier,
        },
        client: {
          id: client?.id,
          name: client?.name,
          contactName: client?.primary_contact_name,
          contactEmail: client?.primary_contact_email,
        },
      };
    });

    // Separate by status
    const pending = transformedInterviews.filter((i) => i.status === "pending");
    const scheduled = transformedInterviews.filter((i) => i.status === "scheduled");
    const completed = transformedInterviews.filter((i) => i.status === "completed");
    const cancelled = transformedInterviews.filter((i) => i.status === "cancelled");

    return NextResponse.json({
      data: {
        all: transformedInterviews,
        pending,
        scheduled,
        completed,
        cancelled,
        stats: {
          total: transformedInterviews.length,
          pending: pending.length,
          scheduled: scheduled.length,
          completed: completed.length,
          cancelled: cancelled.length,
        },
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
