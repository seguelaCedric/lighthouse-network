import { getTwilioClient, getWhatsAppNumber } from "./client";

export interface SendWhatsAppMessageParams {
  to: string;
  body: string;
  mediaUrl?: string;
}

export interface WhatsAppMessageResult {
  success: boolean;
  sid?: string;
  error?: string;
}

/**
 * Format phone number for WhatsApp
 * Ensures the number has the whatsapp: prefix and proper format
 */
export function formatWhatsAppNumber(phoneNumber: string): string {
  // Remove any existing prefix
  let cleaned = phoneNumber.replace(/^whatsapp:/, "").trim();

  // Remove common formatting characters
  cleaned = cleaned.replace(/[\s\-\(\)\.]/g, "");

  // Ensure it starts with +
  if (!cleaned.startsWith("+")) {
    // Assume E.164 format is needed - you may want to add country code logic
    cleaned = `+${cleaned}`;
  }

  return `whatsapp:${cleaned}`;
}

/**
 * Send a WhatsApp message using Twilio
 */
export async function sendWhatsAppMessage(
  params: SendWhatsAppMessageParams
): Promise<WhatsAppMessageResult> {
  try {
    const client = getTwilioClient();
    const from = getWhatsAppNumber();
    const to = formatWhatsAppNumber(params.to);

    const messageParams: {
      from: string;
      to: string;
      body: string;
      mediaUrl?: string[];
    } = {
      from,
      to,
      body: params.body,
    };

    if (params.mediaUrl) {
      messageParams.mediaUrl = [params.mediaUrl];
    }

    const message = await client.messages.create(messageParams);

    return {
      success: true,
      sid: message.sid,
    };
  } catch (error) {
    console.error("Failed to send WhatsApp message:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Send a templated WhatsApp message
 * Note: For WhatsApp Business API, you may need to use approved templates
 */
export async function sendWhatsAppTemplate(params: {
  to: string;
  templateName: string;
  templateData: Record<string, string>;
}): Promise<WhatsAppMessageResult> {
  // For now, we'll just format the template and send as a regular message
  // In production, you might use Twilio's Content API for approved templates
  const body = formatTemplate(params.templateName, params.templateData);
  return sendWhatsAppMessage({ to: params.to, body });
}

/**
 * Format a template with data
 */
function formatTemplate(
  templateName: string,
  data: Record<string, string>
): string {
  const templates: Record<string, string> = {
    brief_received: `Hi {{clientName}}! We've received your brief for a {{position}} position. Our team is reviewing it now and will get back to you shortly with suitable candidates. - Lighthouse Crew`,

    candidate_shortlist: `Hi {{clientName}}! We've prepared a shortlist of {{count}} candidates for your {{position}} role. View them here: {{link}} - Lighthouse Crew`,

    availability_check: `Hi {{candidateName}}! Quick check - are you still available for {{position}} positions starting {{startDate}}? Reply YES or NO. - Lighthouse Crew`,

    interview_scheduled: `Hi {{candidateName}}! Great news - you have an interview scheduled for the {{position}} role on {{vesselName}}. Date: {{date}} Time: {{time}}. Please confirm your attendance. - Lighthouse Crew`,

    placement_confirmation: `Congratulations {{candidateName}}! You've been selected for the {{position}} role on {{vesselName}}. Start date: {{startDate}}. We'll be in touch with next steps. - Lighthouse Crew`,

    reference_request: `Hi {{refereeName}}! {{candidateName}} has listed you as a reference for a {{position}} role. Could you please provide a brief reference? Reply to this message or call us at {{phone}}. - Lighthouse Crew`,
  };

  let message = templates[templateName] || templateName;

  // Replace placeholders with actual data
  Object.entries(data).forEach(([key, value]) => {
    message = message.replace(new RegExp(`{{${key}}}`, "g"), value);
  });

  return message;
}

/**
 * Parse an incoming WhatsApp message to detect if it's a brief
 */
export function detectBriefFromMessage(message: string): {
  isBrief: boolean;
  confidence: number;
  indicators: string[];
} {
  const indicators: string[] = [];
  let score = 0;

  // Check for position keywords
  const positionKeywords = [
    "captain",
    "chief stew",
    "stewardess",
    "chef",
    "engineer",
    "deckhand",
    "bosun",
    "mate",
    "eto",
    "purser",
  ];
  const hasPosition = positionKeywords.some((keyword) =>
    message.toLowerCase().includes(keyword)
  );
  if (hasPosition) {
    indicators.push("Contains position keyword");
    score += 25;
  }

  // Check for vessel references
  const vesselKeywords = [
    "yacht",
    "m/y",
    "s/y",
    "motor yacht",
    "sailing yacht",
    "vessel",
    "boat",
  ];
  const hasVessel = vesselKeywords.some((keyword) =>
    message.toLowerCase().includes(keyword)
  );
  if (hasVessel) {
    indicators.push("Contains vessel reference");
    score += 20;
  }

  // Check for size indicators
  const sizePattern = /\d+\s*(m|meter|metre|ft|foot|feet)/i;
  if (sizePattern.test(message)) {
    indicators.push("Contains vessel size");
    score += 15;
  }

  // Check for date references
  const dateKeywords = [
    "asap",
    "immediately",
    "starting",
    "january",
    "february",
    "march",
    "april",
    "may",
    "june",
    "july",
    "august",
    "september",
    "october",
    "november",
    "december",
  ];
  const hasDate = dateKeywords.some((keyword) =>
    message.toLowerCase().includes(keyword)
  );
  if (hasDate) {
    indicators.push("Contains date/timing reference");
    score += 15;
  }

  // Check for salary/compensation
  const salaryPattern = /[€$£]\s*\d+|salary|per month|p\.?m\.?/i;
  if (salaryPattern.test(message)) {
    indicators.push("Contains salary reference");
    score += 10;
  }

  // Check for location references
  const locationKeywords = [
    "mediterranean",
    "med",
    "caribbean",
    "florida",
    "antibes",
    "monaco",
    "palma",
    "fort lauderdale",
  ];
  const hasLocation = locationKeywords.some((keyword) =>
    message.toLowerCase().includes(keyword)
  );
  if (hasLocation) {
    indicators.push("Contains location reference");
    score += 10;
  }

  // Check message length (briefs tend to be longer)
  if (message.length > 100) {
    indicators.push("Substantial message length");
    score += 5;
  }

  return {
    isBrief: score >= 40,
    confidence: Math.min(score, 100),
    indicators,
  };
}

/**
 * Extract phone number from Twilio WhatsApp format
 */
export function extractPhoneFromWhatsApp(whatsappNumber: string): string {
  return whatsappNumber.replace(/^whatsapp:/, "");
}

/**
 * Send availability check to a candidate
 */
export async function sendAvailabilityCheck(params: {
  candidatePhone: string;
  candidateName: string;
  position?: string;
  startDate?: string;
}): Promise<WhatsAppMessageResult> {
  const message = formatTemplate("availability_check", {
    candidateName: params.candidateName,
    position: params.position || "yacht crew",
    startDate: params.startDate || "immediately",
  });

  return sendWhatsAppMessage({
    to: params.candidatePhone,
    body: message,
  });
}

/**
 * Parse availability response from candidate
 */
export function parseAvailabilityResponse(message: string): {
  isResponse: boolean;
  available: boolean | null;
  confidence: number;
} {
  const normalizedMessage = message.toLowerCase().trim();

  // Definitive positive responses
  const positiveResponses = [
    "yes",
    "yeah",
    "yep",
    "yup",
    "available",
    "i am available",
    "i'm available",
    "im available",
    "can start",
    "ready",
    "free",
    "count me in",
    "interested",
  ];

  // Definitive negative responses
  const negativeResponses = [
    "no",
    "nope",
    "not available",
    "unavailable",
    "busy",
    "working",
    "on contract",
    "not interested",
    "pass",
    "can't",
    "cannot",
  ];

  // Check for exact matches first
  if (normalizedMessage === "yes" || normalizedMessage === "y") {
    return { isResponse: true, available: true, confidence: 100 };
  }

  if (normalizedMessage === "no" || normalizedMessage === "n") {
    return { isResponse: true, available: false, confidence: 100 };
  }

  // Check for positive patterns
  for (const response of positiveResponses) {
    if (normalizedMessage.includes(response)) {
      return { isResponse: true, available: true, confidence: 85 };
    }
  }

  // Check for negative patterns
  for (const response of negativeResponses) {
    if (normalizedMessage.includes(response)) {
      return { isResponse: true, available: false, confidence: 85 };
    }
  }

  // Check for date-based responses (e.g., "available from March")
  const datePattern =
    /available\s+(from|after|starting|in)\s+\w+/i;
  if (datePattern.test(normalizedMessage)) {
    return { isResponse: true, available: true, confidence: 70 };
  }

  // Not a clear availability response
  return { isResponse: false, available: null, confidence: 0 };
}
