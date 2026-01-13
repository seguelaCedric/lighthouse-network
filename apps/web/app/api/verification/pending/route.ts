import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * GET /api/verification/pending
 * Get all pending verifications for recruiters
 * Returns pending ID documents, references, and voice verifications
 * Note: Document approval is handled separately on the agency side
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

    // Check if user is a recruiter
    const { data: userData } = await supabase
      .from("users")
      .select("id, user_type, role")
      .eq("auth_id", user.id)
      .single();

    if (!userData || userData.user_type !== "recruiter") {
      return NextResponse.json(
        { error: "Only recruiters can access verification queue" },
        { status: 403 }
      );
    }

    // Get query params for filtering
    const searchParams = request.nextUrl.searchParams;
    const type = searchParams.get("type"); // "id" | "reference" | "voice" | null (all)

    const results: {
      id_documents: Array<{
        id: string;
        candidate_id: string;
        candidate_name: string;
        candidate_position: string;
        candidate_years_experience: number | null;
        candidate_photo_url: string | null;
        candidate_verification_tier: string;
        id_document_url: string;
        uploaded_at: string;
      }>;
      references: Array<{
        id: string;
        candidate_id: string;
        candidate_name: string;
        candidate_position: string;
        referee_name: string;
        referee_position: string | null;
        referee_company: string | null;
        referee_phone: string | null;
        referee_email: string | null;
        relationship: string | null;
        dates_worked: string | null;
        created_at: string;
      }>;
      voice: Array<{
        id: string;
        candidate_name: string;
        candidate_position: string;
        candidate_phone: string | null;
        requested_at: string;
      }>;
    } = {
      id_documents: [],
      references: [],
      voice: [],
    };

    // Fetch pending ID documents
    if (!type || type === "id") {
      const { data: pendingIDs, error: idError } = await supabase
        .from("candidates")
        .select(
          `
          id,
          first_name,
          last_name,
          primary_position,
          years_experience,
          photo_url,
          verification_tier,
          id_document_url,
          verification_updated_at
        `
        )
        .not("id_document_url", "is", null)
        .is("id_verified_at", null)
        .is("deleted_at", null)
        .order("verification_updated_at", { ascending: false });

      if (!idError && pendingIDs) {
        results.id_documents = pendingIDs.map((c) => ({
          id: c.id,
          candidate_id: c.id,
          candidate_name: `${c.first_name || ""} ${c.last_name || ""}`.trim(),
          candidate_position: c.primary_position || "Unknown Position",
          candidate_years_experience: c.years_experience,
          candidate_photo_url: c.photo_url,
          candidate_verification_tier: c.verification_tier || "unverified",
          id_document_url: c.id_document_url!,
          uploaded_at: c.verification_updated_at || new Date().toISOString(),
        }));
      }
    }

    // Fetch pending references
    if (!type || type === "reference") {
      const { data: pendingRefs, error: refError } = await supabase
        .from("candidate_references")
        .select(
          `
          id,
          candidate_id,
          referee_name,
          referee_position,
          company_vessel,
          referee_phone,
          referee_email,
          relationship,
          dates_worked,
          created_at,
          candidates!inner (
            first_name,
            last_name,
            primary_position,
            deleted_at
          )
        `
        )
        .eq("status", "pending")
        .eq("is_verified", false)
        .is("candidates.deleted_at", null)
        .order("created_at", { ascending: false });

      if (!refError && pendingRefs) {
        results.references = pendingRefs.map((r) => {
          const candidate = r.candidates as unknown as {
            first_name: string | null;
            last_name: string | null;
            primary_position: string | null;
          };
          return {
            id: r.id,
            candidate_id: r.candidate_id,
            candidate_name:
              `${candidate?.first_name || ""} ${candidate?.last_name || ""}`.trim(),
            candidate_position: candidate?.primary_position || "Unknown Position",
            referee_name: r.referee_name,
            referee_position: r.referee_position,
            referee_company: r.company_vessel,
            referee_phone: r.referee_phone,
            referee_email: r.referee_email,
            relationship: r.relationship,
            dates_worked: r.dates_worked,
            created_at: r.created_at,
          };
        });
      }
    }

    // Fetch candidates awaiting voice verification
    // These are candidates who have:
    // - ID verified
    // - 2+ verified references
    // - But no voice verification
    if (!type || type === "voice") {
      const { data: pendingVoice, error: voiceError } = await supabase
        .from("candidates")
        .select(
          `
          id,
          first_name,
          last_name,
          primary_position,
          phone,
          verification_updated_at,
          candidate_references!inner (
            status,
            is_verified
          )
        `
        )
        .not("id_verified_at", "is", null)
        .is("voice_verified_at", null)
        .is("deleted_at", null);

      if (!voiceError && pendingVoice) {
        // Filter to only those with 2+ verified references
        const eligibleForVoice = pendingVoice.filter((c) => {
          const refs = c.candidate_references as Array<{
            status: string;
            is_verified: boolean;
          }>;
          const verifiedCount = refs.filter(
            (r) => r.status === "verified" || r.is_verified === true
          ).length;
          return verifiedCount >= 2;
        });

        results.voice = eligibleForVoice.map((c) => ({
          id: c.id,
          candidate_name: `${c.first_name || ""} ${c.last_name || ""}`.trim(),
          candidate_position: c.primary_position || "Unknown Position",
          candidate_phone: c.phone,
          requested_at: c.verification_updated_at || new Date().toISOString(),
        }));
      }
    }

    return NextResponse.json({
      data: results,
      counts: {
        id_documents: results.id_documents.length,
        references: results.references.length,
        voice: results.voice.length,
        total:
          results.id_documents.length +
          results.references.length +
          results.voice.length,
      },
    });
  } catch (error) {
    console.error("Error fetching pending verifications:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
