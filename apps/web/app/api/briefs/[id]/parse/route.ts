import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { parseRequestSchema } from "@/lib/validations/brief";
import type { BriefParsedData } from "@lighthouse/database";
import { parseBriefFromModule as parseBrief, BriefParseError } from "@lighthouse/ai";

interface RouteParams {
  params: Promise<{ id: string }>;
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

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id)) {
      return NextResponse.json(
        { error: "Invalid brief ID format" },
        { status: 400 }
      );
    }

    // Parse request body (optional client context)
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
    const parseResult = parseRequestSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parseResult.error.flatten() },
        { status: 400 }
      );
    }

    const { client_context } = parseResult.data;

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
        { error: "Brief has already been converted to a job" },
        { status: 400 }
      );
    }

    // Update status to parsing
    await supabase
      .from("briefs")
      .update({ status: "parsing", updated_at: new Date().toISOString() })
      .eq("id", id);

    let parsedData: BriefParsedData;
    let confidenceScore: number;

    try {
      // Parse brief using GPT-4o
      parsedData = await parseBrief(brief.raw_content, client_context);
      confidenceScore = parsedData.confidence;
    } catch (parseError) {
      console.error("Parsing error:", parseError);

      // Handle specific error types
      if (parseError instanceof BriefParseError) {
        // Update status to needs_clarification on error
        await supabase
          .from("briefs")
          .update({
            status: "needs_clarification",
            updated_at: new Date().toISOString(),
          })
          .eq("id", id);

        const statusCode = parseError.code === "RATE_LIMITED" ? 429 : 500;
        return NextResponse.json(
          { error: parseError.message, code: parseError.code },
          { status: statusCode }
        );
      }

      // Fallback: Basic extraction when AI fails unexpectedly
      console.warn("AI parsing failed, using basic extraction");
      parsedData = extractBasicData(brief.raw_content);
      confidenceScore = 30; // Low confidence for basic extraction (0-100 scale)
    }

    // Determine final status based on confidence and ambiguities
    // Confidence is 0-100, threshold is 50
    let finalStatus: "parsed" | "needs_clarification" = "parsed";
    if (confidenceScore < 50 || parsedData.ambiguities.length > 2) {
      finalStatus = "needs_clarification";
    }

    // Update brief with parsed data
    const { data: updatedBrief, error: updateError } = await supabase
      .from("briefs")
      .update({
        status: finalStatus,
        parsed_data: parsedData,
        parsing_confidence: confidenceScore,
        parsing_ambiguities: parsedData.ambiguities.map((a) => a.issue),
        parsed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single();

    if (updateError) {
      console.error("Database error:", updateError);
      return NextResponse.json(
        { error: "Failed to update brief" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      data: updatedBrief,
      parsed_data: parsedData,
      confidence_score: confidenceScore,
      status: finalStatus,
    });
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * Basic extraction fallback when AI is not available
 */
function extractBasicData(rawContent: string): BriefParsedData {
  const content = rawContent.toLowerCase();

  // Basic position detection
  const positions = [
    "captain",
    "chief officer",
    "chief engineer",
    "chief stewardess",
    "chief stew",
    "chef",
    "stewardess",
    "deckhand",
    "engineer",
    "bosun",
  ];

  let position = "Unknown Position";
  let positionCategory: BriefParsedData["positionCategory"] = "other";

  for (const pos of positions) {
    if (content.includes(pos)) {
      position = pos.charAt(0).toUpperCase() + pos.slice(1);
      if (["captain", "chief officer", "bosun", "deckhand"].includes(pos)) {
        positionCategory = "deck";
      } else if (["chief stewardess", "chief stew", "stewardess"].includes(pos)) {
        positionCategory = "interior";
      } else if (["chief engineer", "engineer"].includes(pos)) {
        positionCategory = "engineering";
      } else if (["chef"].includes(pos)) {
        positionCategory = "galley";
      }
      break;
    }
  }

  // Basic vessel size detection
  const sizeMatch = content.match(/(\d+)\s*m(?:eter)?s?/);
  const vesselSize = sizeMatch ? parseInt(sizeMatch[1], 10) : null;

  // Basic salary detection
  const salaryMatch = content.match(/€?\s*(\d+(?:,\d{3})*(?:\.\d{2})?)\s*(?:k|eur|euro)?/i);
  const salary = salaryMatch ? parseInt(salaryMatch[1].replace(/,/g, ""), 10) : null;

  return {
    position,
    positionCategory,
    vessel: {
      name: null,
      type: null,
      sizeMeters: vesselSize,
    },
    contract: {
      type: null,
      rotation: null,
      startDate: null,
    },
    compensation: {
      salaryMin: salary,
      salaryMax: salary,
      currency: "EUR",
    },
    requirements: {
      minExperience: null,
      minYachtSize: null,
      certifications: [],
      languages: [],
      other: [],
    },
    location: {
      cruisingAreas: [],
      base: null,
    },
    ambiguities: [
      {
        field: "all",
        issue: "Basic extraction only - AI parsing not available",
        suggestedQuestion: "Please review and edit all fields manually",
      },
    ],
    confidence: 30, // 0-100 scale
  };
}
