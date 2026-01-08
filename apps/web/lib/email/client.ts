import { Resend } from "resend";

// Resend client singleton
let resendClient: Resend | null = null;

export function getResendClient(): Resend {
  if (!resendClient) {
    const apiKey = process.env.RESEND_API_KEY;

    if (!apiKey) {
      throw new Error(
        "Missing Resend API key. Please set RESEND_API_KEY environment variable."
      );
    }

    resendClient = new Resend(apiKey);
  }

  return resendClient;
}

// Check if Resend is configured
export function isResendConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY);
}

// Default from address
export function getDefaultFromAddress(): string {
  return process.env.EMAIL_FROM_ADDRESS || "Lighthouse Careers <hello@lighthouse-careers.com>";
}

// Email sending result
export interface SendEmailResult {
  success: boolean;
  id?: string;
  error?: string;
}

// Send a basic email
export async function sendEmail(params: {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  from?: string;
  replyTo?: string;
  attachments?: Array<{
    filename: string;
    content: Buffer | string;
    contentType?: string;
  }>;
}): Promise<SendEmailResult> {
  try {
    const client = getResendClient();

    const { data, error } = await client.emails.send({
      from: params.from || getDefaultFromAddress(),
      to: Array.isArray(params.to) ? params.to : [params.to],
      subject: params.subject,
      html: params.html,
      text: params.text,
      replyTo: params.replyTo,
      attachments: params.attachments?.map((att) => ({
        filename: att.filename,
        content: typeof att.content === "string" 
          ? Buffer.from(att.content).toString("base64")
          : att.content.toString("base64"),
        content_type: att.contentType || "application/pdf",
      })),
    });

    if (error) {
      console.error("Resend error:", error);
      return {
        success: false,
        error: error.message,
      };
    }

    return {
      success: true,
      id: data?.id,
    };
  } catch (error) {
    console.error("Failed to send email:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
