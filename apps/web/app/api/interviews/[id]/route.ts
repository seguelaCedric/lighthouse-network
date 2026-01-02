import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { z } from "zod";
import { notifyClientInterviewScheduled } from "@/lib/notifications/client-notifications";
import {
  sendEmail,
  interviewScheduledEmail,
  interviewScheduledClientEmail,
  isResendConfigured,
} from "@/lib/email";

const scheduleInterviewSchema = z.object({
  scheduledAt: z.string(),
  meetingLink: z.string().optional(),
  meetingLocation: z.string().optional(),
  durationMinutes: z.number().min(15).max(240).optional(),
  notes: z.string().optional(),
});

const updateStatusSchema = z.object({
  status: z.enum(["scheduled", "completed", "cancelled"]),
  notes: z.string().optional(),
  cancellationReason: z.string().optional(),
});

/**
 * GET /api/interviews/[id]
 * Get a specific interview request
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const { data: interview, error } = await supabase
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
          vessel_name,
          position_category
        ),
        candidates (
          id,
          first_name,
          last_name,
          email,
          phone,
          whatsapp,
          primary_position,
          verification_tier,
          current_location
        ),
        clients (
          id,
          name,
          primary_contact_name,
          primary_contact_email,
          primary_contact_phone
        )
      `)
      .eq("id", id)
      .single();

    if (error || !interview) {
      return NextResponse.json(
        { error: "Interview request not found" },
        { status: 404 }
      );
    }

    const job = interview.jobs as unknown as Record<string, unknown> | null;
    const candidate = interview.candidates as unknown as Record<string, unknown> | null;
    const client = interview.clients as unknown as Record<string, unknown> | null;

    return NextResponse.json({
      data: {
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
          positionCategory: job?.position_category,
        },
        candidate: {
          id: candidate?.id,
          firstName: candidate?.first_name,
          lastName: candidate?.last_name,
          email: candidate?.email,
          phone: candidate?.phone,
          whatsapp: candidate?.whatsapp,
          position: candidate?.primary_position,
          verificationTier: candidate?.verification_tier,
          location: candidate?.current_location,
        },
        client: {
          id: client?.id,
          name: client?.name,
          contactName: client?.primary_contact_name,
          contactEmail: client?.primary_contact_email,
          contactPhone: client?.primary_contact_phone,
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

/**
 * PATCH /api/interviews/[id]
 * Schedule or update an interview
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user info
    const { data: userData } = await supabase
      .from("users")
      .select("id, organization_id")
      .eq("auth_id", user.id)
      .single();

    if (!userData) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const { id } = await params;

    // Parse request body
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    // Try to parse as schedule interview
    const scheduleResult = scheduleInterviewSchema.safeParse(body);

    if (scheduleResult.success) {
      const { scheduledAt, meetingLink, meetingLocation, durationMinutes, notes } =
        scheduleResult.data;

      // Update interview with schedule
      const { data: interview, error: updateError } = await supabase
        .from("interview_requests")
        .update({
          scheduled_at: scheduledAt,
          meeting_link: meetingLink || null,
          meeting_location: meetingLocation || null,
          duration_minutes: durationMinutes || 60,
          notes: notes || null,
          status: "scheduled",
          updated_at: new Date().toISOString(),
        })
        .eq("id", id)
        .select(`
          id,
          job_id,
          submission_id,
          candidate_id,
          client_id,
          jobs (id, title),
          candidates (id, first_name, last_name, email),
          clients (id, name, primary_contact_email)
        `)
        .single();

      if (updateError || !interview) {
        console.error("Database error:", updateError);
        return NextResponse.json(
          { error: "Failed to schedule interview" },
          { status: 500 }
        );
      }

      // Create activity log
      await supabase.from("activity_logs").insert({
        activity_type: "interview_scheduled",
        entity_type: "interview",
        entity_id: id,
        user_id: userData.id,
        organization_id: userData.organization_id,
        metadata: {
          job_id: interview.job_id,
          candidate_id: interview.candidate_id,
          client_id: interview.client_id,
          scheduled_at: scheduledAt,
        },
      });

      // Send notification to client
      const candidate = interview.candidates as unknown as Record<string, unknown> | null;
      const candidateName = candidate
        ? `${candidate.first_name} ${(candidate.last_name as string)?.charAt(0)}.`
        : "Candidate";
      const dateTimeFormatted = new Date(scheduledAt).toLocaleString("en-GB", {
        weekday: "short",
        day: "numeric",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
      });

      await notifyClientInterviewScheduled(
        interview.client_id,
        candidateName,
        dateTimeFormatted,
        "Video"
      ).catch((err) => {
        console.error("Failed to send client notification:", err);
      });

      // Send email notifications if configured
      if (isResendConfigured()) {
        const job = interview.jobs as unknown as Record<string, unknown> | null;
        const client = interview.clients as unknown as Record<string, unknown> | null;

        const formattedDate = new Date(scheduledAt).toLocaleDateString("en-GB", {
          weekday: "long",
          day: "numeric",
          month: "long",
          year: "numeric",
        });
        const formattedTime = new Date(scheduledAt).toLocaleTimeString("en-GB", {
          hour: "2-digit",
          minute: "2-digit",
        });

        // Send email to candidate
        const candidateEmail = candidate?.email as string | undefined;
        if (candidateEmail) {
          const candidateEmailContent = interviewScheduledEmail({
            candidateName: candidate?.first_name as string,
            position: (job?.title as string) || "Position",
            vesselName: "the vessel",
            date: formattedDate,
            time: formattedTime,
            location: meetingLocation || meetingLink || undefined,
            notes: notes || undefined,
          });

          sendEmail({
            to: candidateEmail,
            subject: candidateEmailContent.subject,
            html: candidateEmailContent.html,
            text: candidateEmailContent.text,
          })
            .then((result) => {
              if (result.success) {
                console.log(`Interview email sent to candidate ${candidateEmail}`);
              } else {
                console.error("Failed to send candidate interview email:", result.error);
              }
            })
            .catch((err) => console.error("Error sending candidate email:", err));
        }

        // Send email to client
        const clientEmail = client?.primary_contact_email as string | undefined;
        if (clientEmail) {
          const clientEmailContent = interviewScheduledClientEmail({
            clientContactName: (client?.name as string) || "there",
            candidateName,
            position: (job?.title as string) || "Position",
            vesselName: "your vessel",
            date: formattedDate,
            time: formattedTime,
            location: meetingLocation || undefined,
            meetingLink: meetingLink || undefined,
            interviewType: "Video",
          });

          sendEmail({
            to: clientEmail,
            subject: clientEmailContent.subject,
            html: clientEmailContent.html,
            text: clientEmailContent.text,
          })
            .then((result) => {
              if (result.success) {
                console.log(`Interview email sent to client ${clientEmail}`);
              } else {
                console.error("Failed to send client interview email:", result.error);
              }
            })
            .catch((err) => console.error("Error sending client email:", err));
        }
      }

      return NextResponse.json({
        success: true,
        message: "Interview scheduled successfully",
        data: interview,
      });
    }

    // Try to parse as status update
    const statusResult = updateStatusSchema.safeParse(body);

    if (statusResult.success) {
      const { status, notes, cancellationReason } = statusResult.data;

      const updateData: Record<string, unknown> = {
        status,
        updated_at: new Date().toISOString(),
      };

      if (notes) {
        updateData.notes = notes;
      }

      if (status === "cancelled" && cancellationReason) {
        updateData.cancellation_reason = cancellationReason;
      }

      const { data: interview, error: updateError } = await supabase
        .from("interview_requests")
        .update(updateData)
        .eq("id", id)
        .select()
        .single();

      if (updateError || !interview) {
        console.error("Database error:", updateError);
        return NextResponse.json(
          { error: "Failed to update interview" },
          { status: 500 }
        );
      }

      // If completed, update submission status
      if (status === "completed") {
        await supabase
          .from("submissions")
          .update({ status: "interviewing" })
          .eq("id", interview.submission_id);
      }

      // Create activity log
      await supabase.from("activity_logs").insert({
        activity_type: `interview_${status}`,
        entity_type: "interview",
        entity_id: id,
        user_id: userData.id,
        organization_id: userData.organization_id,
        metadata: {
          job_id: interview.job_id,
          candidate_id: interview.candidate_id,
          client_id: interview.client_id,
          previous_status: interview.status,
          new_status: status,
        },
      });

      return NextResponse.json({
        success: true,
        message: `Interview ${status} successfully`,
        data: interview,
      });
    }

    return NextResponse.json(
      { error: "Invalid request body" },
      { status: 400 }
    );
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
