import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  getVincereClient,
  getJobWithCustomFields,
  mapVincereToJob,
} from "@/lib/vincere";

/**
 * Vincere webhook event payload
 * Vincere sends events with entity_type and action_type
 */
interface VincereWebhookEvent {
  entity_type: string; // e.g., "JOB", "CANDIDATE"
  action_type: string; // e.g., "CREATE", "UPDATE", "DELETE"
  timestamp?: string;
  data: {
    id: number;
    [key: string]: unknown;
  };
}

/**
 * POST /api/webhooks/vincere
 * 
 * Receives webhook events from Vincere for job updates.
 * 
 * Expected events:
 * - job.created: New job created in Vincere
 * - job.updated: Job updated in Vincere
 * - job.deleted: Job deleted in Vincere
 * 
 * Note: This endpoint should be publicly accessible (no auth required)
 * but should verify webhook signature if Vincere provides one.
 */
export async function POST(request: NextRequest) {
  try {
    // Check if Vincere is configured
    if (
      !process.env.VINCERE_API_URL ||
      !process.env.VINCERE_CLIENT_ID ||
      !process.env.VINCERE_API_KEY
    ) {
      console.error("Vincere integration is not configured");
      return NextResponse.json(
        { error: "Vincere integration not configured" },
        { status: 500 }
      );
    }

    // Parse webhook payload
    const body = await request.json();
    const event: VincereWebhookEvent = body;

    if (!event || !event.entity_type || !event.action_type || !event.data) {
      return NextResponse.json(
        { error: "Invalid webhook payload" },
        { status: 400 }
      );
    }

    console.log(`[VincereWebhook] Received event: ${event.entity_type}.${event.action_type} for ID ${event.data.id}`);

    // Get Supabase client (service role for webhook processing)
    const supabase = await createClient();

    // Process based on entity type and action type
    if (event.entity_type === "JOB") {
      switch (event.action_type) {
        case "CREATE":
        case "UPDATE":
          await handleJobCreatedOrUpdated(event.data.id, supabase);
          break;

        case "DELETE":
          // DELETE is not supported for JOB, but handle gracefully if received
          console.log(`[VincereWebhook] DELETE action received for JOB ${event.data.id} - marking as cancelled`);
          await handleJobDeleted(event.data.id, supabase);
          break;

        default:
          console.log(`[VincereWebhook] Unhandled action type: ${event.action_type} for ${event.entity_type}`);
          return NextResponse.json({ received: true, event: `${event.entity_type}.${event.action_type}` });
      }
    } else {
      console.log(`[VincereWebhook] Unhandled entity type: ${event.entity_type}`);
      // Return 200 to acknowledge receipt even if we don't handle it
      return NextResponse.json({ received: true, event: `${event.entity_type}.${event.action_type}` });
    }

    return NextResponse.json({ success: true, event: `${event.entity_type}.${event.action_type}` });
  } catch (error) {
    console.error("[VincereWebhook] Error processing webhook:", error);
    return NextResponse.json(
      {
        error: "Failed to process webhook",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

/**
 * Handle job created or updated event
 */
async function handleJobCreatedOrUpdated(
  vincereJobId: number,
  supabase: Awaited<ReturnType<typeof createClient>>
) {
  try {
    const vincere = getVincereClient();

    // Fetch full job data from Vincere
    const jobData = await getJobWithCustomFields(vincereJobId, vincere);

    if (!jobData) {
      console.error(`[VincereWebhook] Job ${vincereJobId} not found in Vincere`);
      return;
    }

    // Map Vincere job to our format
    const mappedJob = mapVincereToJob(jobData.job, jobData.customFields);

    // Find existing job by external_id
    const { data: existingJob } = await supabase
      .from("jobs")
      .select("id, client_id, created_by_agency_id, created_by_user_id")
      .eq("external_id", mappedJob.external_id)
      .eq("external_source", "vincere")
      .single();

    // Lighthouse Careers organization ID (from seed data)
    const LIGHTHOUSE_ORG_ID = "00000000-0000-0000-0000-000000000001";

    // Prepare job data for database
    const jobInsert = {
      external_id: mappedJob.external_id,
      external_source: mappedJob.external_source,
      title: mappedJob.title,
      vessel_name: mappedJob.vessel_name,
      vessel_type: mappedJob.vessel_type,
      vessel_size_meters: mappedJob.vessel_size_meters,
      salary_min: mappedJob.salary_min,
      salary_max: mappedJob.salary_max,
      salary_currency: mappedJob.salary_currency,
      salary_period: mappedJob.salary_period,
      start_date: mappedJob.start_date,
      primary_region: mappedJob.primary_region,
      requirements_text: mappedJob.requirements_text,
      status: mappedJob.status,
      visibility: mappedJob.visibility,
      is_public: mappedJob.is_public,
      is_urgent: mappedJob.is_urgent,
      fee_type: mappedJob.fee_type,
      requirements: mappedJob.requirements,
      published_at: mappedJob.published_at,
      holiday_days: mappedJob.holiday_days,
      itinerary: mappedJob.itinerary,
      holiday_package: mappedJob.holiday_package,
      rotation_schedule: mappedJob.rotation_schedule,
      contract_type: mappedJob.contract_type,
      program: mappedJob.program,
      public_description: mappedJob.public_description,
      // Always set Lighthouse Careers as the creating agency for Vincere jobs
      created_by_agency_id: LIGHTHOUSE_ORG_ID,
      // Preserve existing relationships if updating
      ...(existingJob && {
        client_id: existingJob.client_id,
        created_by_user_id: existingJob.created_by_user_id,
      }),
    };

    if (existingJob) {
      // Update existing job
      const { error: updateError } = await supabase
        .from("jobs")
        .update(jobInsert)
        .eq("id", existingJob.id);

      if (updateError) {
        console.error(
          `[VincereWebhook] Failed to update job ${vincereJobId}:`,
          updateError.message
        );
        throw updateError;
      }

      console.log(
        `[VincereWebhook] Successfully updated job ${vincereJobId} (DB ID: ${existingJob.id})`
      );
    } else {
      // Create new job
      // Note: For new jobs, we may need to set default organization
      // This should ideally be configured per webhook or organization
      const { data: newJob, error: insertError } = await supabase
        .from("jobs")
        .insert(jobInsert)
        .select("id")
        .single();

      if (insertError) {
        console.error(
          `[VincereWebhook] Failed to create job ${vincereJobId}:`,
          insertError.message
        );
        throw insertError;
      }

      console.log(
        `[VincereWebhook] Successfully created job ${vincereJobId} (DB ID: ${newJob.id})`
      );
    }
  } catch (error) {
    console.error(
      `[VincereWebhook] Error handling job created/updated for ${vincereJobId}:`,
      error
    );
    throw error;
  }
}

/**
 * Handle job deleted event
 */
async function handleJobDeleted(
  vincereJobId: number,
  supabase: Awaited<ReturnType<typeof createClient>>
) {
  try {
    // Find job by external_id
    const { data: job } = await supabase
      .from("jobs")
      .select("id")
      .eq("external_id", vincereJobId.toString())
      .eq("external_source", "vincere")
      .single();

    if (!job) {
      console.log(
        `[VincereWebhook] Job ${vincereJobId} not found in database, may have already been deleted`
      );
      return;
    }

    // Update job status to cancelled instead of deleting
    // This preserves historical data and submissions
    const { error: updateError } = await supabase
      .from("jobs")
      .update({ status: "cancelled", visibility: "private", is_public: false })
      .eq("id", job.id);

    if (updateError) {
      console.error(
        `[VincereWebhook] Failed to cancel job ${vincereJobId}:`,
        updateError.message
      );
      throw updateError;
    }

    console.log(
      `[VincereWebhook] Successfully cancelled job ${vincereJobId} (DB ID: ${job.id})`
    );
  } catch (error) {
    console.error(
      `[VincereWebhook] Error handling job deleted for ${vincereJobId}:`,
      error
    );
    throw error;
  }
}

/**
 * GET /api/webhooks/vincere
 * 
 * Health check endpoint for webhook URL verification
 */
export async function GET() {
  return NextResponse.json({
    status: "ok",
    service: "vincere-webhook-receiver",
    timestamp: new Date().toISOString(),
  });
}

