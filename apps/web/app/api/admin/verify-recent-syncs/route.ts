/**
 * Admin endpoint to verify recent Vincere syncs
 *
 * Checks candidates created in the last 24 hours (or specified period)
 * and verifies they were correctly synced to Vincere.
 *
 * GET /api/admin/verify-recent-syncs?hours=24
 *
 * Returns issues found and summary.
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getVincereClient } from "@/lib/vincere/client";
import { getVincereFunctionalExpertiseId } from "@/lib/vincere/constants";

function getServiceClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error("Missing Supabase environment variables");
  }

  return createClient(supabaseUrl, supabaseServiceKey);
}

interface SyncIssue {
  candidateId: string;
  candidateName: string;
  email: string;
  vincereId: string | null;
  issue: string;
  severity: "critical" | "warning";
}

interface VincereFunctionalExpertise {
  id: number;
  name: string;
}

export async function GET(request: NextRequest) {
  try {
    // Check for admin authorization (basic check - you may want to enhance this)
    const authHeader = request.headers.get("authorization");
    const adminKey = process.env.ADMIN_API_KEY;

    if (adminKey && authHeader !== `Bearer ${adminKey}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = getServiceClient();

    // Get hours parameter (default 24)
    const { searchParams } = new URL(request.url);
    const hours = parseInt(searchParams.get("hours") || "24", 10);

    // Calculate cutoff time
    const cutoffTime = new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();

    // Fetch recent candidates
    const { data: candidates, error: candidateError } = await supabase
      .from("candidates")
      .select(`
        id,
        first_name,
        last_name,
        email,
        vincere_id,
        primary_position,
        created_at,
        last_synced_at,
        source
      `)
      .gte("created_at", cutoffTime)
      .order("created_at", { ascending: false });

    if (candidateError) {
      console.error("Failed to fetch candidates:", candidateError);
      return NextResponse.json(
        { error: "Failed to fetch candidates" },
        { status: 500 }
      );
    }

    if (!candidates || candidates.length === 0) {
      return NextResponse.json({
        success: true,
        message: `No candidates created in the last ${hours} hours`,
        totalChecked: 0,
        issues: [],
        summary: {
          total: 0,
          withVincereId: 0,
          withoutVincereId: 0,
          expertiseMissing: 0,
          cvMissing: 0,
        },
      });
    }

    // Get documents for these candidates
    const candidateIds = candidates.map((c) => c.id);
    const { data: documents } = await supabase
      .from("documents")
      .select("entity_id, type, name")
      .eq("entity_type", "candidate")
      .in("entity_id", candidateIds);

    type DocRecord = { entity_id: string; type: string; name: string };
    const docsByCandidate = (documents || []).reduce(
      (acc, doc) => {
        if (!acc[doc.entity_id]) acc[doc.entity_id] = [];
        acc[doc.entity_id].push(doc);
        return acc;
      },
      {} as Record<string, DocRecord[]>
    );

    // Initialize Vincere client
    let vincere: ReturnType<typeof getVincereClient> | null = null;
    try {
      vincere = getVincereClient();
    } catch (err) {
      console.warn("Vincere not configured, skipping Vincere checks");
    }

    const issues: SyncIssue[] = [];
    let withVincereId = 0;
    let withoutVincereId = 0;
    let expertiseMissing = 0;
    let cvMissing = 0;

    for (const candidate of candidates) {
      const candidateName = `${candidate.first_name} ${candidate.last_name}`;
      const candidateDocs = docsByCandidate[candidate.id] || [];
      const hasCV = candidateDocs.some((d) => d.type === "cv");

      // Check 1: Does candidate have vincere_id?
      if (!candidate.vincere_id) {
        withoutVincereId++;
        issues.push({
          candidateId: candidate.id,
          candidateName,
          email: candidate.email,
          vincereId: null,
          issue: "No vincere_id - candidate was not synced to Vincere",
          severity: "critical",
        });
        continue;
      }

      withVincereId++;

      // If Vincere is configured, do additional checks
      if (vincere) {
        const vincereId = parseInt(candidate.vincere_id);

        // Check 2: Does candidate have functional expertise in Vincere?
        if (candidate.primary_position) {
          const expectedExpertiseId = getVincereFunctionalExpertiseId(
            candidate.primary_position
          );

          if (expectedExpertiseId) {
            try {
              const expertise = await vincere.get<VincereFunctionalExpertise[]>(
                `/candidate/${vincereId}/functionalexpertises`
              );
              const hasExpertise =
                expertise && expertise.some((e) => e.id === expectedExpertiseId);

              if (!hasExpertise) {
                expertiseMissing++;
                issues.push({
                  candidateId: candidate.id,
                  candidateName,
                  email: candidate.email,
                  vincereId: candidate.vincere_id,
                  issue: `Functional expertise not set in Vincere (position: ${candidate.primary_position})`,
                  severity: "warning",
                });
              }
            } catch (err) {
              // Vincere API error - log but continue
              console.error(
                `Failed to check expertise for ${vincereId}:`,
                err
              );
            }
          } else {
            // Position couldn't be mapped
            issues.push({
              candidateId: candidate.id,
              candidateName,
              email: candidate.email,
              vincereId: candidate.vincere_id,
              issue: `Position "${candidate.primary_position}" not mapped to Vincere expertise ID`,
              severity: "warning",
            });
          }
        }

        // Check 3: If we have a CV, is it in Vincere?
        if (hasCV) {
          try {
            const files = await vincere.get<{ original_cv: boolean }[]>(
              `/candidate/${vincereId}/files`
            );
            const hasCVInVincere =
              files && files.some((f) => f.original_cv === true);

            if (!hasCVInVincere) {
              cvMissing++;
              issues.push({
                candidateId: candidate.id,
                candidateName,
                email: candidate.email,
                vincereId: candidate.vincere_id,
                issue: "CV exists in our system but not in Vincere (original_cv flag)",
                severity: "warning",
              });
            }
          } catch (err) {
            // Vincere API error - log but continue
            console.error(`Failed to check files for ${vincereId}:`, err);
          }
        }
      }

      // Small delay to avoid rate limiting
      await new Promise((resolve) => setTimeout(resolve, 100));
    }

    // Sort issues by severity
    issues.sort((a, b) => {
      if (a.severity === "critical" && b.severity !== "critical") return -1;
      if (a.severity !== "critical" && b.severity === "critical") return 1;
      return 0;
    });

    const hasIssues = issues.length > 0;

    return NextResponse.json({
      success: !hasIssues,
      message: hasIssues
        ? `Found ${issues.length} issue(s) with recent syncs`
        : `All ${candidates.length} candidates synced correctly`,
      totalChecked: candidates.length,
      issues,
      summary: {
        total: candidates.length,
        withVincereId,
        withoutVincereId,
        expertiseMissing,
        cvMissing,
      },
    });
  } catch (error) {
    console.error("Verify syncs error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
