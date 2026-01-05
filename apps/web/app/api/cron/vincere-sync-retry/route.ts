import { NextRequest, NextResponse } from "next/server";
import { processRetryQueue } from "@/lib/vincere/sync-service";

/**
 * POST /api/cron/vincere-sync-retry
 * Cron job to retry failed Vincere sync operations
 *
 * This endpoint should be called by a cron scheduler (e.g., Vercel Cron)
 * every 5-15 minutes to retry failed sync operations with exponential backoff.
 *
 * Security: Protected by CRON_SECRET header
 *
 * Retry strategy:
 * - Attempt 1: Immediate
 * - Attempt 2: After 5 minutes
 * - Attempt 3: After 30 minutes
 * - Attempt 4+: After 2 hours
 * - Max attempts: 5
 */
export async function POST(request: NextRequest) {
  try {
    // Verify cron secret to prevent unauthorized access
    const authHeader = request.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;

    if (!cronSecret) {
      console.error("CRON_SECRET not configured");
      return NextResponse.json(
        { error: "Cron not configured" },
        { status: 500 }
      );
    }

    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if Vincere is configured
    if (
      !process.env.VINCERE_CLIENT_ID ||
      !process.env.VINCERE_API_KEY ||
      !process.env.VINCERE_REFRESH_TOKEN
    ) {
      console.log("Vincere not configured, skipping retry processing");
      return NextResponse.json({
        success: true,
        message: "Vincere not configured, nothing to process",
        processed: 0,
        succeeded: 0,
        failed: 0,
      });
    }

    // Process the retry queue
    const result = await processRetryQueue();

    return NextResponse.json({
      success: true,
      message: `Processed ${result.processed} items`,
      ...result,
    });
  } catch (error) {
    console.error("Vincere sync retry cron error:", error);
    return NextResponse.json(
      { error: "Failed to process retry queue", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}

/**
 * GET /api/cron/vincere-sync-retry
 * Health check endpoint to verify the cron job is accessible
 */
export async function GET() {
  return NextResponse.json({
    status: "ok",
    endpoint: "vincere-sync-retry",
    method: "POST",
    description: "Processes failed Vincere sync operations from the queue",
  });
}
