import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
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
 * POST /api/webhooks/vincere/candidates
 * 
 * Receives webhook events from Vincere for candidate updates.
 * 
 * Expected events:
 * - CANDIDATE.CREATE: New candidate created in Vincere
 * - CANDIDATE.UPDATE: Candidate updated in Vincere
 * - CANDIDATE.ARCHIVE: Candidate archived in Vincere
 * - CANDIDATE.DELETE: Candidate deleted in Vincere
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
    const event: VincereCandidateWebhookEvent = body;

    if (!event || !event.entity_type || !event.action_type || !event.data) {
      return NextResponse.json(
        { error: "Invalid webhook payload" },
        { status: 400 }
      );
    }

    console.log(
      `[VincereCandidateWebhook] Received event: ${event.entity_type}.${event.action_type} for candidate ${event.data.id}`
    );

    // Get Supabase client (service role for webhook processing)
    const supabase = await createClient();

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
  supabase: Awaited<ReturnType<typeof createClient>>
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
    const candidateInsert = {
      vincere_id: mappedCandidate.vincere_id,
      first_name: mappedCandidate.first_name,
      last_name: mappedCandidate.last_name,
      email: mappedCandidate.email,
      phone: mappedCandidate.phone,
      whatsapp: mappedCandidate.whatsapp,
      date_of_birth: mappedCandidate.date_of_birth,
      gender: mappedCandidate.gender,
      nationality: mappedCandidate.nationality,
      current_location: mappedCandidate.current_location,
      primary_position: mappedCandidate.primary_position,
      position_category: mappedCandidate.position_category,
      profile_summary: mappedCandidate.profile_summary,
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
  supabase: Awaited<ReturnType<typeof createClient>>
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
  supabase: Awaited<ReturnType<typeof createClient>>
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

