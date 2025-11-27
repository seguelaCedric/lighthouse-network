import { createClient } from "@/lib/supabase/server";

// Notification types
export type NotificationType =
  | "brief_received"
  | "brief_parsed"
  | "brief_needs_clarification"
  | "job_match_ready"
  | "candidate_submitted"
  | "candidate_interview_scheduled"
  | "candidate_feedback_received"
  | "candidate_placed"
  | "candidate_rejected"
  | "message_received"
  | "document_expiring"
  | "system";

export interface NotificationData {
  type: NotificationType;
  title: string;
  message: string;
  actionUrl?: string;
  actionLabel?: string;
  metadata?: Record<string, unknown>;
}

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  actionUrl?: string;
  actionLabel?: string;
  metadata: Record<string, unknown>;
  read: boolean;
  readAt?: Date;
  createdAt: Date;
}

/**
 * Create a notification for a user
 */
export async function createNotification(
  userId: string,
  data: NotificationData
): Promise<void> {
  try {
    const supabase = await createClient();

    const { error } = await supabase.from("notifications").insert({
      user_id: userId,
      type: data.type,
      title: data.title,
      message: data.message,
      action_url: data.actionUrl || null,
      action_label: data.actionLabel || null,
      metadata: data.metadata || {},
      read: false,
    });

    if (error) {
      console.error("Failed to create notification:", error);
    }
  } catch (error) {
    console.error("Error creating notification:", error);
  }
}

/**
 * Create notifications for multiple users
 */
export async function createNotifications(
  userIds: string[],
  data: NotificationData
): Promise<void> {
  try {
    const supabase = await createClient();

    const notifications = userIds.map((userId) => ({
      user_id: userId,
      type: data.type,
      title: data.title,
      message: data.message,
      action_url: data.actionUrl || null,
      action_label: data.actionLabel || null,
      metadata: data.metadata || {},
      read: false,
    }));

    const { error } = await supabase.from("notifications").insert(notifications);

    if (error) {
      console.error("Failed to create notifications:", error);
    }
  } catch (error) {
    console.error("Error creating notifications:", error);
  }
}

/**
 * Get notifications for the current user
 */
export async function getNotifications(
  limit: number = 20,
  unreadOnly: boolean = false
): Promise<Notification[]> {
  try {
    const supabase = await createClient();

    // Get current user
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return [];
    }

    // Get user ID
    const { data: userData } = await supabase
      .from("users")
      .select("id")
      .eq("auth_id", user.id)
      .single();

    if (!userData) {
      return [];
    }

    // Build query
    let query = supabase
      .from("notifications")
      .select("*")
      .eq("user_id", userData.id)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (unreadOnly) {
      query = query.eq("read", false);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Failed to fetch notifications:", error);
      return [];
    }

    return (data || []).map((n) => ({
      id: n.id,
      type: n.type as NotificationType,
      title: n.title,
      message: n.message,
      actionUrl: n.action_url,
      actionLabel: n.action_label,
      metadata: n.metadata as Record<string, unknown>,
      read: n.read,
      readAt: n.read_at ? new Date(n.read_at) : undefined,
      createdAt: new Date(n.created_at),
    }));
  } catch (error) {
    console.error("Error fetching notifications:", error);
    return [];
  }
}

/**
 * Get unread notification count
 */
export async function getUnreadCount(): Promise<number> {
  try {
    const supabase = await createClient();

    // Get current user
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return 0;
    }

    // Get user ID
    const { data: userData } = await supabase
      .from("users")
      .select("id")
      .eq("auth_id", user.id)
      .single();

    if (!userData) {
      return 0;
    }

    const { count, error } = await supabase
      .from("notifications")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userData.id)
      .eq("read", false);

    if (error) {
      console.error("Failed to get unread count:", error);
      return 0;
    }

    return count || 0;
  } catch (error) {
    console.error("Error getting unread count:", error);
    return 0;
  }
}

/**
 * Mark notification as read
 */
export async function markAsRead(notificationId: string): Promise<void> {
  try {
    const supabase = await createClient();

    const { error } = await supabase
      .from("notifications")
      .update({
        read: true,
        read_at: new Date().toISOString(),
      })
      .eq("id", notificationId);

    if (error) {
      console.error("Failed to mark notification as read:", error);
    }
  } catch (error) {
    console.error("Error marking notification as read:", error);
  }
}

/**
 * Mark all notifications as read
 */
export async function markAllAsRead(): Promise<void> {
  try {
    const supabase = await createClient();

    // Get current user
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return;
    }

    // Get user ID
    const { data: userData } = await supabase
      .from("users")
      .select("id")
      .eq("auth_id", user.id)
      .single();

    if (!userData) {
      return;
    }

    const { error } = await supabase
      .from("notifications")
      .update({
        read: true,
        read_at: new Date().toISOString(),
      })
      .eq("user_id", userData.id)
      .eq("read", false);

    if (error) {
      console.error("Failed to mark all notifications as read:", error);
    }
  } catch (error) {
    console.error("Error marking all notifications as read:", error);
  }
}

/**
 * Notification content templates
 */
export const NotificationTemplates = {
  briefReceived: (clientName: string, source: string): NotificationData => ({
    type: "brief_received",
    title: "New Brief Received",
    message: `New brief from ${clientName} via ${source}`,
    actionLabel: "View Brief",
  }),

  briefParsed: (position: string, confidence: number): NotificationData => ({
    type: "brief_parsed",
    title: "Brief Parsed",
    message: `Brief for ${position} parsed with ${confidence}% confidence`,
    actionLabel: "Review",
  }),

  briefNeedsClarification: (clientName: string): NotificationData => ({
    type: "brief_needs_clarification",
    title: "Brief Needs Clarification",
    message: `Brief from ${clientName} requires clarification`,
    actionLabel: "View Brief",
  }),

  jobMatchReady: (jobTitle: string, matchCount: number): NotificationData => ({
    type: "job_match_ready",
    title: "AI Matching Complete",
    message: `Found ${matchCount} candidates for ${jobTitle}`,
    actionLabel: "View Matches",
  }),

  candidateSubmitted: (candidateName: string, jobTitle: string): NotificationData => ({
    type: "candidate_submitted",
    title: "Candidate Submitted",
    message: `${candidateName} submitted for ${jobTitle}`,
    actionLabel: "View Submission",
  }),

  interviewScheduled: (
    candidateName: string,
    jobTitle: string,
    date: string
  ): NotificationData => ({
    type: "candidate_interview_scheduled",
    title: "Interview Scheduled",
    message: `Interview scheduled with ${candidateName} for ${jobTitle} on ${date}`,
    actionLabel: "View Details",
  }),

  feedbackReceived: (candidateName: string, clientName: string): NotificationData => ({
    type: "candidate_feedback_received",
    title: "Feedback Received",
    message: `${clientName} provided feedback on ${candidateName}`,
    actionLabel: "View Feedback",
  }),

  candidatePlaced: (candidateName: string, jobTitle: string): NotificationData => ({
    type: "candidate_placed",
    title: "Placement Confirmed!",
    message: `${candidateName} placed for ${jobTitle}`,
    actionLabel: "View Placement",
  }),

  documentExpiring: (
    documentType: string,
    candidateName: string,
    daysUntilExpiry: number
  ): NotificationData => ({
    type: "document_expiring",
    title: "Document Expiring",
    message: `${documentType} for ${candidateName} expires in ${daysUntilExpiry} days`,
    actionLabel: "View Document",
  }),
};
