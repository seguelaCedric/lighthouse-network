import { createClient } from "@/lib/supabase/server";
import { sendEmail, candidateShortlistedEmail, isResendConfigured } from "@/lib/email";

// Client notification types
export type ClientNotificationType =
  | "shortlist_ready"
  | "interview_scheduled"
  | "interview_reminder"
  | "placement_confirmed"
  | "feedback_requested"
  | "new_candidates"
  | "document_ready"
  | "system";

export interface ClientNotificationData {
  type: ClientNotificationType;
  title: string;
  message: string;
  actionUrl?: string;
  actionLabel?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Create a notification for a client
 */
export async function createClientNotification(
  clientId: string,
  data: ClientNotificationData
): Promise<void> {
  try {
    const supabase = await createClient();

    const { error } = await supabase.from("client_notifications").insert({
      client_id: clientId,
      type: data.type,
      title: data.title,
      message: data.message,
      action_url: data.actionUrl || null,
      action_label: data.actionLabel || null,
      metadata: data.metadata || {},
      read: false,
    });

    if (error) {
      console.error("Failed to create client notification:", error);
    }
  } catch (error) {
    console.error("Error creating client notification:", error);
  }
}

/**
 * Create notifications for multiple clients
 */
export async function createClientNotifications(
  clientIds: string[],
  data: ClientNotificationData
): Promise<void> {
  try {
    const supabase = await createClient();

    const notifications = clientIds.map((clientId) => ({
      client_id: clientId,
      type: data.type,
      title: data.title,
      message: data.message,
      action_url: data.actionUrl || null,
      action_label: data.actionLabel || null,
      metadata: data.metadata || {},
      read: false,
    }));

    const { error } = await supabase.from("client_notifications").insert(notifications);

    if (error) {
      console.error("Failed to create client notifications:", error);
    }
  } catch (error) {
    console.error("Error creating client notifications:", error);
  }
}

/**
 * Client notification templates
 */
export const ClientNotificationTemplates = {
  shortlistReady: (
    jobTitle: string,
    candidateCount: number,
    jobId: string
  ): ClientNotificationData => ({
    type: "shortlist_ready",
    title: "Shortlist Ready",
    message: `${candidateCount} candidates have been shortlisted for ${jobTitle}`,
    actionUrl: `/client/shortlist/${jobId}`,
    actionLabel: "View Shortlist",
    metadata: { jobId, candidateCount },
  }),

  newCandidatesAdded: (
    jobTitle: string,
    addedCount: number,
    jobId: string
  ): ClientNotificationData => ({
    type: "new_candidates",
    title: "New Candidates Added",
    message: `${addedCount} new candidates added to ${jobTitle} shortlist`,
    actionUrl: `/client/shortlist/${jobId}`,
    actionLabel: "View Candidates",
    metadata: { jobId, addedCount },
  }),

  interviewScheduled: (
    candidateName: string,
    dateTime: string,
    interviewType: string
  ): ClientNotificationData => ({
    type: "interview_scheduled",
    title: "Interview Scheduled",
    message: `${interviewType} interview with ${candidateName} scheduled for ${dateTime}`,
    actionUrl: "/client/interviews",
    actionLabel: "View Interview",
    metadata: { candidateName, dateTime, interviewType },
  }),

  interviewReminder: (
    candidateName: string,
    dateTime: string,
    meetingLink?: string
  ): ClientNotificationData => ({
    type: "interview_reminder",
    title: "Interview Tomorrow",
    message: `Reminder: Interview with ${candidateName} is scheduled for ${dateTime}`,
    actionUrl: "/client/interviews",
    actionLabel: "View Details",
    metadata: { candidateName, dateTime, meetingLink },
  }),

  placementConfirmed: (
    candidateName: string,
    jobTitle: string
  ): ClientNotificationData => ({
    type: "placement_confirmed",
    title: "Placement Confirmed!",
    message: `${candidateName} has been successfully placed for ${jobTitle}`,
    actionUrl: "/client/placements",
    actionLabel: "View Placement",
    metadata: { candidateName, jobTitle },
  }),

  feedbackRequested: (
    jobTitle: string,
    candidateCount: number,
    jobId: string
  ): ClientNotificationData => ({
    type: "feedback_requested",
    title: "Feedback Requested",
    message: `Please review and provide feedback on ${candidateCount} candidates for ${jobTitle}`,
    actionUrl: `/client/shortlist/${jobId}`,
    actionLabel: "Provide Feedback",
    metadata: { jobId, candidateCount },
  }),

  documentReady: (
    documentType: string,
    candidateName: string
  ): ClientNotificationData => ({
    type: "document_ready",
    title: "Document Available",
    message: `${documentType} for ${candidateName} is now available for download`,
    actionLabel: "View Document",
    metadata: { documentType, candidateName },
  }),
};

/**
 * Send shortlist notification to client (in-app + email)
 */
export async function notifyClientShortlistReady(
  clientId: string,
  jobTitle: string,
  candidateCount: number,
  jobId: string
): Promise<void> {
  // Create in-app notification
  await createClientNotification(
    clientId,
    ClientNotificationTemplates.shortlistReady(jobTitle, candidateCount, jobId)
  );

  // Send email if configured
  if (isResendConfigured()) {
    try {
      const supabase = await createClient();

      // Get client details for email
      const { data: client } = await supabase
        .from("clients")
        .select("name, portal_email, vessel_name, primary_contact_name")
        .eq("id", clientId)
        .single();

      if (client?.portal_email) {
        const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
        const shortlistLink = `${baseUrl}/client/shortlist/${jobId}`;

        const emailContent = candidateShortlistedEmail({
          clientName: client.primary_contact_name || client.name,
          position: jobTitle,
          vesselName: client.vessel_name || "your vessel",
          candidateCount,
          shortlistLink,
        });

        const emailResult = await sendEmail({
          to: client.portal_email,
          subject: emailContent.subject,
          html: emailContent.html,
          text: emailContent.text,
        });

        if (emailResult.success) {
          console.log(`Shortlist email sent to ${client.portal_email} (ID: ${emailResult.id})`);
        } else {
          console.error("Failed to send shortlist email:", emailResult.error);
        }
      }
    } catch (error) {
      console.error("Error sending shortlist email:", error);
    }
  }
}

/**
 * Send interview scheduled notification to client
 */
export async function notifyClientInterviewScheduled(
  clientId: string,
  candidateName: string,
  dateTime: string,
  interviewType: string
): Promise<void> {
  await createClientNotification(
    clientId,
    ClientNotificationTemplates.interviewScheduled(candidateName, dateTime, interviewType)
  );
}

/**
 * Send placement confirmation notification to client
 */
export async function notifyClientPlacementConfirmed(
  clientId: string,
  candidateName: string,
  jobTitle: string
): Promise<void> {
  await createClientNotification(
    clientId,
    ClientNotificationTemplates.placementConfirmed(candidateName, jobTitle)
  );
}
