"use server";

import { createClient } from "@/lib/supabase/server";

/**
 * Notification types for crew members
 */
export interface CrewNotification {
  id: string;
  type: "certification" | "application" | "message" | "system" | "job_alert";
  title: string;
  description: string;
  date: string;
  urgent: boolean;
  isRead: boolean;
  actionLabel?: string;
  actionHref?: string;
  metadata?: {
    certName?: string;
    expiryDate?: string;
    jobTitle?: string;
    applicationId?: string;
    jobId?: string;
    vesselName?: string;
    matchedPosition?: string;
  };
}

export interface NotificationsData {
  notifications: CrewNotification[];
  unreadCount: number;
}

/**
 * Fetch notifications for the authenticated candidate
 */
export async function getNotificationsData(): Promise<NotificationsData | null> {
  const supabase = await createClient();

  // Get authenticated user
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  // Get user record (auth_id -> user_id mapping)
  const { data: userData } = await supabase
    .from("users")
    .select("id")
    .eq("auth_id", user.id)
    .maybeSingle();

  let candidate = null;

  // Try to find candidate by user_id if user record exists
  if (userData) {
    const { data: candidateByUserId } = await supabase
      .from("candidates")
      .select(
        `
        id,
        has_stcw,
        stcw_expiry,
        has_eng1,
        eng1_expiry
      `
      )
      .eq("user_id", userData.id)
      .maybeSingle();

    if (candidateByUserId) {
      candidate = candidateByUserId;
    }
  }

  // Fallback: Try to find candidate by email (for Vincere-imported candidates)
  if (!candidate && user.email) {
    const { data: candidateByEmail } = await supabase
      .from("candidates")
      .select(
        `
        id,
        has_stcw,
        stcw_expiry,
        has_eng1,
        eng1_expiry
      `
      )
      .eq("email", user.email)
      .maybeSingle();

    if (candidateByEmail) {
      candidate = candidateByEmail;
    }
  }

  if (!candidate) return null;

  const notifications: CrewNotification[] = [];
  const now = new Date();
  const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
  const ninetyDaysFromNow = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000);

  // Fetch dismissed notification keys for computed notifications
  const { data: dismissals } = await supabase
    .from("notification_dismissals")
    .select("notification_key")
    .eq("candidate_id", candidate.id);

  const dismissedKeys = new Set((dismissals || []).map((d) => d.notification_key));

  // Check STCW expiry
  if (candidate.stcw_expiry) {
    const stcwExpiry = new Date(candidate.stcw_expiry);
    const isExpired = stcwExpiry < now;
    const isUrgent = stcwExpiry <= thirtyDaysFromNow;
    const isWarning = stcwExpiry <= ninetyDaysFromNow;
    const notificationKey = "stcw-expiry";
    const isDismissed = dismissedKeys.has(notificationKey);

    if (isExpired || isWarning) {
      notifications.push({
        id: notificationKey,
        type: "certification",
        title: isExpired ? "STCW Certificate Expired" : "STCW Expiring Soon",
        description: isExpired
          ? `Your STCW certificate expired on ${stcwExpiry.toLocaleDateString("en-GB")}. Please renew immediately.`
          : `Your STCW certificate expires on ${stcwExpiry.toLocaleDateString("en-GB")}. ${isUrgent ? "Renew now to avoid gaps." : "Consider renewing soon."}`,
        date: now.toISOString(),
        urgent: isExpired || isUrgent,
        isRead: isDismissed,
        actionLabel: "Update Certificate",
        actionHref: "/crew/documents#certificates",
        metadata: {
          certName: "STCW",
          expiryDate: candidate.stcw_expiry,
        },
      });
    }
  }

  // Check ENG1 expiry
  if (candidate.eng1_expiry) {
    const eng1Expiry = new Date(candidate.eng1_expiry);
    const isExpired = eng1Expiry < now;
    const isUrgent = eng1Expiry <= thirtyDaysFromNow;
    const isWarning = eng1Expiry <= ninetyDaysFromNow;
    const notificationKey = "eng1-expiry";
    const isDismissed = dismissedKeys.has(notificationKey);

    if (isExpired || isWarning) {
      notifications.push({
        id: notificationKey,
        type: "certification",
        title: isExpired ? "ENG1 Medical Certificate Expired" : "ENG1 Expiring Soon",
        description: isExpired
          ? `Your ENG1 medical certificate expired on ${eng1Expiry.toLocaleDateString("en-GB")}. Please renew immediately.`
          : `Your ENG1 medical certificate expires on ${eng1Expiry.toLocaleDateString("en-GB")}. ${isUrgent ? "Book your renewal appointment now." : "Consider scheduling your renewal."}`,
        date: now.toISOString(),
        urgent: isExpired || isUrgent,
        isRead: isDismissed,
        actionLabel: "Update Certificate",
        actionHref: "/crew/documents#certificates",
        metadata: {
          certName: "ENG1",
          expiryDate: candidate.eng1_expiry,
        },
      });
    }
  }

  // Get certifications from candidate_certifications for expiry alerts
  const { data: certifications } = await supabase
    .from("candidate_certifications")
    .select("id, certification_type, custom_name, expiry_date")
    .eq("candidate_id", candidate.id)
    .eq("has_certification", true)
    .not("expiry_date", "is", null)
    .lte("expiry_date", ninetyDaysFromNow.toISOString().split("T")[0])
    .order("expiry_date", { ascending: true });

  for (const cert of certifications || []) {
    if (cert.expiry_date) {
      const expiryDate = new Date(cert.expiry_date);
      const isExpired = expiryDate < now;
      const isUrgent = expiryDate <= thirtyDaysFromNow;

      // Avoid duplicate alerts for STCW/ENG1 (already handled above)
      const certName = cert.custom_name || cert.certification_type;
      const certNameLower = certName.toLowerCase();
      if (certNameLower.includes("stcw") || certNameLower.includes("eng1")) {
        continue;
      }

      const notificationKey = `cert-${cert.id}`;
      const isDismissed = dismissedKeys.has(notificationKey);

      notifications.push({
        id: notificationKey,
        type: "certification",
        title: isExpired ? `${certName} Expired` : `${certName} Expiring`,
        description: isExpired
          ? `Your ${certName} expired on ${expiryDate.toLocaleDateString("en-GB")}.`
          : `Your ${certName} expires on ${expiryDate.toLocaleDateString("en-GB")}.`,
        date: now.toISOString(),
        urgent: isExpired || isUrgent,
        isRead: isDismissed,
        actionLabel: "Update Certificate",
        actionHref: "/crew/documents#certificates",
        metadata: {
          certName,
          expiryDate: cert.expiry_date,
        },
      });
    }
  }

  // Get recent application status updates (from the last 30 days)
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const { data: applications } = await supabase
    .from("applications")
    .select(
      `
      id,
      stage,
      updated_at,
      job:jobs (
        id,
        title
      )
    `
    )
    .eq("candidate_id", candidate.id)
    .gte("updated_at", thirtyDaysAgo.toISOString())
    .order("updated_at", { ascending: false })
    .limit(10);

  for (const app of applications || []) {
    const jobData = Array.isArray(app.job) ? app.job[0] : app.job;
    if (!jobData) continue;

    // Only notify for significant stage changes
    if (app.stage === "placed") {
      const notificationKey = `app-placed-${app.id}`;
      const isDismissed = dismissedKeys.has(notificationKey);

      notifications.push({
        id: notificationKey,
        type: "application",
        title: "Congratulations! You've Been Placed",
        description: `You have been placed for the ${jobData.title} position.`,
        date: app.updated_at,
        urgent: false,
        isRead: isDismissed,
        actionLabel: "View Details",
        actionHref: `/crew/applications/${app.id}`,
        metadata: {
          jobTitle: jobData.title,
          applicationId: app.id,
        },
      });
    } else if (app.stage === "rejected") {
      const notificationKey = `app-rejected-${app.id}`;
      const isDismissed = dismissedKeys.has(notificationKey);

      notifications.push({
        id: notificationKey,
        type: "application",
        title: "Application Update",
        description: `Unfortunately, your application for ${jobData.title} was not successful this time.`,
        date: app.updated_at,
        urgent: false,
        isRead: isDismissed,
        actionLabel: "Browse More Jobs",
        actionHref: "/crew/jobs",
        metadata: {
          jobTitle: jobData.title,
          applicationId: app.id,
        },
      });
    }
  }

  // Get job alert notifications from the database (from the last 30 days)
  const { data: jobAlertNotifications } = await supabase
    .from("candidate_notifications")
    .select("*")
    .eq("candidate_id", candidate.id)
    .eq("type", "job_alert")
    .gte("created_at", thirtyDaysAgo.toISOString())
    .order("created_at", { ascending: false })
    .limit(20);

  for (const notification of jobAlertNotifications || []) {
    const metadata = notification.metadata as Record<string, unknown> || {};
    notifications.push({
      id: notification.id,
      type: "job_alert",
      title: notification.title,
      description: notification.description,
      date: notification.created_at,
      urgent: false,
      isRead: notification.is_read || false,
      actionLabel: notification.action_label || "View Job",
      actionHref: notification.action_url || `/crew/jobs/${notification.entity_id}`,
      metadata: {
        jobTitle: metadata.job_title as string,
        jobId: notification.entity_id,
        vesselName: metadata.vessel_name as string,
        matchedPosition: metadata.matched_position as string,
      },
    });
  }

  // Sort notifications: urgent first, then by date (newest first)
  notifications.sort((a, b) => {
    if (a.urgent !== b.urgent) return a.urgent ? -1 : 1;
    return new Date(b.date).getTime() - new Date(a.date).getTime();
  });

  return {
    notifications,
    unreadCount: notifications.filter((n) => !n.isRead).length,
  };
}

