import { NextRequest, NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/server";
import {
  getVincereClient,
  getCandidateWithCustomFields,
  mapVincereToCandidate,
  getCandidateFiles,
  getCandidateCVFile,
} from "@/lib/vincere";
import { processCandidateCV, processCandidatePhoto } from "@/lib/services/cv-processor";

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

    // Vincere webhook format:
    // { entityType: "CANDIDATE", actionType: "UPDATE", entityId: 88836, tenant: "...", timestamp: ..., userId: ..., data: null }
    const entityType = parsedBody.entityType || parsedBody.entity_type;
    const actionType = parsedBody.actionType || parsedBody.action_type;
    const candidateId = parsedBody.entityId || parsedBody.candidateId || parsedBody.candidate_id || parsedBody.data?.id || parsedBody.id;

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

    // Find existing candidate by vincere_id (include cv_document_id to check for CV changes)
    const { data: existingCandidate } = await supabase
      .from("candidates")
      .select("id, cv_document_id")
      .eq("vincere_id", mappedCandidate.vincere_id)
      .single();

    // Prepare candidate data for database - PATCH mode: only include non-null values
    // This preserves existing data in the database for fields Vincere doesn't have
    const allFields = {
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

    // Filter out null/undefined values - only update fields that have actual data from Vincere
    const candidateUpdate: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(allFields)) {
      if (value !== null && value !== undefined) {
        candidateUpdate[key] = value;
      }
    }

    // Always include vincere_id and last_synced_at for tracking
    candidateUpdate.vincere_id = mappedCandidate.vincere_id;
    candidateUpdate.last_synced_at = mappedCandidate.last_synced_at;

    if (existingCandidate) {
      // Update existing candidate
      const { error: updateError } = await supabase
        .from("candidates")
        .update(candidateUpdate)
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

      // Check if CV has changed in Vincere and re-process if needed
      await checkAndUpdateCVIfChanged(
        vincereCandidateId,
        existingCandidate.id,
        existingCandidate.cv_document_id,
        LIGHTHOUSE_ORG_ID,
        vincere,
        supabase
      );
    } else {
      // Create new candidate
      // Note: For new candidates, we may need to set default organization
      const { data: newCandidate, error: insertError } = await supabase
        .from("candidates")
        .insert(candidateUpdate)
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

      // Process CV and avatar for new candidates
      // This pulls the latest CV, extracts text, generates embedding, and saves avatar
      await processNewCandidateDocuments(
        vincereCandidateId,
        newCandidate.id,
        LIGHTHOUSE_ORG_ID,
        vincere,
        supabase
      );
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
 * Check if CV has changed in Vincere and re-process if needed
 *
 * Compares the vincere_file_id stored in our document metadata with the
 * current CV file ID from Vincere. If different, deletes old document
 * data and re-processes the new CV.
 */
async function checkAndUpdateCVIfChanged(
  vincereId: number,
  candidateId: string,
  currentCvDocumentId: string | null,
  organizationId: string,
  vincereClient: ReturnType<typeof getVincereClient>,
  supabase: ReturnType<typeof createServiceRoleClient>
) {
  try {
    // Get the current CV file from Vincere (original_cv = true)
    const vincereCvFile = await getCandidateCVFile(vincereId, vincereClient);

    if (!vincereCvFile) {
      console.log(
        `[VincereCandidateWebhook] No CV found in Vincere for candidate ${vincereId}`
      );
      return;
    }

    // If we don't have a CV document yet, process it
    if (!currentCvDocumentId) {
      console.log(
        `[VincereCandidateWebhook] Candidate ${vincereId} has no CV in our system, processing...`
      );
      await processCandidateCV(
        vincereId,
        candidateId,
        organizationId,
        vincereClient,
        supabase
      );
      return;
    }

    // Get our current document to check vincere_file_id
    const { data: currentDoc } = await supabase
      .from("documents")
      .select("id, metadata")
      .eq("id", currentCvDocumentId)
      .single();

    if (!currentDoc) {
      console.log(
        `[VincereCandidateWebhook] CV document ${currentCvDocumentId} not found, re-processing...`
      );
      await processCandidateCV(
        vincereId,
        candidateId,
        organizationId,
        vincereClient,
        supabase
      );
      return;
    }

    // Compare vincere_file_id to detect changes
    const storedVincereFileId = (currentDoc.metadata as Record<string, unknown>)?.vincere_file_id;

    if (storedVincereFileId === vincereCvFile.id) {
      console.log(
        `[VincereCandidateWebhook] CV unchanged for candidate ${vincereId} (vincere_file_id: ${vincereCvFile.id})`
      );
      return;
    }

    // CV has changed! Delete old document and re-process
    console.log(
      `[VincereCandidateWebhook] CV changed for candidate ${vincereId}: old vincere_file_id=${storedVincereFileId}, new=${vincereCvFile.id}`
    );

    // Delete old document record (this also clears embedding/extracted_text)
    const { error: deleteError } = await supabase
      .from("documents")
      .delete()
      .eq("id", currentCvDocumentId);

    if (deleteError) {
      console.error(
        `[VincereCandidateWebhook] Failed to delete old CV document: ${deleteError.message}`
      );
      // Continue anyway - we'll create a new document
    } else {
      console.log(
        `[VincereCandidateWebhook] Deleted old CV document ${currentCvDocumentId}`
      );
    }

    // Clear CV reference on candidate before re-processing
    await supabase
      .from("candidates")
      .update({ cv_document_id: null, cv_url: null })
      .eq("id", candidateId);

    // Process new CV
    console.log(`[VincereCandidateWebhook] Processing new CV...`);
    const cvResult = await processCandidateCV(
      vincereId,
      candidateId,
      organizationId,
      vincereClient,
      supabase
    );

    if (cvResult.success) {
      console.log(
        `[VincereCandidateWebhook] ✅ New CV processed: ${cvResult.extractedTextLength} chars extracted, embedding: ${cvResult.embeddingGenerated ? "yes" : "no"}`
      );
    } else {
      console.log(
        `[VincereCandidateWebhook] ⚠️ New CV processing failed: ${cvResult.error}`
      );
    }
  } catch (error) {
    console.error(
      `[VincereCandidateWebhook] Error checking/updating CV:`,
      error instanceof Error ? error.message : error
    );
  }
}

/**
 * Process CV and avatar for new candidates
 *
 * This function:
 * 1. Downloads and processes the candidate's CV (extract text, generate embedding)
 * 2. Downloads and saves the candidate's avatar photo
 *
 * Processing is done asynchronously but we await to ensure completion
 * before the webhook response. Errors are logged but don't fail the webhook.
 */
async function processNewCandidateDocuments(
  vincereId: number,
  candidateId: string,
  organizationId: string,
  vincereClient: ReturnType<typeof getVincereClient>,
  supabase: ReturnType<typeof createServiceRoleClient>
) {
  console.log(
    `[VincereCandidateWebhook] Processing documents for new candidate ${vincereId}...`
  );

  // Process CV (download, upload to storage, extract text, generate embedding)
  try {
    console.log(`[VincereCandidateWebhook] Processing CV...`);
    const cvResult = await processCandidateCV(
      vincereId,
      candidateId,
      organizationId,
      vincereClient,
      supabase
    );

    if (cvResult.success) {
      console.log(
        `[VincereCandidateWebhook] ✅ CV processed: ${cvResult.extractedTextLength} chars extracted, embedding: ${cvResult.embeddingGenerated ? "yes" : "no"}`
      );
    } else {
      console.log(
        `[VincereCandidateWebhook] ⚠️ CV processing: ${cvResult.error || "No CV found"}`
      );
    }
  } catch (cvError) {
    console.error(
      `[VincereCandidateWebhook] CV processing error:`,
      cvError instanceof Error ? cvError.message : cvError
    );
  }

  // Process avatar photo (download, upload to storage, update candidate record)
  try {
    console.log(`[VincereCandidateWebhook] Processing avatar photo...`);
    const photoResult = await processCandidatePhoto(
      vincereId,
      candidateId,
      organizationId,
      vincereClient,
      supabase
    );

    if (photoResult.success) {
      console.log(
        `[VincereCandidateWebhook] ✅ Avatar photo saved: ${photoResult.photoUrl}`
      );
    } else {
      console.log(
        `[VincereCandidateWebhook] ⚠️ Avatar processing: ${photoResult.error || "No avatar found"}`
      );
    }
  } catch (photoError) {
    console.error(
      `[VincereCandidateWebhook] Avatar processing error:`,
      photoError instanceof Error ? photoError.message : photoError
    );
  }

  console.log(
    `[VincereCandidateWebhook] Document processing complete for candidate ${vincereId}`
  );
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

