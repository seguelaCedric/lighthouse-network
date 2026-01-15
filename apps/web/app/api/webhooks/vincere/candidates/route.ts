import { NextRequest, NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/server";
import {
  getVincereClient,
  getCandidateWithCustomFields,
  mapVincereToCandidate,
} from "@/lib/vincere";

/**
 * Vincere webhook event payload for candidates
 */
interface VincereCandidateWebhookEvent {
  entity_type: string; // "CANDIDATE"
  action_type: string; // "CREATE", "UPDATE", "ARCHIVE", "DELETE"
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
    console.error("[VincereCandidateWebhook] SNS SubscriptionConfirmation missing SubscribeURL");
    return false;
  }

  console.log("[VincereCandidateWebhook] Confirming SNS subscription...");
  try {
    const response = await fetch(subscribeUrl);
    if (response.ok) {
      console.log("[VincereCandidateWebhook] ✅ SNS subscription confirmed successfully!");
      return true;
    } else {
      console.error("[VincereCandidateWebhook] Failed to confirm SNS subscription:", response.status);
      return false;
    }
  } catch (error) {
    console.error("[VincereCandidateWebhook] Error confirming SNS subscription:", error);
    return false;
  }
}

/**
 * POST /api/webhooks/vincere/candidates
 *
 * Receives webhook events from Vincere for candidate updates.
 * Also handles AWS SNS subscription confirmation (required for Vincere webhooks).
 *
 * Expected events:
 * - CANDIDATE.CREATE: New candidate created in Vincere
 * - CANDIDATE.UPDATE: Candidate updated in Vincere
 * - CANDIDATE.ARCHIVE: Candidate archived in Vincere
 * - CANDIDATE.DELETE: Candidate deleted in Vincere
 */
