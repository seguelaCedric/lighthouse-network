import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createCertificationSchema } from "@/lib/validations/candidate";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: candidateId } = await params;
    const supabase = await createClient();

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(candidateId)) {
      return NextResponse.json(
        { error: "Invalid candidate ID format" },
        { status: 400 }
      );
    }

    // Check if candidate exists
    const { data: candidate, error: candidateError } = await supabase
      .from("candidates")
      .select("id")
      .eq("id", candidateId)
      .is("deleted_at", null)
      .single();

    if (candidateError || !candidate) {
      return NextResponse.json(
        { error: "Candidate not found" },
        { status: 404 }
      );
    }

    // Fetch certifications
    const { data, error } = await supabase
      .from("candidate_certifications")
      .select("id, certification_type, custom_name, expiry_date, has_certification, created_at")
      .eq("candidate_id", candidateId)
      .eq("has_certification", true)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Database error:", error);
      return NextResponse.json(
        { error: "Failed to fetch certifications" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      data: (data ?? []).map((cert) => ({
        id: cert.id,
        name: cert.custom_name || cert.certification_type,
        issuing_authority: null,
        certificate_number: null,
        issue_date: null,
        expiry_date: cert.expiry_date,
        is_verified: false,
        document_url: null,
      })),
    });
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: candidateId } = await params;
    const supabase = await createClient();

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(candidateId)) {
      return NextResponse.json(
        { error: "Invalid candidate ID format" },
        { status: 400 }
      );
    }

    // Check if candidate exists
    const { data: candidate, error: candidateError } = await supabase
      .from("candidates")
      .select("id")
      .eq("id", candidateId)
      .is("deleted_at", null)
      .single();

    if (candidateError || !candidate) {
      return NextResponse.json(
        { error: "Candidate not found" },
        { status: 404 }
      );
    }

    // Parse request body
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: "Invalid JSON body" },
        { status: 400 }
      );
    }

    // Validate input
    const parseResult = createCertificationSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parseResult.error.flatten() },
        { status: 400 }
      );
    }

    const certificationData = {
      candidate_id: candidateId,
      certification_type: parseResult.data.type || "other",
      custom_name: parseResult.data.name,
      expiry_date: parseResult.data.expiry_date || null,
      has_certification: true,
    };

    // Insert certification
    const { data, error } = await supabase
      .from("candidate_certifications")
      .insert(certificationData)
      .select("id, certification_type, custom_name, expiry_date, has_certification, created_at")
      .single();

    if (error) {
      console.error("Database error:", error);
      return NextResponse.json(
        { error: "Failed to create certification" },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        data: {
          id: data.id,
          name: data.custom_name || data.certification_type,
          issuing_authority: null,
          certificate_number: null,
          issue_date: null,
          expiry_date: data.expiry_date,
          is_verified: false,
          document_url: null,
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