/**
 * Mark a notification as read
 */
export async function markNotificationAsRead(notificationId: string): Promise<boolean> {
  const supabase = await createClient();

  // Get authenticated user
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return false;

  // Check if this is a computed notification (certificates, applications)
  const isComputedNotification =
    notificationId.startsWith("stcw-") ||
    notificationId.startsWith("eng1-") ||
    notificationId.startsWith("cert-") ||
    notificationId.startsWith("app-");

  if (isComputedNotification) {
    // For computed notifications, insert into dismissals table
    // First get the candidate ID
    const { data: userData } = await supabase
      .from("users")
      .select("id")
      .eq("auth_id", user.id)
      .maybeSingle();

    let candidateId = null;

    if (userData) {
      const { data: candidateByUserId } = await supabase
        .from("candidates")
        .select("id")
        .eq("user_id", userData.id)
        .maybeSingle();
      candidateId = candidateByUserId?.id;
    }

    if (!candidateId && user.email) {
      const { data: candidateByEmail } = await supabase
        .from("candidates")
        .select("id")
        .eq("email", user.email)
        .maybeSingle();
      candidateId = candidateByEmail?.id;
    }

    if (!candidateId) return false;

    // Insert dismissal (upsert to handle duplicates)
    const { error } = await supabase
      .from("notification_dismissals")
      .upsert({
        candidate_id: candidateId,
        notification_key: notificationId,
        dismissed_at: new Date().toISOString(),
      }, {
        onConflict: "candidate_id,notification_key",
      });

    if (error) {
      console.error("Error dismissing notification:", error);
      return false;
    }
  } else {
    // For stored notifications (job alerts), update the candidate_notifications table
    const { error } = await supabase
      .from("candidate_notifications")
      .update({
        is_read: true,
        read_at: new Date().toISOString()
      })
      .eq("id", notificationId);

    if (error) {
      console.error("Error marking notification as read:", error);
      return false;
    }
  }

  return true;
}