export async function POST(request: NextRequest) {
  try {
    // Check for AWS SNS message type header (case-insensitive)
    const snsMessageType = request.headers.get("x-amz-sns-message-type");

    // Parse body once
    const body = await request.json();

    // Log incoming request for debugging
    console.log("[VincereCandidateWebhook] Received POST request");
    console.log("[VincereCandidateWebhook] SNS header:", snsMessageType);
    console.log("[VincereCandidateWebhook] Body Type field:", body.Type);

    // Handle SNS Subscription Confirmation - check both header AND body Type field
    // AWS SNS sends Type in the body as well as the header
    if (snsMessageType === "SubscriptionConfirmation" || body.Type === "SubscriptionConfirmation") {
      console.log("[VincereCandidateWebhook] Received SNS SubscriptionConfirmation");
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
      console.log("[VincereCandidateWebhook] Parsing SNS Notification message");
      try {
        parsedBody = JSON.parse(body.Message);
      } catch {
        console.error("[VincereCandidateWebhook] Failed to parse SNS Message as JSON");
      }
    }

    // Verify webhook secret token (prevents unauthorized access)
    const webhookSecret = process.env.VINCERE_WEBHOOK_SECRET;
    if (webhookSecret) {
      const authHeader = request.headers.get("x-webhook-secret");
      const urlSecret = request.nextUrl.searchParams.get("secret");

      if (authHeader !== webhookSecret && urlSecret !== webhookSecret) {
        console.error("[VincereCandidateWebhook] Invalid or missing webhook secret");
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

    // Log the full parsed body for debugging - log keys and full structure
    console.log("[VincereCandidateWebhook] Payload keys:", Object.keys(parsedBody));
    console.log("[VincereCandidateWebhook] Full payload:", JSON.stringify(parsedBody));

    // Vincere webhook format uses entityType, actionType, and candidateId (not entity_type/action_type/data.id)
    // Also handle SNS-wrapped messages where the format might differ
    const entityType = parsedBody.entityType || parsedBody.entity_type;
    const actionType = parsedBody.actionType || parsedBody.action_type;
    const candidateId = parsedBody.candidateId || parsedBody.candidate_id || parsedBody.data?.id || parsedBody.id;

    console.log("[VincereCandidateWebhook] Extracted - entityType:", entityType, "actionType:", actionType, "candidateId:", candidateId);

    // If we can't extract a candidate ID, return success but log the payload for investigation
    if (!candidateId) {
      console.log("[VincereCandidateWebhook] No candidateId found in payload, acknowledging receipt");
      return NextResponse.json({
        received: true,
        message: "Webhook received but no candidateId found",
        payload_keys: Object.keys(parsedBody)
      });
    }

    // Create a normalized event object
    const event = {
      entity_type: entityType || "CANDIDATE",
      action_type: actionType || "UPDATE",
      data: { id: typeof candidateId === 'number' ? candidateId : parseInt(candidateId, 10) }
    };

    console.log(
      `[VincereCandidateWebhook] Received event: ${event.entity_type}.${event.action_type} for candidate ${event.data.id}`
    );

    // Get Supabase client (service role for webhook processing - no auth context needed)
    const supabase = createServiceRoleClient();

    // Process based on entity type and action type
    if (event.entity_type === "CANDIDATE") {
      switch (event.action_type) {
        case "CREATE":
        case "UPDATE":
          await handleCandidateCreatedOrUpdated(event.data.id, supabase);
          break;

        case "ARCHIVE":
          await handleCandidateArchived(event.data.id, supabase);
          break;

        case "DELETE":
          await handleCandidateDeleted(event.data.id, supabase);
          break;

        default:
          console.log(
            `[VincereCandidateWebhook] Unhandled action type: ${event.action_type} for ${event.entity_type}`
          );
          return NextResponse.json({
            received: true,
            event: `${event.entity_type}.${event.action_type}`,
          });
      }
    } else {
      console.log(
        `[VincereCandidateWebhook] Unhandled entity type: ${event.entity_type}`
      );
      return NextResponse.json({
        received: true,
        event: `${event.entity_type}.${event.action_type}`,
      });
    }

    return NextResponse.json({
      success: true,
      event: `${event.entity_type}.${event.action_type}`,
    });
  } catch (error) {
    console.error("[VincereCandidateWebhook] Error processing webhook:", error);
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
 * Handle candidate created or updated event
 */
async function handleCandidateCreatedOrUpdated(
  vincereCandidateId: number,
  supabase: ReturnType<typeof createServiceRoleClient>
) {
  try {
    const vincere = getVincereClient();

    // Fetch full candidate data from Vincere
    const candidateData = await getCandidateWithCustomFields(
      vincereCandidateId,
      vincere
    );

    if (!candidateData) {
      console.error(
        `[VincereCandidateWebhook] Candidate ${vincereCandidateId} not found in Vincere`
      );
      return;
    }

    // Map Vincere candidate to our format
    const mappedCandidate = mapVincereToCandidate(
      candidateData.candidate,
      candidateData.customFields
    );

    // Lighthouse Careers organization ID (from seed data)
    const LIGHTHOUSE_ORG_ID = "00000000-0000-0000-0000-000000000001";

    // Find existing candidate by vincere_id
    const { data: existingCandidate } = await supabase
      .from("candidates")
      .select("id")
      .eq("vincere_id", mappedCandidate.vincere_id)
      .single();

    // Prepare candidate data for database
    // Note: Candidates are NOT directly linked to organizations via organization_id
    // They are linked via candidate_agency_relationships table
    // Include ALL fields from the mapping to ensure complete sync
    const candidateInsert = {
      // Core identity
      vincere_id: mappedCandidate.vincere_id,
      first_name: mappedCandidate.first_name,
      last_name: mappedCandidate.last_name,
      email: mappedCandidate.email,
      phone: mappedCandidate.phone,
      whatsapp: mappedCandidate.whatsapp,

      // Demographics
      date_of_birth: mappedCandidate.date_of_birth,
      gender: mappedCandidate.gender,
      nationality: mappedCandidate.nationality,
      second_nationality: mappedCandidate.second_nationality,
      current_location: mappedCandidate.current_location,

      // Professional
      primary_position: mappedCandidate.primary_position,
      position_category: mappedCandidate.position_category,
      profile_summary: mappedCandidate.profile_summary,

      // Preferences
      preferred_yacht_types: mappedCandidate.preferred_yacht_types,
      preferred_yacht_size_min: mappedCandidate.preferred_yacht_size_min,
      preferred_yacht_size_max: mappedCandidate.preferred_yacht_size_max,
      preferred_contract_types: mappedCandidate.preferred_contract_types,
      preferred_regions: mappedCandidate.preferred_regions,

      // Availability & Compensation
      available_from: mappedCandidate.available_from,
      availability_status: mappedCandidate.availability_status,
      desired_salary_min: mappedCandidate.desired_salary_min,
      desired_salary_max: mappedCandidate.desired_salary_max,
      salary_currency: mappedCandidate.salary_currency,

      // Visas
      has_schengen: mappedCandidate.has_schengen,
      has_b1b2: mappedCandidate.has_b1b2,

      // Certifications
      has_stcw: mappedCandidate.has_stcw,
      has_eng1: mappedCandidate.has_eng1,
      highest_license: mappedCandidate.highest_license,
      second_license: mappedCandidate.second_license,

      // Personal
      is_smoker: mappedCandidate.is_smoker,
      has_visible_tattoos: mappedCandidate.has_visible_tattoos,
      tattoo_description: mappedCandidate.tattoo_description,
      marital_status: mappedCandidate.marital_status,

      // Couple info
      is_couple: mappedCandidate.is_couple,
      partner_name: mappedCandidate.partner_name,
      partner_position: mappedCandidate.partner_position,
      couple_position: mappedCandidate.couple_position,

      // Sync metadata
      verification_tier: mappedCandidate.verification_tier,
      last_synced_at: mappedCandidate.last_synced_at,
    };

    if (existingCandidate) {
      // Update existing candidate
      const { error: updateError } = await supabase
        .from("candidates")
        .update(candidateInsert)
        .eq("id", existingCandidate.id);

      if (updateError) {
        console.error(
          `[VincereCandidateWebhook] Failed to update candidate ${vincereCandidateId}:`,
          updateError.message
        );
        throw updateError;
      }

      console.log(
        `[VincereCandidateWebhook] Successfully updated candidate ${vincereCandidateId} (DB ID: ${existingCandidate.id})`
      );

      // Ensure agency relationship exists with Lighthouse Careers
      const { error: relError } = await supabase
        .from("candidate_agency_relationships")
        .upsert(
          {
            candidate_id: existingCandidate.id,
            agency_id: LIGHTHOUSE_ORG_ID,
            relationship_type: "vincere_sync",
            is_exclusive: false,
            agency_candidate_id: vincereCandidateId.toString(),
          },
          {
            onConflict: "candidate_id,agency_id",
          }
        );

      if (relError) {
        console.error(
          `[VincereCandidateWebhook] Failed to ensure agency relationship: ${relError.message}`
        );
      }
    } else {
      // Create new candidate
      // Note: For new candidates, we may need to set default organization
      const { data: newCandidate, error: insertError } = await supabase
        .from("candidates")
        .insert(candidateInsert)
        .select("id")
        .single();

      if (insertError) {
        console.error(
          `[VincereCandidateWebhook] Failed to create candidate ${vincereCandidateId}:`,
          insertError.message
        );
        throw insertError;
      }

      console.log(
        `[VincereCandidateWebhook] Successfully created candidate ${vincereCandidateId} (DB ID: ${newCandidate.id})`
      );

      // Create agency relationship with Lighthouse Careers
      const { error: relError } = await supabase
        .from("candidate_agency_relationships")
        .upsert(
          {
            candidate_id: newCandidate.id,
            agency_id: LIGHTHOUSE_ORG_ID,
            relationship_type: "vincere_sync",
            is_exclusive: false,
            agency_candidate_id: vincereCandidateId.toString(),
          },
          {
            onConflict: "candidate_id,agency_id",
          }
        );

      if (relError) {
        console.error(
          `[VincereCandidateWebhook] Failed to create agency relationship: ${relError.message}`
        );
      } else {
        console.log(
          `[VincereCandidateWebhook] Created agency relationship with Lighthouse Careers`
        );
      }
    }
  } catch (error) {
    console.error(
      `[VincereCandidateWebhook] Error handling candidate created/updated for ${vincereCandidateId}:`,
      error
    );
    throw error;
  }
}

/**
 * Handle candidate archived event
 */
async function handleCandidateArchived(
  vincereCandidateId: number,
  supabase: ReturnType<typeof createServiceRoleClient>
) {
  try {
    // Find candidate by vincere_id
    const { data: candidate } = await supabase
      .from("candidates")
      .select("id")
      .eq("vincere_id", vincereCandidateId.toString())
      .single();

    if (!candidate) {
      console.log(
        `[VincereCandidateWebhook] Candidate ${vincereCandidateId} not found in database`
      );
      return;
    }

    // Update candidate status to indicate archived
    // You might want to add an archived_at timestamp or status field
    const { error: updateError } = await supabase
      .from("candidates")
      .update({ updated_at: new Date().toISOString() })
      .eq("id", candidate.id);

    if (updateError) {
      console.error(
        `[VincereCandidateWebhook] Failed to archive candidate ${vincereCandidateId}:`,
        updateError.message
      );
      throw updateError;
    }

    console.log(
      `[VincereCandidateWebhook] Successfully archived candidate ${vincereCandidateId} (DB ID: ${candidate.id})`
    );
  } catch (error) {
    console.error(
      `[VincereCandidateWebhook] Error handling candidate archived for ${vincereCandidateId}:`,
      error
    );
    throw error;
  }
}

/**
 * Handle candidate deleted event
 */
async function handleCandidateDeleted(
  vincereCandidateId: number,
  supabase: ReturnType<typeof createServiceRoleClient>
) {
  try {
    // Find candidate by vincere_id
    const { data: candidate } = await supabase
      .from("candidates")
      .select("id")
      .eq("vincere_id", vincereCandidateId.toString())
      .single();

    if (!candidate) {
      console.log(
        `[VincereCandidateWebhook] Candidate ${vincereCandidateId} not found in database, may have already been deleted`
      );
      return;
    }

    // Soft delete: remove vincere_id to break the link, or mark as deleted
    // Hard delete is not recommended as it may break relationships
    const { error: updateError } = await supabase
      .from("candidates")
      .update({ vincere_id: null, updated_at: new Date().toISOString() })
      .eq("id", candidate.id);

    if (updateError) {
      console.error(
        `[VincereCandidateWebhook] Failed to delete candidate ${vincereCandidateId}:`,
        updateError.message
      );
      throw updateError;
    }

    console.log(
      `[VincereCandidateWebhook] Successfully unlinked candidate ${vincereCandidateId} (DB ID: ${candidate.id})`
    );
  } catch (error) {
    console.error(
      `[VincereCandidateWebhook] Error handling candidate deleted for ${vincereCandidateId}:`,
      error
    );
    throw error;
  }
}

/**
 * GET /api/webhooks/vincere/candidates
 * 
 * Health check endpoint for webhook URL verification
 */
export async function GET() {
  return NextResponse.json({
    status: "ok",
    service: "vincere-candidate-webhook-receiver",
    timestamp: new Date().toISOString(),
  });
}

