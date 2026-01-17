import { NextRequest, NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/server";
import {
  getVincereClient,
  getJobWithCustomFields,
  mapVincereToJob,
  getPlacementWithContext,
  mapPlacementStatus,
  getPlacementFee,
  getJobOwners,
  extractOwnerDataForDb,
} from "@/lib/vincere";
import { scheduleJobAlert } from "@/lib/services/job-alert-service";

/**
 * Vincere user ID to name mapping for job owners and placement placed_by
 */
const VINCERE_USER_NAMES: Record<number, string> = {
  28955: 'Milica Seguela',
  28957: 'Catherine Coulibaly',
  28959: 'Admin',
  28960: 'Kiera Cavanagh',
  28961: 'Francesca Zanfagna',
  28963: 'Kate Burns',
  28964: 'Debbie Blazy',
  28965: 'Ivana Novakovic',
  28966: 'Tracy Gueli',
  28967: 'Sonia Szostok',
  28968: 'Laura Cubie',
  28969: 'Kaoutar Zahouane',
  28970: 'Charles Cartledge',
  28971: 'Pamela Moyes',
  28973: 'Marc Stevens',
  28974: 'Shelley Viljoen',
  28975: 'Ornela Grmusa',
  28976: 'Phil Richards',
  28977: 'India Thomson-Virtue',
  28978: 'Joaneen Botha',
  29011: 'Laura Hayes',
  29044: 'Britt McBride',
  29077: 'Tiffany Hutton',
  29110: 'Waldi Coetzee',
  29143: 'Svetlana Blake',
  [-1]: 'Company Admin',
  [-10]: 'System Admin',
};

function getVincereUserName(userId: number): string {
  return VINCERE_USER_NAMES[userId] || `Unknown (${userId})`;
}

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
 * Handle AWS SNS subscription confirmation
 * Vincere webhooks use AWS SNS, which requires confirming the subscription
 * by fetching the SubscribeURL sent in the confirmation message.
 */
async function handleSNSSubscriptionConfirmation(body: Record<string, unknown>): Promise<boolean> {
  const subscribeUrl = body.SubscribeURL as string;
  if (!subscribeUrl) {
    console.error("[VincereWebhook] SNS SubscriptionConfirmation missing SubscribeURL");
    return false;
  }

  console.log("[VincereWebhook] Confirming SNS subscription...");
  try {
    const response = await fetch(subscribeUrl);
    if (response.ok) {
      console.log("[VincereWebhook] ✅ SNS subscription confirmed successfully!");
      return true;
    } else {
      console.error("[VincereWebhook] Failed to confirm SNS subscription:", response.status);
      return false;
    }
  } catch (error) {
    console.error("[VincereWebhook] Error confirming SNS subscription:", error);
    return false;
  }
}

/**
 * POST /api/webhooks/vincere
 *
 * Receives webhook events from Vincere for job updates.
 * Also handles AWS SNS subscription confirmation (required for Vincere webhooks).
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
    // Check for AWS SNS message type header (case-insensitive)
    const snsMessageType = request.headers.get("x-amz-sns-message-type");

    // Parse body once
    const body = await request.json();

    // Log incoming request for debugging
    console.log("[VincereWebhook] Received POST request");
    console.log("[VincereWebhook] SNS header:", snsMessageType);
    console.log("[VincereWebhook] Body Type field:", body.Type);

    // Handle SNS Subscription Confirmation - check both header AND body Type field
    // AWS SNS sends Type in the body as well as the header
    if (snsMessageType === "SubscriptionConfirmation" || body.Type === "SubscriptionConfirmation") {
      console.log("[VincereWebhook] Received SNS SubscriptionConfirmation");
      const confirmed = await handleSNSSubscriptionConfirmation(body);
      return NextResponse.json({
        success: confirmed,
        message: confirmed ? "Subscription confirmed" : "Failed to confirm subscription"
      });
    }

    // Handle SNS Notification (actual webhook events)
    // SNS wraps the actual message in a "Message" field as a JSON string
    let parsedBody = body;
    if ((snsMessageType === "Notification" || body.Type === "Notification") && typeof body.Message === "string") {
      console.log("[VincereWebhook] Parsing SNS Notification message");
      try {
        parsedBody = JSON.parse(body.Message);
      } catch {
        console.error("[VincereWebhook] Failed to parse SNS Message as JSON");
      }
    }

    // Verify webhook secret token (prevents unauthorized access)
    const webhookSecret = process.env.VINCERE_WEBHOOK_SECRET;
    if (webhookSecret) {
      const authHeader = request.headers.get("x-webhook-secret");
      const urlSecret = request.nextUrl.searchParams.get("secret");

      if (authHeader !== webhookSecret && urlSecret !== webhookSecret) {
        console.error("[VincereWebhook] Invalid or missing webhook secret");
        return NextResponse.json(
          { error: "Unauthorized" },
          { status: 401 }
        );
      }
    }

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

    // Log the full parsed body for debugging
    console.log("[VincereWebhook] Payload keys:", Object.keys(parsedBody));
    console.log("[VincereWebhook] Full payload:", JSON.stringify(parsedBody));

    // Vincere webhook format:
    // { entityType: "JOB", actionType: "UPDATE", entityId: 12345, tenant: "...", timestamp: ..., userId: ..., data: null }
    const entityType = parsedBody.entityType || parsedBody.entity_type;
    const actionType = parsedBody.actionType || parsedBody.action_type;
    const jobId = parsedBody.entityId || parsedBody.jobId || parsedBody.job_id || parsedBody.data?.id || parsedBody.id;

    console.log("[VincereWebhook] Extracted - entityType:", entityType, "actionType:", actionType, "jobId:", jobId);

    // If we can't extract a job ID, return success but log the payload for investigation
    if (!jobId) {
      console.log("[VincereWebhook] No jobId found in payload, acknowledging receipt");
      return NextResponse.json({
        received: true,
        message: "Webhook received but no jobId found",
        payload_keys: Object.keys(parsedBody)
      });
    }

    // Create a normalized event object
    const event = {
      entity_type: entityType || "JOB",
      action_type: actionType || "UPDATE",
      data: { id: typeof jobId === 'number' ? jobId : parseInt(jobId, 10) }
    };

    console.log(`[VincereWebhook] Received event: ${event.entity_type}.${event.action_type} for ID ${event.data.id}`);

    // Get Supabase client (service role for webhook processing - no auth context needed)
    const supabase = createServiceRoleClient();

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
    } else if (event.entity_type === "PLACEMENT") {
      switch (event.action_type) {
        case "CREATE":
        case "UPDATE":
          await handlePlacementCreatedOrUpdated(event.data.id, supabase);
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
  supabase: ReturnType<typeof createServiceRoleClient>
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

    // Fetch job owners from Vincere (primary = BD, secondary = assigned recruiter)
    const owners = await getJobOwners(vincereJobId, vincere);
    const ownerData = extractOwnerDataForDb(owners);

    if (owners.primary) {
      console.log(`[VincereWebhook] Job ${vincereJobId} - Primary Owner: ${owners.primary.full_name}`);
    }
    if (owners.secondary) {
      console.log(`[VincereWebhook] Job ${vincereJobId} - Assigned Recruiter: ${owners.secondary.full_name} (${owners.secondary.email})`);
    }

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
      // Job owners from Vincere
      ...ownerData,
      // Preserve existing relationships if updating
      ...(existingJob && {
        client_id: existingJob.client_id,
        created_by_user_id: existingJob.created_by_user_id,
      }),
    };

    let jobDbId: string;

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

      jobDbId = existingJob.id;
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

      jobDbId = newJob.id;
      console.log(
        `[VincereWebhook] Successfully created job ${vincereJobId} (DB ID: ${newJob.id})`
      );
    }

    // Schedule job alerts with debounce
    // This ensures we wait for all custom field updates from Vincere before sending alerts
    // If the job is updated again before the delay expires, the timer resets
    if (mappedJob.status === "open" && mappedJob.is_public) {
      scheduleJobAlert(jobDbId).catch((err) => {
        console.error(
          `[VincereWebhook] Error scheduling job alert for ${vincereJobId}:`,
          err
        );
      });
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
  supabase: ReturnType<typeof createServiceRoleClient>
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
 * Handle placement created or updated event
 */
async function handlePlacementCreatedOrUpdated(
  vincerePlacementId: number,
  supabase: ReturnType<typeof createServiceRoleClient>
) {
  try {
    // Fetch placement with context (includes candidate_id from job)
    const placementData = await getPlacementWithContext(vincerePlacementId);

    if (!placementData) {
      console.error(`[VincereWebhook] Placement ${vincerePlacementId} not found in Vincere`);
      return;
    }

    // Map IDs from Vincere to our database
    // 1. Find job by external_id
    const { data: job } = await supabase
      .from("jobs")
      .select("id, client_id")
      .eq("external_id", placementData.position_id.toString())
      .eq("external_source", "vincere")
      .single();

    if (!job) {
      console.error(
        `[VincereWebhook] Job ${placementData.position_id} not found for placement ${vincerePlacementId}`
      );
      return;
    }

    // 2. Find candidate by vincere_id
    const { data: candidate } = await supabase
      .from("candidates")
      .select("id")
      .eq("vincere_id", placementData._candidate_id.toString())
      .single();

    if (!candidate) {
      console.error(
        `[VincereWebhook] Candidate ${placementData._candidate_id} not found for placement ${vincerePlacementId}`
      );
      return;
    }

    // 3. Get client_id from job (should already be linked)
    if (!job.client_id) {
      console.warn(
        `[VincereWebhook] Job ${placementData.position_id} has no client_id - placement may be incomplete`
      );
    }

    // Lighthouse Careers organization ID
    const LIGHTHOUSE_ORG_ID = "00000000-0000-0000-0000-000000000001";

    // Check if placement already exists
    const { data: existingPlacement } = await supabase
      .from("placements")
      .select("id")
      .eq("vincere_id", vincerePlacementId)
      .single();

    // Calculate fee
    const totalFee = getPlacementFee(placementData);

    // Get placed_by info from the application (not the placement)
    // placement.placed_by is just the admin who recorded it
    // application.application_user_id is the actual consultant who made the placement
    let placedById: number | null = null;
    let placedByName: string | null = null;

    if (placementData.application_id) {
      try {
        const vincereClient = (await import("@/lib/vincere")).getVincereClient();
        const application = await vincereClient.get<{ application_user_id?: number }>(
          `/application/${placementData.application_id}`
        );
        if (application?.application_user_id) {
          placedById = application.application_user_id;
          placedByName = getVincereUserName(placedById);
        }
      } catch (err) {
        console.warn(
          `[VincereWebhook] Could not fetch application ${placementData.application_id} for placed_by info`
        );
      }
    }

    // Prepare placement data
    const placementRecord = {
      vincere_id: vincerePlacementId,
      job_id: job.id,
      candidate_id: candidate.id,
      client_id: job.client_id,
      placing_agency_id: LIGHTHOUSE_ORG_ID,
      start_date: placementData.start_date ? placementData.start_date.split("T")[0] : null,
      end_date: placementData.end_date ? placementData.end_date.split("T")[0] : null,
      salary_agreed: placementData.annual_salary ? Math.round(placementData.annual_salary) : null,
      salary_currency: placementData.currency?.toUpperCase() || "EUR",
      total_fee: totalFee,
      fee_currency: placementData.currency?.toUpperCase() || "EUR",
      placing_agency_fee: totalFee,
      status: mapPlacementStatus(placementData.placement_status),
      // Track who made the placement
      vincere_placed_by_id: placedById || null,
      placed_by_name: placedByName,
    };

    if (existingPlacement) {
      // Update existing placement
      const { error: updateError } = await supabase
        .from("placements")
        .update(placementRecord)
        .eq("id", existingPlacement.id);

      if (updateError) {
        console.error(
          `[VincereWebhook] Failed to update placement ${vincerePlacementId}:`,
          updateError.message
        );
        throw updateError;
      }

      console.log(
        `[VincereWebhook] Successfully updated placement ${vincerePlacementId} (DB ID: ${existingPlacement.id})`
      );
    } else {
      // Create new placement
      const { data: newPlacement, error: insertError } = await supabase
        .from("placements")
        .insert({
          ...placementRecord,
          created_at: placementData.insert_timestamp || new Date().toISOString(),
        })
        .select("id")
        .single();

      if (insertError) {
        console.error(
          `[VincereWebhook] Failed to create placement ${vincerePlacementId}:`,
          insertError.message
        );
        throw insertError;
      }

      console.log(
        `[VincereWebhook] Successfully created placement ${vincerePlacementId} (DB ID: ${newPlacement.id})`
      );
    }

    // Update client totals
    if (job.client_id) {
      await updateClientTotals(job.client_id, supabase);
    }
  } catch (error) {
    console.error(
      `[VincereWebhook] Error handling placement created/updated for ${vincerePlacementId}:`,
      error
    );
    throw error;
  }
}

/**
 * Update client total_revenue and total_placements
 */
async function updateClientTotals(
  clientId: string,
  supabase: ReturnType<typeof createServiceRoleClient>
) {
  try {
    // Get placement totals for this client
    const { data: stats, error: statsError } = await supabase
      .from("placements")
      .select("total_fee")
      .eq("client_id", clientId);

    if (statsError) {
      console.error(`[VincereWebhook] Failed to get placement stats for client ${clientId}:`, statsError.message);
      return;
    }

    const totalPlacements = stats?.length || 0;
    const totalRevenue = stats?.reduce((sum, p) => sum + (parseFloat(p.total_fee) || 0), 0) || 0;

    // Update client
    const { error: updateError } = await supabase
      .from("clients")
      .update({
        total_placements: totalPlacements,
        total_revenue: totalRevenue,
      })
      .eq("id", clientId);

    if (updateError) {
      console.error(`[VincereWebhook] Failed to update client totals for ${clientId}:`, updateError.message);
    } else {
      console.log(`[VincereWebhook] Updated client ${clientId} totals: ${totalPlacements} placements, EUR ${totalRevenue}`);
    }
  } catch (error) {
    console.error(`[VincereWebhook] Error updating client totals for ${clientId}:`, error);
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

