import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  detectBriefFromMessage,
  extractPhoneFromWhatsApp,
  sendWhatsAppMessage,
  parseAvailabilityResponse,
} from "@/lib/twilio/whatsapp";
import twilio from "twilio";

// Validate Twilio webhook signature
function validateTwilioSignature(
  request: NextRequest,
  body: string
): boolean {
  const twilioSignature = request.headers.get("x-twilio-signature");
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const webhookUrl = process.env.TWILIO_WEBHOOK_URL;

  if (!twilioSignature || !authToken || !webhookUrl) {
    // In development, skip validation if not configured
    if (process.env.NODE_ENV === "development") {
      console.warn("Twilio signature validation skipped in development");
      return true;
    }
    return false;
  }

  // Parse the body as URLSearchParams for validation
  const params: Record<string, string> = {};
  new URLSearchParams(body).forEach((value, key) => {
    params[key] = value;
  });

  return twilio.validateRequest(authToken, twilioSignature, webhookUrl, params);
}

// Parse incoming Twilio webhook data
interface TwilioWhatsAppMessage {
  MessageSid: string;
  AccountSid: string;
  From: string;
  To: string;
  Body: string;
  NumMedia?: string;
  MediaUrl0?: string;
  MediaContentType0?: string;
  ProfileName?: string;
  WaId?: string; // WhatsApp ID (phone number)
}

