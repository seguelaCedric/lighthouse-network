import { createClient } from "@/lib/supabase/server";

// Activity types
export type ActivityType =
  | "brief_created"
  | "brief_parsed"
  | "brief_converted"
  | "brief_assigned"
  | "job_created"
  | "job_updated"
  | "job_status_changed"
  | "job_matched"
  | "candidate_created"
  | "candidate_updated"
  | "candidate_added_to_shortlist"
  | "candidate_submitted"
  | "candidate_stage_changed"
  | "candidate_feedback_added"
  | "candidate_rejected"
  | "candidate_placed"
  | "note_added"
  | "email_sent"
  | "whatsapp_sent"
  | "interview_scheduled"
  | "reference_requested"
  | "document_uploaded";

// Entity types
export type EntityType = "brief" | "job" | "candidate" | "client" | "application";

export interface ActivityLogData {
  type: ActivityType;
  entityType: EntityType;
  entityId: string;
  description: string;
  metadata?: Record<string, unknown>;
  relatedEntityType?: EntityType;
  relatedEntityId?: string;
}

/**
 * Log an activity event
 */
export async function logActivity(data: ActivityLogData): Promise<void> {
  try {
    const supabase = await createClient();

    // Get current user
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      console.warn("Cannot log activity: No authenticated user");
      return;
    }

    // Get user's organization
    const { data: userData } = await supabase
      .from("users")
      .select("id, organization_id")
      .eq("auth_id", user.id)
      .single();

    if (!userData) {
      console.warn("Cannot log activity: User not found");
      return;
    }

    // Insert activity log
    const { error } = await supabase.from("activity_logs").insert({
      type: data.type,
      entity_type: data.entityType,
      entity_id: data.entityId,
      description: data.description,
      metadata: data.metadata || {},
      related_entity_type: data.relatedEntityType || null,
      related_entity_id: data.relatedEntityId || null,
      user_id: userData.id,
      organization_id: userData.organization_id,
    });

    if (error) {
      console.error("Failed to log activity:", error);
    }
  } catch (error) {
    console.error("Error logging activity:", error);
  }
}

/**
 * Get activity logs for an entity
 */
export async function getActivityLogs(
  entityType: EntityType,
  entityId: string,
  limit: number = 50
): Promise<ActivityLogEntry[]> {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("activity_logs")
      .select(`
        *,
        user:users!activity_logs_user_id_fkey (
          id,
          first_name,
          last_name,
          photo_url
        )
      `)
      .eq("entity_type", entityType)
      .eq("entity_id", entityId)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) {
      console.error("Failed to fetch activity logs:", error);
      return [];
    }

    return (data || []).map((log) => ({
      id: log.id,
      type: log.type as ActivityType,
      entityType: log.entity_type as EntityType,
      entityId: log.entity_id,
      description: log.description,
      metadata: log.metadata as Record<string, unknown>,
      createdAt: new Date(log.created_at),
      user: log.user
        ? {
            id: log.user.id,
            name: `${log.user.first_name} ${log.user.last_name}`,
            photoUrl: log.user.photo_url,
          }
        : undefined,
    }));
  } catch (error) {
    console.error("Error fetching activity logs:", error);
    return [];
  }
}

// Formatted activity log entry
export interface ActivityLogEntry {
  id: string;
  type: ActivityType;
  entityType: EntityType;
  entityId: string;
  description: string;
  metadata: Record<string, unknown>;
  createdAt: Date;
  user?: {
    id: string;
    name: string;
    photoUrl?: string;
  };
}

/**
 * Helper to create common activity descriptions
 */
export const ActivityDescriptions = {
  briefCreated: (source: string) => `Brief received via ${source}`,
  briefParsed: (confidence: number) => `Brief parsed with ${confidence}% confidence`,
  briefConverted: (jobTitle: string) => `Brief converted to job: ${jobTitle}`,
  briefAssigned: (userName: string) => `Brief assigned to ${userName}`,

  jobCreated: (title: string) => `Job created: ${title}`,
  jobStatusChanged: (from: string, to: string) => `Job status changed from ${from} to ${to}`,
  jobMatched: (candidateCount: number) => `AI matched ${candidateCount} candidates`,

  candidateAddedToShortlist: (candidateName: string) => `${candidateName} added to shortlist`,
  candidateSubmitted: (candidateName: string) => `${candidateName} submitted to client`,
  candidateStageChanged: (candidateName: string, stage: string) =>
    `${candidateName} moved to ${stage}`,
  candidateFeedbackAdded: (candidateName: string) => `Feedback added for ${candidateName}`,
  candidateRejected: (candidateName: string, reason?: string) =>
    reason ? `${candidateName} rejected: ${reason}` : `${candidateName} rejected`,
  candidatePlaced: (candidateName: string) => `${candidateName} placed successfully`,

  noteAdded: () => "Note added",
  emailSent: (recipientEmail: string) => `Email sent to ${recipientEmail}`,
  whatsAppSent: (recipientPhone: string) => `WhatsApp sent to ${recipientPhone}`,
  interviewScheduled: (candidateName: string, date: string) =>
    `Interview scheduled with ${candidateName} for ${date}`,
  documentUploaded: (documentName: string) => `Document uploaded: ${documentName}`,
};
