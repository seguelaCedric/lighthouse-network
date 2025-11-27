import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { z } from "zod";

const phoneNoteSchema = z.object({
  entityType: z.enum(["candidate", "client", "general"]),
  entityId: z.string().uuid().optional(),
  entityName: z.string().optional(),
  callType: z.enum(["incoming", "outgoing", "missed"]),
  duration: z.number().int().positive().optional(),
  summary: z.string().min(1).max(2000),
  nextAction: z.string().max(500).optional(),
  followUpDate: z.string().optional(),
  isBrief: z.boolean().optional(),
  briefContent: z.string().max(5000).optional(),
});

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user's info
    const { data: userData } = await supabase
      .from("users")
      .select("id, organization_id")
      .eq("auth_id", user.id)
      .single();

    if (!userData?.organization_id) {
      return NextResponse.json(
        { error: "User must belong to an organization" },
        { status: 403 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const parseResult = phoneNoteSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json(
        { error: "Invalid request data", details: parseResult.error.flatten() },
        { status: 400 }
      );
    }

    const data = parseResult.data;

    // If this is a brief, create a brief record
    let briefId: string | null = null;
    if (data.isBrief && data.briefContent) {
      // Try to find client ID if entityType is client
      let clientId: string | undefined;
      if (data.entityType === "client" && data.entityId) {
        clientId = data.entityId;
      }

      const { data: brief, error: briefError } = await supabase
        .from("briefs")
        .insert({
          raw_content: data.briefContent,
          source: "phone",
          sender_name: data.entityName,
          client_id: clientId,
          assigned_agency_id: userData.organization_id,
          status: "new",
          received_at: new Date().toISOString(),
          metadata: {
            from_phone_call: true,
            call_summary: data.summary,
          },
        })
        .select("id")
        .single();

      if (briefError) {
        console.error("Failed to create brief from phone call:", briefError);
      } else {
        briefId = brief.id;
      }
    }

    // Create the activity log entry for the call
    const activityData = {
      activity_type: "phone_call",
      entity_type: data.entityType === "general" ? "candidate" : data.entityType,
      entity_id: data.entityId || null,
      user_id: userData.id,
      organization_id: userData.organization_id,
      metadata: {
        call_type: data.callType,
        duration_seconds: data.duration,
        summary: data.summary,
        next_action: data.nextAction,
        follow_up_date: data.followUpDate,
        entity_name: data.entityName,
        brief_id: briefId,
      },
    };

    const { data: activity, error: activityError } = await supabase
      .from("activity_logs")
      .insert(activityData)
      .select()
      .single();

    if (activityError) {
      console.error("Failed to log phone call activity:", activityError);
      // Don't fail the request if activity logging fails
    }

    // Also create a note on the entity if we have an ID
    if (data.entityId && data.entityType !== "general") {
      const noteContent = [
        `**Phone Call** (${data.callType})`,
        data.duration
          ? `Duration: ${Math.floor(data.duration / 60)}m ${data.duration % 60}s`
          : "",
        "",
        data.summary,
        data.nextAction ? `\n**Next Action:** ${data.nextAction}` : "",
        data.followUpDate ? `\n**Follow-up:** ${data.followUpDate}` : "",
        briefId ? `\n*Brief created: #${briefId.slice(0, 8)}*` : "",
      ]
        .filter(Boolean)
        .join("\n");

      if (data.entityType === "candidate") {
        await supabase.from("candidate_notes").insert({
          candidate_id: data.entityId,
          content: noteContent,
          created_by: userData.id,
          note_type: "call_log",
        });
      } else if (data.entityType === "client") {
        // Store in a clients notes table if it exists, or use generic notes
        await supabase.from("notes").insert({
          entity_type: "client",
          entity_id: data.entityId,
          content: noteContent,
          created_by: userData.id,
          organization_id: userData.organization_id,
        });
      }
    }

    // If there's a follow-up date, create a reminder/task
    if (data.followUpDate && data.entityId) {
      const reminderTitle = data.nextAction || `Follow up on phone call`;

      // Create a notification for the follow-up
      await supabase.from("notifications").insert({
        user_id: userData.id,
        type: "follow_up_reminder",
        title: reminderTitle,
        message: `Follow up with ${data.entityName || "contact"}: ${data.summary.slice(0, 100)}...`,
        action_url:
          data.entityType === "candidate"
            ? `/candidates/${data.entityId}`
            : `/clients/${data.entityId}`,
        scheduled_for: new Date(data.followUpDate).toISOString(),
        metadata: {
          entity_type: data.entityType,
          entity_id: data.entityId,
        },
      });
    }

    return NextResponse.json(
      {
        success: true,
        briefId,
        message: "Phone call logged successfully",
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Unexpected error logging phone call:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// GET endpoint to retrieve phone call history
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Parse query params
    const entityType = request.nextUrl.searchParams.get("entity_type");
    const entityId = request.nextUrl.searchParams.get("entity_id");
    const limit = parseInt(request.nextUrl.searchParams.get("limit") || "20");

    // Build query
    let query = supabase
      .from("activity_logs")
      .select("*")
      .eq("activity_type", "phone_call")
      .order("created_at", { ascending: false })
      .limit(limit);

    if (entityType) {
      query = query.eq("entity_type", entityType);
    }

    if (entityId) {
      query = query.eq("entity_id", entityId);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Failed to fetch phone call history:", error);
      return NextResponse.json(
        { error: "Failed to fetch phone call history" },
        { status: 500 }
      );
    }

    return NextResponse.json({ data: data || [] });
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
