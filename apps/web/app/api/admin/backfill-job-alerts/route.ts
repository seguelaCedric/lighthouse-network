import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { processInitialJobMatches } from "@/lib/services/job-alert-service";

/**
 * Admin endpoint to backfill job alert notifications for existing candidates
 * who have already completed their preferences but didn't receive initial job matches.
 *
 * GET /api/admin/backfill-job-alerts
 *   - Returns candidates eligible for backfill (dry run)
 *
 * POST /api/admin/backfill-job-alerts
 *   - Body: { candidateIds?: string[], limit?: number, dryRun?: boolean }
 *   - If candidateIds provided, only process those candidates
 *   - If limit provided, only process that many candidates
 *   - If dryRun is true, only return what would be processed
 */

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

    // Check if user is admin
    const { data: userData } = await supabase
      .from("users")
      .select("role")
      .eq("auth_id", user.id)
      .single();

    if (userData?.role !== "admin" && userData?.role !== "super_admin") {
      return NextResponse.json(
        { error: "Admin access required" },
        { status: 403 }
      );
    }

    // Find candidates who:
    // 1. Have completed preferences (preferences_completed_at is set)
    // 2. Have job alerts enabled
    // 3. Have at least one position preference set
    const { data: candidates, error: candidatesError } = await supabase
      .from("candidates")
      .select(`
        id,
        email,
        first_name,
        last_name,
        preferences_completed_at,
        job_alerts_enabled,
        yacht_primary_position,
        yacht_secondary_positions,
        household_primary_position,
        household_secondary_positions,
        primary_position,
        secondary_positions
      `)
      .not("preferences_completed_at", "is", null)
      .eq("job_alerts_enabled", true)
      .order("preferences_completed_at", { ascending: false });

    if (candidatesError) {
      return NextResponse.json(
        { error: "Failed to fetch candidates", details: candidatesError.message },
        { status: 500 }
      );
    }

    // Filter to only those with at least one position preference
    const eligibleCandidates = (candidates || []).filter((c) => {
      return (
        c.yacht_primary_position ||
        c.household_primary_position ||
        c.primary_position ||
        (c.yacht_secondary_positions && c.yacht_secondary_positions.length > 0) ||
        (c.household_secondary_positions && c.household_secondary_positions.length > 0) ||
        (c.secondary_positions && c.secondary_positions.length > 0)
      );
    });

    // Check how many already have job alert notifications
    const { data: existingAlerts } = await supabase
      .from("job_alert_log")
      .select("candidate_id")
      .in("candidate_id", eligibleCandidates.map(c => c.id));

    const candidatesWithAlerts = new Set((existingAlerts || []).map(a => a.candidate_id));

    // Candidates who haven't received any job alerts yet
    const candidatesNeedingBackfill = eligibleCandidates.filter(
      c => !candidatesWithAlerts.has(c.id)
    );

    return NextResponse.json({
      totalEligible: eligibleCandidates.length,
      alreadyHaveAlerts: candidatesWithAlerts.size,
      needingBackfill: candidatesNeedingBackfill.length,
      candidates: candidatesNeedingBackfill.map(c => ({
        id: c.id,
        email: c.email,
        name: `${c.first_name || ""} ${c.last_name || ""}`.trim(),
        preferencesCompletedAt: c.preferences_completed_at,
        positions: [
          c.yacht_primary_position,
          c.household_primary_position,
          c.primary_position,
          ...(c.yacht_secondary_positions || []),
          ...(c.household_secondary_positions || []),
          ...(c.secondary_positions || []),
        ].filter(Boolean),
      })),
      message: `Found ${candidatesNeedingBackfill.length} candidates needing backfill. Use POST to process them.`,
    });
  } catch (error) {
    console.error("[BackfillJobAlerts] GET Error:", error);
    return NextResponse.json(
      {
        error: "Failed to check candidates",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

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

    // Check if user is admin
    const { data: userData } = await supabase
      .from("users")
      .select("role")
      .eq("auth_id", user.id)
      .single();

    if (userData?.role !== "admin" && userData?.role !== "super_admin") {
      return NextResponse.json(
        { error: "Admin access required" },
        { status: 403 }
      );
    }

    // Parse request body
    const body = await request.json().catch(() => ({}));
    const { candidateIds, limit = 50, dryRun = false } = body as {
      candidateIds?: string[];
      limit?: number;
      dryRun?: boolean;
    };

    // Build query for candidates needing backfill
    let query = supabase
      .from("candidates")
      .select(`
        id,
        email,
        first_name,
        last_name,
        preferences_completed_at,
        job_alerts_enabled,
        yacht_primary_position,
        yacht_secondary_positions,
        household_primary_position,
        household_secondary_positions,
        primary_position,
        secondary_positions
      `)
      .not("preferences_completed_at", "is", null)
      .eq("job_alerts_enabled", true);

    if (candidateIds && candidateIds.length > 0) {
      query = query.in("id", candidateIds);
    }

    const { data: candidates, error: candidatesError } = await query
      .order("preferences_completed_at", { ascending: false })
      .limit(limit);

    if (candidatesError) {
      return NextResponse.json(
        { error: "Failed to fetch candidates", details: candidatesError.message },
        { status: 500 }
      );
    }

    // Filter to only those with at least one position preference
    const eligibleCandidates = (candidates || []).filter((c) => {
      return (
        c.yacht_primary_position ||
        c.household_primary_position ||
        c.primary_position ||
        (c.yacht_secondary_positions && c.yacht_secondary_positions.length > 0) ||
        (c.household_secondary_positions && c.household_secondary_positions.length > 0) ||
        (c.secondary_positions && c.secondary_positions.length > 0)
      );
    });

    if (dryRun) {
      return NextResponse.json({
        dryRun: true,
        wouldProcess: eligibleCandidates.length,
        candidates: eligibleCandidates.map(c => ({
          id: c.id,
          email: c.email,
          name: `${c.first_name || ""} ${c.last_name || ""}`.trim(),
        })),
        message: `Would process ${eligibleCandidates.length} candidates. Set dryRun: false to execute.`,
      });
    }

    // Process each candidate
    const results: Array<{
      candidateId: string;
      email: string | null;
      success: boolean;
      totalMatches: number;
      notificationsCreated: number;
      emailSent: boolean;
      error?: string;
    }> = [];

    for (const candidate of eligibleCandidates) {
      try {
        console.log(`[BackfillJobAlerts] Processing candidate ${candidate.id} (${candidate.email})`);
        const result = await processInitialJobMatches(candidate.id);
        results.push({
          candidateId: candidate.id,
          email: candidate.email,
          success: true,
          totalMatches: result.totalMatches,
          notificationsCreated: result.notificationsCreated,
          emailSent: result.emailSent,
        });
      } catch (error) {
        console.error(`[BackfillJobAlerts] Error processing candidate ${candidate.id}:`, error);
        results.push({
          candidateId: candidate.id,
          email: candidate.email,
          success: false,
          totalMatches: 0,
          notificationsCreated: 0,
          emailSent: false,
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }

    const successCount = results.filter(r => r.success).length;
    const totalMatches = results.reduce((sum, r) => sum + r.totalMatches, 0);
    const totalNotifications = results.reduce((sum, r) => sum + r.notificationsCreated, 0);
    const totalEmails = results.filter(r => r.emailSent).length;

    return NextResponse.json({
      success: true,
      processed: results.length,
      successful: successCount,
      failed: results.length - successCount,
      totalMatches,
      totalNotifications,
      totalEmails,
      results,
    });
  } catch (error) {
    console.error("[BackfillJobAlerts] POST Error:", error);
    return NextResponse.json(
      {
        error: "Backfill failed",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
