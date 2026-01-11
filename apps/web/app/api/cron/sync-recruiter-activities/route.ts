import { NextRequest, NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/server";
import {
  syncAllUserActivities,
  getPreviousDayRange,
} from "@/lib/vincere/activities";

/**
 * GET /api/cron/sync-recruiter-activities
 *
 * Daily cron job to sync recruiter activities from Vincere
 * Scheduled to run at 5PM Paris time (4PM UTC in winter)
 *
 * Fetches activities (tasks and meetings) for all Vincere users
 * from the previous day and stores them in recruiter_activities table.
 *
 * Security: Protected by CRON_SECRET header
 */
export const maxDuration = 300; // 5 minutes max

export async function GET(request: NextRequest) {
  const startTime = Date.now();

  try {
    // Verify cron secret
    const authHeader = request.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.log("[sync-recruiter-activities] Starting daily sync...");

    // Use service role client to bypass RLS
    const supabase = createServiceRoleClient();

    // Get the organization ID (assuming single-tenant for now)
    // In multi-tenant setup, would need to iterate over all organizations
    const { data: org, error: orgError } = await supabase
      .from("organizations")
      .select("id")
      .limit(1)
      .single();

    if (orgError || !org) {
      console.error("[sync-recruiter-activities] No organization found:", orgError);
      return NextResponse.json(
        { error: "No organization found" },
        { status: 500 }
      );
    }

    const organizationId = org.id;

    // Get date range for previous day
    const { fromDate, toDate } = getPreviousDayRange();
    const activityDate = fromDate.toISOString().split("T")[0]; // YYYY-MM-DD

    console.log(
      `[sync-recruiter-activities] Syncing activities for ${activityDate}`
    );

    // Fetch activities from Vincere
    const activityCounts = await syncAllUserActivities(fromDate, toDate);

    if (activityCounts.length === 0) {
      console.log("[sync-recruiter-activities] No activities found");
      return NextResponse.json({
        success: true,
        message: "No activities found for the period",
        date: activityDate,
        usersProcessed: 0,
      });
    }

    // Upsert activity counts into database
    const records = activityCounts.map((counts) => ({
      organization_id: organizationId,
      vincere_user_id: counts.vincereUserId,
      user_name: counts.userName,
      activity_date: activityDate,
      tasks_count: counts.tasksCount,
      meetings_count: counts.meetingsCount,
      synced_at: new Date().toISOString(),
    }));

    const { error: upsertError } = await supabase
      .from("recruiter_activities")
      .upsert(records, {
        onConflict: "organization_id,vincere_user_id,activity_date",
      });

    if (upsertError) {
      console.error(
        "[sync-recruiter-activities] Failed to upsert activities:",
        upsertError
      );
      return NextResponse.json(
        { error: "Failed to store activities" },
        { status: 500 }
      );
    }

    const duration = Date.now() - startTime;
    const totalActivities = activityCounts.reduce(
      (sum, c) => sum + c.totalCount,
      0
    );

    console.log(
      `[sync-recruiter-activities] Completed in ${duration}ms: ${activityCounts.length} users, ${totalActivities} total activities`
    );

    // Log the sync activity
    await supabase.from("activity_logs").insert({
      activity_type: "recruiter_activities_synced",
      entity_type: "recruiter_activities",
      organization_id: organizationId,
      metadata: {
        date: activityDate,
        users_processed: activityCounts.length,
        total_tasks: activityCounts.reduce((sum, c) => sum + c.tasksCount, 0),
        total_meetings: activityCounts.reduce(
          (sum, c) => sum + c.meetingsCount,
          0
        ),
        duration_ms: duration,
      },
    });

    return NextResponse.json({
      success: true,
      message: `Synced activities for ${activityCounts.length} recruiters`,
      date: activityDate,
      usersProcessed: activityCounts.length,
      totalActivities,
      durationMs: duration,
    });
  } catch (error) {
    console.error("[sync-recruiter-activities] Error:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Sync failed",
      },
      { status: 500 }
    );
  }
}

// Support POST as well for flexibility
export async function POST(request: NextRequest) {
  return GET(request);
}
