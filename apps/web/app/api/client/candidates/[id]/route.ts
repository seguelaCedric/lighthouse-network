import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getClientSessionFromCookie } from "@/lib/auth/client-session";

/**
 * GET /api/client/candidates/[id]
 * Get full candidate profile for a shortlisted candidate
 * Privacy: Full details only available after interview request
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getClientSessionFromCookie();

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: candidateId } = await params;
    const supabase = await createClient();

    // Verify the client has access to this candidate through a submission
    const { data: submission, error: submissionError } = await supabase
      .from("submissions")
      .select(`
        id,
        job_id,
        status,
        match_score,
        match_reasoning,
        cover_note,
        submitted_at,
        jobs!inner (
          id,
          title,
          client_id
        )
      `)
      .eq("candidate_id", candidateId)
      .eq("jobs.client_id", session.clientId)
      .in("status", ["shortlisted", "interviewing", "offer", "placed"])
      .order("submitted_at", { ascending: false })
      .limit(1)
      .single();

    if (submissionError || !submission) {
      return NextResponse.json(
        { error: "You don't have access to this candidate" },
        { status: 403 }
      );
    }

    // Check if full profile access is allowed (after interview request)
    const hasFullAccess = ["interviewing", "offer", "placed"].includes(submission.status);

    // Get candidate profile
    const { data: candidate, error: candidateError } = await supabase
      .from("candidates")
      .select(`
        id,
        first_name,
        last_name,
        email,
        phone,
        whatsapp,
        primary_position,
        secondary_positions,
        years_experience,
        current_location,
        current_country,
        nationality,
        date_of_birth,
        profile_summary,
        verification_tier,
        available_from,
        availability_status,
        min_salary,
        max_salary,
        salary_currency,
        salary_period,
        preferred_yacht_types,
        preferred_regions,
        yacht_size_min,
        yacht_size_max,
        has_stcw,
        has_eng1,
        highest_license,
        languages,
        smoker,
        visible_tattoos,
        profile_photo_url
      `)
      .eq("id", candidateId)
      .single();

    if (candidateError || !candidate) {
      return NextResponse.json(
        { error: "Candidate not found" },
        { status: 404 }
      );
    }

    // Get candidate certifications
    const { data: certifications } = await supabase
      .from("certifications")
      .select(`
        id,
        name,
        certificate_type,
        issuing_authority,
        issue_date,
        expiry_date,
        is_verified
      `)
      .eq("candidate_id", candidateId)
      .order("expiry_date", { ascending: true });

    // Get candidate work history
    const { data: workHistory } = await supabase
      .from("work_history")
      .select(`
        id,
        position,
        vessel_name,
        vessel_type,
        vessel_size_meters,
        start_date,
        end_date,
        is_current,
        description,
        captain_name
      `)
      .eq("candidate_id", candidateId)
      .order("start_date", { ascending: false });

    // Log profile view
    await supabase.from("activity_logs").insert({
      activity_type: "profile_viewed",
      entity_type: "candidate",
      entity_id: candidateId,
      metadata: {
        viewed_by_client: session.clientId,
        submission_id: submission.id,
        full_access: hasFullAccess,
      },
    });

    // Build response based on access level
    const job = submission.jobs as Record<string, unknown>;

    const profileData = {
      // Basic info (always visible)
      id: candidate.id,
      firstName: candidate.first_name,
      lastInitial: candidate.last_name ? candidate.last_name.charAt(0) : "",
      primaryPosition: candidate.primary_position,
      secondaryPositions: candidate.secondary_positions,
      yearsExperience: candidate.years_experience,
      currentLocation: candidate.current_location,
      currentCountry: candidate.current_country,
      verificationTier: candidate.verification_tier,
      profileSummary: candidate.profile_summary,
      profilePhotoUrl: candidate.profile_photo_url,

      // Availability
      availableFrom: candidate.available_from,
      availabilityStatus: candidate.availability_status,

      // Preferences
      preferredYachtTypes: candidate.preferred_yacht_types,
      preferredRegions: candidate.preferred_regions,
      yachtSizeMin: candidate.yacht_size_min,
      yachtSizeMax: candidate.yacht_size_max,

      // Certifications (basic info)
      hasStcw: candidate.has_stcw,
      hasEng1: candidate.has_eng1,
      highestLicense: candidate.highest_license,
      languages: candidate.languages,

      // Personal (non-sensitive)
      smoker: candidate.smoker,
      visibleTattoos: candidate.visible_tattoos,

      // Match info from submission
      matchScore: submission.match_score,
      matchReasoning: submission.match_reasoning,
      recruiterNote: submission.cover_note,
      submittedAt: submission.submitted_at,

      // Related job
      job: {
        id: job.id,
        title: job.title,
      },

      // Detailed info
      certifications: (certifications || []).map((cert) => ({
        id: cert.id,
        name: cert.name,
        type: cert.certificate_type,
        issuingAuthority: cert.issuing_authority,
        issueDate: cert.issue_date,
        expiryDate: cert.expiry_date,
        isVerified: cert.is_verified,
      })),

      workHistory: (workHistory || []).map((job) => ({
        id: job.id,
        position: job.position,
        vesselName: job.vessel_name,
        vesselType: job.vessel_type,
        vesselSize: job.vessel_size_meters,
        startDate: job.start_date,
        endDate: job.end_date,
        isCurrent: job.is_current,
        description: job.description,
        // Hide captain name for privacy unless full access
        captainName: hasFullAccess ? job.captain_name : null,
      })),

      // Full access only fields
      ...(hasFullAccess && {
        lastName: candidate.last_name,
        email: candidate.email,
        phone: candidate.phone,
        whatsapp: candidate.whatsapp,
        nationality: candidate.nationality,
        dateOfBirth: candidate.date_of_birth,
        salaryExpectations: {
          min: candidate.min_salary,
          max: candidate.max_salary,
          currency: candidate.salary_currency,
          period: candidate.salary_period,
        },
      }),

      // Access level indicator
      accessLevel: hasFullAccess ? "full" : "limited",
    };

    return NextResponse.json({ data: profileData });
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
