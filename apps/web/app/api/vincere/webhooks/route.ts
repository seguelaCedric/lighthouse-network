import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getVincereClient, listWebhooks, createWebhook } from "@/lib/vincere";
import { z } from "zod";

const createWebhookSchema = z.object({
  webhook_url: z.string().url(),
  url: z.string().url().optional(), // For backward compatibility
  events: z.array(z.string()).min(1),
  active: z.boolean().optional().default(true),
  secret: z.string().optional(),
});

/**
 * GET /api/vincere/webhooks
 * List all registered webhooks
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

    // Get user's info - must be admin or have vincere access
    const { data: userData } = await supabase
      .from("users")
      .select("id, organization_id, role")
      .eq("auth_id", user.id)
      .single();

    if (!userData?.organization_id) {
      return NextResponse.json(
        { error: "User must belong to an organization" },
        { status: 403 }
      );
    }

    // Check if Vincere is configured
    if (
      !process.env.VINCERE_API_URL ||
      !process.env.VINCERE_CLIENT_ID ||
      !process.env.VINCERE_API_KEY
    ) {
      return NextResponse.json(
        { error: "Vincere integration is not configured" },
        { status: 400 }
      );
    }

    const vincere = getVincereClient();
    const webhooks = await listWebhooks(vincere);

    return NextResponse.json({ webhooks });
  } catch (error) {
    console.error("Error listing webhooks:", error);
    return NextResponse.json(
      {
        error: "Failed to list webhooks",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/vincere/webhooks
 * Register a new webhook
 */
export async function POST(request: NextRequest) {
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

    // Get user's info - must be admin or have vincere access
    const { data: userData } = await supabase
      .from("users")
      .select("id, organization_id, role")
      .eq("auth_id", user.id)
      .single();

    if (!userData?.organization_id) {
      return NextResponse.json(
        { error: "User must belong to an organization" },
        { status: 403 }
      );
    }

    // Check if Vincere is configured
    if (
      !process.env.VINCERE_API_URL ||
      !process.env.VINCERE_CLIENT_ID ||
      !process.env.VINCERE_API_KEY
    ) {
      return NextResponse.json(
        { error: "Vincere integration is not configured" },
        { status: 400 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const parseResult = createWebhookSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json(
        { error: "Invalid request data", details: parseResult.error.flatten() },
        { status: 400 }
      );
    }

    const { webhook_url, url, events, active, secret } = parseResult.data;
    const webhookUrl = webhook_url || url; // Support both formats

    // Ensure webhookUrl is defined (webhook_url is required in schema, but url is optional)
    if (!webhookUrl) {
      return NextResponse.json(
        { error: "webhook_url is required" },
        { status: 400 }
      );
    }

    // Convert event strings to Vincere format
    // If events are provided as strings like ['job.created', 'job.updated'], 
    // convert to Vincere format with entity_type and action_types
    let eventObjects;
    if (events.length > 0 && typeof events[0] === 'string') {
      // Convert string events to Vincere format
      const actionTypes: string[] = [];
      if (events.some(e => e.includes('created') || e.includes('CREATE'))) actionTypes.push('CREATE');
      if (events.some(e => e.includes('updated') || e.includes('UPDATE'))) actionTypes.push('UPDATE');
      if (events.some(e => e.includes('deleted') || e.includes('DELETE'))) actionTypes.push('DELETE');
      
      eventObjects = [{
        entity_type: 'JOB', // Jobs are JOB in Vincere (valid: CONTACT, CANDIDATE, PLACEMENT, JOB, APPLICATION, COMPANY)
        action_types: actionTypes.length > 0 ? actionTypes.filter(a => a !== 'DELETE') : ['CREATE', 'UPDATE'], // DELETE not supported for JOB
      }];
    } else {
      // Already in correct format
      eventObjects = events;
    }

    const vincere = getVincereClient();
    const webhook = await createWebhook(
      {
        webhook_url: webhookUrl,
        events: eventObjects,
        active,
        secret,
      },
      vincere
    );

    return NextResponse.json({ webhook }, { status: 201 });
  } catch (error) {
    console.error("Error creating webhook:", error);
    return NextResponse.json(
      {
        error: "Failed to create webhook",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

