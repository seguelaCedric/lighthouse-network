import twilio from "twilio";

// Twilio client singleton
let twilioClient: twilio.Twilio | null = null;

export function getTwilioClient(): twilio.Twilio {
  if (!twilioClient) {
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;

    if (!accountSid || !authToken) {
      throw new Error(
        "Missing Twilio credentials. Please set TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN environment variables."
      );
    }

    twilioClient = twilio(accountSid, authToken);
  }

  return twilioClient;
}

export function getWhatsAppNumber(): string {
  const whatsappNumber = process.env.TWILIO_WHATSAPP_NUMBER;

  if (!whatsappNumber) {
    throw new Error(
      "Missing Twilio WhatsApp number. Please set TWILIO_WHATSAPP_NUMBER environment variable."
    );
  }

  // Ensure proper WhatsApp format
  if (!whatsappNumber.startsWith("whatsapp:")) {
    return `whatsapp:${whatsappNumber}`;
  }

  return whatsappNumber;
}

// Check if Twilio is configured
export function isTwilioConfigured(): boolean {
  return Boolean(
    process.env.TWILIO_ACCOUNT_SID &&
      process.env.TWILIO_AUTH_TOKEN &&
      process.env.TWILIO_WHATSAPP_NUMBER
  );
}
