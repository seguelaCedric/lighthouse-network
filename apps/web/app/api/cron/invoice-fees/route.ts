import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { invoicePendingFees } from "@/lib/stripe/placement-fees";

/**
 * POST /api/cron/invoice-fees
 * Monthly cron job to generate invoices for pending placement fees
 *
 * This endpoint should be called by a cron scheduler (e.g., Vercel Cron)
 * on the 1st of each month to invoice all pending fees from the previous month.
 *
 * Security: Protected by CRON_SECRET header
 */
export async function POST(request: NextRequest) {
  try {
    // Verify cron secret to prevent unauthorized access
    const authHeader = request.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;

    if (!cronSecret) {
      console.error("CRON_SECRET not configured");
      return NextResponse.json(
        { error: "Cron not configured" },
        { status: 500 }
      );
    }

    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = await createClient();

    // Get all agencies with pending fees
    const { data: agenciesWithFees, error: fetchError } = await supabase
      .from("placement_fees")
      .select("agency_id")
      .eq("status", "pending")
      .not("agency_id", "is", null);

    if (fetchError) {
      console.error("Error fetching agencies with pending fees:", fetchError);
      return NextResponse.json(
        { error: "Failed to fetch pending fees" },
        { status: 500 }
      );
    }

    // Get unique agency IDs
    const uniqueAgencyIds = [
      ...new Set(agenciesWithFees?.map((f) => f.agency_id) || []),
    ];

    if (uniqueAgencyIds.length === 0) {
      return NextResponse.json({
        success: true,
        message: "No pending fees to invoice",
        invoicesCreated: 0,
      });
    }

    const results: {
      agencyId: string;
      success: boolean;
      invoiceId?: string;
      total?: number;
      error?: string;
    }[] = [];

    // Process each agency
    for (const agencyId of uniqueAgencyIds) {
      try {
        const result = await invoicePendingFees(agencyId);

        if (result) {
          results.push({
            agencyId,
            success: true,
            invoiceId: result.invoiceId,
            total: result.total,
          });

          // Log activity
          await supabase.from("activity_logs").insert({
            activity_type: "invoice_generated",
            entity_type: "invoice",
            entity_id: result.invoiceId,
            organization_id: agencyId,
            metadata: {
              total: result.total,
              currency: "EUR",
              generated_by: "cron",
            },
          });
        } else {
          results.push({
            agencyId,
            success: true,
            error: "No pending fees for this agency",
          });
        }
      } catch (error) {
        console.error(`Error invoicing agency ${agencyId}:`, error);
        results.push({
          agencyId,
          success: false,
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }

    const successCount = results.filter((r) => r.success && r.invoiceId).length;
    const failureCount = results.filter((r) => !r.success).length;

    console.log(
      `Cron job completed: ${successCount} invoices created, ${failureCount} failures`
    );

    return NextResponse.json({
      success: true,
      message: `Generated ${successCount} invoices`,
      invoicesCreated: successCount,
      failures: failureCount,
      results,
    });
  } catch (error) {
    console.error("Cron job error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// Also support GET for manual testing (still requires auth)
export async function GET(request: NextRequest) {
  return POST(request);
}