/**
 * Mark all notifications as read for a candidate
 * @param computedNotificationIds - Optional list of computed notification IDs to dismiss
 */
export async function markAllNotificationsAsRead(computedNotificationIds?: string[]): Promise<boolean> {
  const supabase = await createClient();

  // Get authenticated user
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return false;

  // Get user record
  const { data: userData } = await supabase
    .from("users")
    .select("id")
    .eq("auth_id", user.id)
    .maybeSingle();

  let candidate = null;

  if (userData) {
    const { data: candidateByUserId } = await supabase
      .from("candidates")
      .select("id")
      .eq("user_id", userData.id)
      .maybeSingle();
    candidate = candidateByUserId;
  }

  if (!candidate && user.email) {
    const { data: candidateByEmail } = await supabase
      .from("candidates")
      .select("id")
      .eq("email", user.email)
      .maybeSingle();
    candidate = candidateByEmail;
  }

  if (!candidate) return false;

  // Mark all stored notifications (job alerts) as read
  const { error: storedError } = await supabase
    .from("candidate_notifications")
    .update({
      is_read: true,
      read_at: new Date().toISOString()
    })
    .eq("candidate_id", candidate.id)
    .eq("is_read", false);

  if (storedError) {
    console.error("Error marking stored notifications as read:", storedError);
    return false;
  }

  // If we have computed notification IDs, dismiss them too
  if (computedNotificationIds && computedNotificationIds.length > 0) {
    const dismissals = computedNotificationIds
      .filter(id =>
        id.startsWith("stcw-") ||
        id.startsWith("eng1-") ||
        id.startsWith("cert-") ||
        id.startsWith("app-")
      )
      .map(notificationKey => ({
        candidate_id: candidate.id,
        notification_key: notificationKey,
        dismissed_at: new Date().toISOString(),
      }));

    if (dismissals.length > 0) {
      const { error: dismissalError } = await supabase
        .from("notification_dismissals")
        .upsert(dismissals, {
          onConflict: "candidate_id,notification_key",
        });

      if (dismissalError) {
        console.error("Error dismissing computed notifications:", dismissalError);
        // Don't fail completely, stored notifications were marked
      }
    }
  }

  return true;
}
