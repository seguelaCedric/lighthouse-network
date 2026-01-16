import { NextRequest, NextResponse } from "next/server";
import { processPendingJobAlerts } from "@/lib/services/job-alert-service";

/**
 * POST /api/cron/process-job-alerts
 *
 * Cron job to process pending job alerts.
 * This processes job alerts that were scheduled with a debounce delay,
 * typically from Vincere webhook events.
 *
 * The debounce mechanism ensures that when Vincere creates a job and then
 * sends multiple UPDATE webhooks for custom fields, we wait until all
 * updates are complete before sending alerts to candidates.
 *
 * Recommended schedule: Every 1-2 minutes
 *
 * Security: Protected by CRON_SECRET header
 */
export async function POST(request: NextRequest) {
  try {
    // Verify cron secret to prevent unauthorized access
    const authHeader = request.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;

    if (!cronSecret) {
      console.error("[ProcessJobAlerts] CRON_SECRET not configured");
      return NextResponse.json(
        { error: "Cron not configured" },
        { status: 500 }
      );
    }

    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Process pending alerts
    const result = await processPendingJobAlerts();

    return NextResponse.json({
      success: true,
      message: `Processed ${result.processed} pending job alerts`,
      ...result,
    });
  } catch (error) {
    console.error("[ProcessJobAlerts] Cron error:", error);
    return NextResponse.json(
      {
        error: "Failed to process pending job alerts",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/cron/process-job-alerts
 * Health check endpoint to verify the cron job is accessible
 */
export async function GET() {
  return NextResponse.json({
    status: "ok",
    endpoint: "process-job-alerts",
    method: "POST",
    description: "Processes pending job alerts that were scheduled with debounce delay",
  });
}