export async function POST(request: NextRequest) {
  try {
    // Get raw body for signature validation
    const rawBody = await request.text();

    // Validate Twilio signature
    if (!validateTwilioSignature(request, rawBody)) {
      console.error("Invalid Twilio signature");
      return new NextResponse("Forbidden", { status: 403 });
    }

    // Parse the webhook payload
    const formData = new URLSearchParams(rawBody);
    const message: TwilioWhatsAppMessage = {
      MessageSid: formData.get("MessageSid") || "",
      AccountSid: formData.get("AccountSid") || "",
      From: formData.get("From") || "",
      To: formData.get("To") || "",
      Body: formData.get("Body") || "",
      NumMedia: formData.get("NumMedia") || undefined,
      MediaUrl0: formData.get("MediaUrl0") || undefined,
      MediaContentType0: formData.get("MediaContentType0") || undefined,
      ProfileName: formData.get("ProfileName") || undefined,
      WaId: formData.get("WaId") || undefined,
    };

    console.log("Received WhatsApp message:", {
      from: message.From,
      profileName: message.ProfileName,
      bodyLength: message.Body.length,
    });

    // Initialize Supabase client (service role for webhook)
    const supabase = await createClient();

    // Extract phone number
    const phoneNumber = extractPhoneFromWhatsApp(message.From);
    const messageBody = message.Body.trim();

    // Check if this is potentially a brief
    const briefDetection = detectBriefFromMessage(messageBody);

    if (briefDetection.isBrief && briefDetection.confidence >= 40) {
      // This looks like a brief - create a new brief record
      await handleIncomingBrief(supabase, {
        phoneNumber,
        profileName: message.ProfileName,
        messageBody,
        confidence: briefDetection.confidence,
        messageSid: message.MessageSid,
        mediaUrl: message.MediaUrl0,
      });

      // Send acknowledgment
      await sendWhatsAppMessage({
        to: phoneNumber,
        body: `Thanks ${message.ProfileName || ""}! We've received your brief and our team is reviewing it now. We'll get back to you shortly with suitable candidates.`,
      });
    } else {
      // Check if this is a response to an existing conversation
      const handled = await handleConversationResponse(supabase, {
        phoneNumber,
        messageBody,
        messageSid: message.MessageSid,
      });

      if (!handled) {
        // Unknown message - send a helpful response
        await sendWhatsAppMessage({
          to: phoneNumber,
          body: `Hi ${message.ProfileName || "there"}! Thanks for your message. If you're looking to hire crew, please send us the job details (position, yacht info, start date, requirements) and we'll find the perfect match. For other inquiries, please email hello@lighthouse.crew`,
        });
      }
    }

    // Return TwiML response (empty is fine for WhatsApp)
    return new NextResponse(
      '<?xml version="1.0" encoding="UTF-8"?><Response></Response>',
      {
        status: 200,
        headers: {
          "Content-Type": "text/xml",
        },
      }
    );
  } catch (error) {
    console.error("Webhook error:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

// Handle incoming brief from WhatsApp
async function handleIncomingBrief(
  supabase: Awaited<ReturnType<typeof createClient>>,
  params: {
    phoneNumber: string;
    profileName?: string;
    messageBody: string;
    confidence: number;
    messageSid: string;
    mediaUrl?: string;
  }
) {
  // Try to find existing client by phone number
  const { data: existingClient } = await supabase
    .from("clients")
    .select("id, name")
    .or(`phone.eq.${params.phoneNumber},whatsapp.eq.${params.phoneNumber}`)
    .single();

  // Create the brief
  const { data: brief, error } = await supabase
    .from("briefs")
    .insert({
      raw_content: params.messageBody,
      source: "whatsapp",
      sender_phone: params.phoneNumber,
      sender_name: params.profileName || undefined,
      client_id: existingClient?.id || undefined,
      status: "new",
      received_at: new Date().toISOString(),
      metadata: {
        twilio_message_sid: params.messageSid,
        media_url: params.mediaUrl,
        auto_detected: true,
        detection_confidence: params.confidence,
      },
    })
    .select()
    .single();

  if (error) {
    console.error("Failed to create brief from WhatsApp:", error);
    throw error;
  }

  console.log("Created brief from WhatsApp:", brief.id);

  // Optionally trigger auto-parsing
  // This could be done via a background job or queue
  // For now, we'll leave it for manual parsing

  return brief;
}

// Handle responses in an existing conversation
async function handleConversationResponse(
  supabase: Awaited<ReturnType<typeof createClient>>,
  params: {
    phoneNumber: string;
    messageBody: string;
    messageSid: string;
  }
): Promise<boolean> {
  // Parse the message for availability response
  const availabilityResult = parseAvailabilityResponse(params.messageBody);

  if (availabilityResult.isResponse && availabilityResult.available !== null) {
    console.log(
      `Availability response from ${params.phoneNumber}: ${availabilityResult.available ? "AVAILABLE" : "NOT AVAILABLE"} (confidence: ${availabilityResult.confidence}%)`
    );

    // Find the candidate by phone number
    const { data: candidate } = await supabase
      .from("candidates")
      .select("id, first_name, last_availability_check")
      .or(`phone.eq.${params.phoneNumber},whatsapp.eq.${params.phoneNumber}`)
      .single();

    if (candidate) {
      // Check if we recently sent an availability check (within last 7 days)
      const lastCheck = candidate.last_availability_check
        ? new Date(candidate.last_availability_check)
        : null;
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const wasRecentlyChecked = lastCheck && lastCheck > sevenDaysAgo;

      if (availabilityResult.available) {
        // Update candidate to available
        await supabase
          .from("candidates")
          .update({
            availability_status: "available",
            availability_updated_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq("id", candidate.id);

        // Log the activity
        await supabase.from("activity_logs").insert({
          activity_type: "availability_updated",
          entity_type: "candidate",
          entity_id: candidate.id,
          metadata: {
            new_status: "available",
            source: "whatsapp_response",
            confidence: availabilityResult.confidence,
            was_prompted: wasRecentlyChecked,
          },
        });

        await sendWhatsAppMessage({
          to: params.phoneNumber,
          body: `Thanks ${candidate.first_name}! We've updated your status to Available. We'll be in touch when we have suitable opportunities.`,
        });
      } else {
        // Update candidate to not available
        await supabase
          .from("candidates")
          .update({
            availability_status: "unavailable",
            availability_updated_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq("id", candidate.id);

        // Log the activity
        await supabase.from("activity_logs").insert({
          activity_type: "availability_updated",
          entity_type: "candidate",
          entity_id: candidate.id,
          metadata: {
            new_status: "unavailable",
            source: "whatsapp_response",
            confidence: availabilityResult.confidence,
            was_prompted: wasRecentlyChecked,
          },
        });

        await sendWhatsAppMessage({
          to: params.phoneNumber,
          body: `Thanks ${candidate.first_name}! We've noted that you're not currently available. Let us know when your situation changes.`,
        });
      }
      return true;
    }
  }

  // Check for interview confirmations
  const confirmPatterns = ["confirm", "confirmed", "accept", "accepted", "will attend", "i'll be there"];
  if (confirmPatterns.some(pattern => params.messageBody.toLowerCase().includes(pattern))) {
    console.log(`Interview confirmation from ${params.phoneNumber}`);

    // Find the candidate
    const { data: candidate } = await supabase
      .from("candidates")
      .select("id, first_name")
      .or(`phone.eq.${params.phoneNumber},whatsapp.eq.${params.phoneNumber}`)
      .single();

    if (candidate) {
      // Find any pending interviews for this candidate
      const { data: pendingInterview } = await supabase
        .from("applications")
        .select("id, job_id")
        .eq("candidate_id", candidate.id)
        .eq("stage", "interview")
        .is("interview_confirmed", null)
        .order("interview_date", { ascending: true })
        .limit(1)
        .single();

      if (pendingInterview) {
        // Mark interview as confirmed
        await supabase
          .from("applications")
          .update({
            interview_confirmed: true,
            interview_confirmed_at: new Date().toISOString(),
          })
          .eq("id", pendingInterview.id);

        // Log the activity
        await supabase.from("activity_logs").insert({
          activity_type: "interview_confirmed",
          entity_type: "candidate",
          entity_id: candidate.id,
          metadata: {
            application_id: pendingInterview.id,
            job_id: pendingInterview.job_id,
            source: "whatsapp_response",
          },
        });

        await sendWhatsAppMessage({
          to: params.phoneNumber,
          body: `Perfect ${candidate.first_name}, your interview is confirmed! We'll send you a reminder closer to the date. Good luck!`,
        });

        return true;
      }
    }
  }

  return false;
}

// Also handle GET for webhook verification (if needed by Twilio)
export async function GET(request: NextRequest) {
  // Twilio sometimes sends a GET request to verify the webhook URL
  return new NextResponse("Webhook endpoint active", { status: 200 });
}
