/**
 * Job Alerts API
 *
 * POST /api/crew/job-alerts
 * Triggers job alerts for a newly posted job.
 * Should be called when a job is published or becomes visible to candidates.
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { processJobAlerts } from "@/lib/services/job-alert-service";
import { createErrorLogger, extractRequestContext } from "@/lib/error-logger";

export async function POST(request: NextRequest) {
  const logger = createErrorLogger(extractRequestContext(request));

  try {
    const supabase = await createClient();

    // Verify the request is authenticated (admin or service role)
    const {
      data: { user },
    } = await supabase.auth.getUser();

    // Check if the user is an organization member (admin check)
    let isAuthorized = false;
    if (user) {
      const { data: userData } = await supabase
        .from("users")
        .select("id, organization_id, role")
        .eq("auth_id", user.id)
        .maybeSingle();

      // Allow organization members to trigger job alerts
      if (userData?.organization_id) {
        isAuthorized = true;
      }
    }

    // Also allow service-key authenticated requests
    const authHeader = request.headers.get("authorization");
    if (authHeader?.startsWith("Bearer ") && process.env.SERVICE_ROLE_KEY) {
      const token = authHeader.slice(7);
      if (token === process.env.SERVICE_ROLE_KEY) {
        isAuthorized = true;
      }
    }

    if (!isAuthorized) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Get job ID from request body
    const body = await request.json();
    const { jobId } = body;

    if (!jobId) {
      return NextResponse.json(
        { error: "Missing jobId parameter" },
        { status: 400 }
      );
    }

    // Verify the job exists and is in a published state
    const { data: job, error: jobError } = await supabase
      .from("jobs")
      .select("id, title, status, visibility")
      .eq("id", jobId)
      .single();

    if (jobError || !job) {
      return NextResponse.json(
        { error: "Job not found" },
        { status: 404 }
      );
    }

    // Only process alerts for open/public jobs
    if (job.status !== "open") {
      return NextResponse.json(
        { error: "Job is not in open status", status: job.status },
        { status: 400 }
      );
    }

    // Process job alerts
    const result = await processJobAlerts(jobId);

    return NextResponse.json({
      success: true,
      jobId: job.id,
      jobTitle: job.title,
      ...result,
    });
  } catch (error) {
    await logger.error(error instanceof Error ? error : new Error(String(error)), {
      statusCode: 500,
      metadata: { route: "crew/job-alerts", operation: "process" },
    });
    console.error("Error processing job alerts:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * GET /api/crew/job-alerts
 * Get the job alert settings for the current candidate
 */
export async function GET(request: NextRequest) {
  const logger = createErrorLogger(extractRequestContext(request));

  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Get user record
    const { data: userData } = await supabase
      .from("users")
      .select("id")
      .eq("auth_id", user.id)
      .maybeSingle();

    let candidate = null;

    if (userData) {
      const { data: candidateByUserId } = await supabase
        .from("candidates")
        .select("id, job_alerts_enabled")
        .eq("user_id", userData.id)
        .maybeSingle();
      candidate = candidateByUserId;
    }

    if (!candidate && user.email) {
      const { data: candidateByEmail } = await supabase
        .from("candidates")
        .select("id, job_alerts_enabled")
        .eq("email", user.email)
        .maybeSingle();
      candidate = candidateByEmail;
    }

    if (!candidate) {
      return NextResponse.json(
        { error: "Candidate not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      jobAlertsEnabled: candidate.job_alerts_enabled ?? true,
    });
  } catch (error) {
    await logger.error(error instanceof Error ? error : new Error(String(error)), {
      statusCode: 500,
      metadata: { route: "crew/job-alerts", operation: "get" },
    });
    console.error("Error getting job alert settings:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/crew/job-alerts
 * Update job alert settings for the current candidate
 */
export async function PATCH(request: NextRequest) {
  const logger = createErrorLogger(extractRequestContext(request));

  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { jobAlertsEnabled } = body;

    if (typeof jobAlertsEnabled !== "boolean") {
      return NextResponse.json(
        { error: "Invalid jobAlertsEnabled value" },
        { status: 400 }
      );
    }

    // Get user record
    const { data: userData } = await supabase
      .from("users")
      .select("id")
      .eq("auth_id", user.id)
      .maybeSingle();

    let candidateId = null;

    if (userData) {
      const { data: candidateByUserId } = await supabase
        .from("candidates")
        .select("id")
        .eq("user_id", userData.id)
        .maybeSingle();
      candidateId = candidateByUserId?.id;
    }

    if (!candidateId && user.email) {
      const { data: candidateByEmail } = await supabase
        .from("candidates")
        .select("id")
        .eq("email", user.email)
        .maybeSingle();
      candidateId = candidateByEmail?.id;
    }

    if (!candidateId) {
      return NextResponse.json(
        { error: "Candidate not found" },
        { status: 404 }
      );
    }

    // Update the setting
    const { error } = await supabase
      .from("candidates")
      .update({ job_alerts_enabled: jobAlertsEnabled })
      .eq("id", candidateId);

    if (error) {
      console.error("Error updating job alert settings:", error);
      return NextResponse.json(
        { error: "Failed to update settings" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      jobAlertsEnabled,
    });
  } catch (error) {
    await logger.error(error instanceof Error ? error : new Error(String(error)), {
      statusCode: 500,
      metadata: { route: "crew/job-alerts", operation: "update" },
    });
    console.error("Error updating job alert settings:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
