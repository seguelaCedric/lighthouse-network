import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { convertToJobSchema } from "@/lib/validations/brief";
import type { BriefParsedData, Job, PositionCategory, ContractType } from "../../../../../../../packages/database/types";

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * Convert BriefParsedData to job creation data
 */
function briefToJobData(
  parsedData: BriefParsedData,
  overrides: {
    title?: string;
    client_id?: string | null;
    status?: "draft" | "open";
    visibility?: "private" | "network" | "public";
  }
): Partial<Job> {
  // Map position category
  const categoryMap: Record<string, PositionCategory> = {
    deck: "deck",
    interior: "interior",
    galley: "galley",
    engineering: "engineering",
    captain: "captain",
    other: "other",
  };

  // Map contract type
  const contractMap: Record<string, ContractType> = {
    permanent: "permanent",
    rotational: "rotational",
    seasonal: "seasonal",
    temporary: "temporary",
  };

  return {
    // Title with fallback
    title: overrides.title || parsedData.position || "Untitled Position",

    // Position
    position_category: categoryMap[parsedData.positionCategory] || "other",

    // Vessel
    vessel_name: parsedData.vessel.name || null,
    vessel_type: parsedData.vessel.type || null,
    vessel_size_meters: parsedData.vessel.sizeMeters,

    // Contract
    contract_type: parsedData.contract.type
      ? contractMap[parsedData.contract.type] || null
      : null,
    start_date: parsedData.contract.startDate,
    rotation_schedule: parsedData.contract.rotation,

    // Location
    primary_region:
      parsedData.location.cruisingAreas.length > 0
        ? parsedData.location.cruisingAreas[0]
        : parsedData.location.base,
    itinerary: parsedData.location.cruisingAreas.join(", ") || null,

    // Compensation
    salary_min: parsedData.compensation.salaryMin,
    salary_max: parsedData.compensation.salaryMax,
    salary_currency: parsedData.compensation.currency || "EUR",
    salary_period: "monthly",

    // Requirements
    requirements: {
      experience_years_min: parsedData.requirements.minExperience || undefined,
      certifications_required:
        parsedData.requirements.certifications.length > 0
          ? parsedData.requirements.certifications
          : undefined,
      languages_required:
        parsedData.requirements.languages.length > 0
          ? parsedData.requirements.languages
          : undefined,
    },
    requirements_text: parsedData.requirements.other.join("\n") || null,

    // Status/Visibility
    status: overrides.status || "draft",
    visibility: overrides.visibility || "private",

    // Client
    client_id: overrides.client_id,
  };
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user's organization
    const { data: userData } = await supabase
      .from("users")
      .select("id, organization_id")
      .eq("auth_id", user.id)
      .single();

    if (!userData?.organization_id) {
      return NextResponse.json(
        { error: "User must belong to an organization" },
        { status: 403 }
      );
    }

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id)) {
      return NextResponse.json(
        { error: "Invalid brief ID format" },
        { status: 400 }
      );
    }

    // Parse request body (optional overrides)
    let body: unknown = {};
    try {
      const text = await request.text();
      if (text) {
        body = JSON.parse(text);
      }
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    // Validate input
    const parseResult = convertToJobSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parseResult.error.flatten() },
        { status: 400 }
      );
    }

    const overrides = parseResult.data;

    // Fetch brief
    const { data: brief, error: briefError } = await supabase
      .from("briefs")
      .select("*")
      .eq("id", id)
      .single();

    if (briefError || !brief) {
      return NextResponse.json({ error: "Brief not found" }, { status: 404 });
    }

    // Check if already converted
    if (brief.status === "converted") {
      return NextResponse.json(
        {
          error: "Brief has already been converted",
          existing_job_id: brief.converted_to_job_id,
        },
        { status: 400 }
      );
    }

    // Check if brief has been parsed
    if (!brief.parsed_data) {
      return NextResponse.json(
        { error: "Brief must be parsed before conversion. Call /parse first." },
        { status: 400 }
      );
    }

    const parsedData = brief.parsed_data as BriefParsedData;

    // Convert brief to job data
    const jobData = briefToJobData(parsedData, {
      ...overrides,
      client_id: overrides.client_id ?? brief.client_id,
    });

    // Create job
    const { data: job, error: jobError } = await supabase
      .from("jobs")
      .insert({
        ...jobData,
        created_by_agency_id: userData.organization_id,
        created_by_user_id: userData.id,
      })
      .select()
      .single();

    if (jobError) {
      console.error("Database error creating job:", jobError);
      return NextResponse.json(
        { error: "Failed to create job" },
        { status: 500 }
      );
    }

    // Update brief status to converted
    const { error: updateError } = await supabase
      .from("briefs")
      .update({
        status: "converted",
        converted_to_job_id: job.id,
        converted_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", id);

    if (updateError) {
      console.error("Database error updating brief:", updateError);
      // Job was created but brief wasn't updated - not critical
    }

    return NextResponse.json(
      {
        data: {
          job,
          brief_id: id,
          message: "Brief successfully converted to job",
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
