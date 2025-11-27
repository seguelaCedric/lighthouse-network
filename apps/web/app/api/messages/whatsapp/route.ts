import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { z } from "zod";
import {
  sendWhatsAppMessage,
  sendWhatsAppTemplate,
  isTwilioConfigured,
} from "@/lib/twilio/whatsapp";

// Validation schema for sending messages
const sendMessageSchema = z.object({
  to: z.string().min(10, "Phone number is required"),
  body: z.string().optional(),
  template: z.string().optional(),
  templateData: z.record(z.string()).optional(),
});

// POST - Send a WhatsApp message
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

    // Check if Twilio is configured
    if (!isTwilioConfigured()) {
      return NextResponse.json(
        { error: "WhatsApp messaging is not configured" },
        { status: 503 }
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
    const parseResult = sendMessageSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parseResult.error.flatten() },
        { status: 400 }
      );
    }

    const { to, body: messageBody, template, templateData } = parseResult.data;

    // Either body or template is required
    if (!messageBody && !template) {
      return NextResponse.json(
        { error: "Either body or template is required" },
        { status: 400 }
      );
    }

    let result;

    if (template && templateData) {
      // Send templated message
      result = await sendWhatsAppTemplate({
        to,
        templateName: template,
        templateData,
      });
    } else if (messageBody) {
      // Send direct message
      result = await sendWhatsAppMessage({
        to,
        body: messageBody,
      });
    } else {
      return NextResponse.json(
        { error: "Message body is required" },
        { status: 400 }
      );
    }

    if (!result.success) {
      return NextResponse.json(
        { error: "Failed to send message", details: result.error },
        { status: 500 }
      );
    }

    // Log the message (optional - for audit trail)
    // You could store this in a communications table

    return NextResponse.json({
      success: true,
      messageSid: result.sid,
    });
  } catch (error) {
    console.error("WhatsApp send error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// Send message to candidate
export async function sendToCandidateSchema() {
  return z.object({
    candidateId: z.string().uuid(),
    template: z.string(),
    templateData: z.record(z.string()).optional(),
  });
}
