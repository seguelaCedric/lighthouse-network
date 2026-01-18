import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { z } from "zod";
import { createErrorLogger, extractRequestContext } from "@/lib/error-logger";

interface RouteParams {
  params: Promise<{ id: string }>;
}

const createNoteSchema = z.object({
  content: z.string().min(1, "Note content is required"),
  type: z.enum(["general", "interview", "reference", "internal"]).optional().default("general"),
});

export async function GET(request: NextRequest, { params }: RouteParams) {
  const logger = createErrorLogger(extractRequestContext(request));

  try {
    const { id: candidateId } = await params;
    const supabase = await createClient();

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Validate UUID format
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(candidateId)) {
      return NextResponse.json(
        { error: "Invalid candidate ID format" },
        { status: 400 }
      );
    }

    // Fetch notes for candidate
    const { data, error } = await supabase
      .from("candidate_notes")
      .select(`
        *,
        created_by_user:users!candidate_notes_created_by_fkey (
          id,
          first_name,
          last_name
        )
      `)
      .eq("candidate_id", candidateId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Database error:", error);
      return NextResponse.json(
        { error: "Failed to fetch notes" },
        { status: 500 }
      );
    }

    return NextResponse.json({ data: data || [] });
  } catch (error) {
    await logger.error(error instanceof Error ? error : new Error(String(error)), {
      statusCode: 500,
      metadata: { route: "candidates/[id]/notes", operation: "list" },
    });
    console.error("Unexpected error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  const logger = createErrorLogger(extractRequestContext(request));

  try {
    const { id: candidateId } = await params;
    const supabase = await createClient();

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user's organization and ID
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
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(candidateId)) {
      return NextResponse.json(
        { error: "Invalid candidate ID format" },
        { status: 400 }
      );
    }

    // Check candidate exists
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
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    // Validate input
    const parseResult = createNoteSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parseResult.error.flatten() },
        { status: 400 }
      );
    }

    const noteData = parseResult.data;

    // Create note
    const { data, error } = await supabase
      .from("candidate_notes")
      .insert({
        candidate_id: candidateId,
        content: noteData.content,
        type: noteData.type,
        created_by: userData.id,
        organization_id: userData.organization_id,
      })
      .select(`
        *,
        created_by_user:users!candidate_notes_created_by_fkey (
          id,
          first_name,
          last_name
        )
      `)
      .single();

    if (error) {
      console.error("Database error:", error);
      return NextResponse.json(
        { error: "Failed to create note" },
        { status: 500 }
      );
    }

    return NextResponse.json({ data }, { status: 201 });
  } catch (error) {
    await logger.error(error instanceof Error ? error : new Error(String(error)), {
      statusCode: 500,
      metadata: { route: "candidates/[id]/notes", operation: "create" },
    });
    console.error("Unexpected error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
