"use server";

import { createClient } from "@/lib/supabase/server";

/**
 * Notification types for crew members
 */
export interface CrewNotification {
  id: string;
  type: "certification" | "application" | "message" | "system";
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

  // Check STCW expiry
  if (candidate.stcw_expiry) {
    const stcwExpiry = new Date(candidate.stcw_expiry);
    const isExpired = stcwExpiry < now;
    const isUrgent = stcwExpiry <= thirtyDaysFromNow;
    const isWarning = stcwExpiry <= ninetyDaysFromNow;

    if (isExpired || isWarning) {
      notifications.push({
        id: "stcw-expiry",
        type: "certification",
        title: isExpired ? "STCW Certificate Expired" : "STCW Expiring Soon",
        description: isExpired
          ? `Your STCW certificate expired on ${stcwExpiry.toLocaleDateString("en-GB")}. Please renew immediately.`
          : `Your STCW certificate expires on ${stcwExpiry.toLocaleDateString("en-GB")}. ${isUrgent ? "Renew now to avoid gaps." : "Consider renewing soon."}`,
        date: now.toISOString(),
        urgent: isExpired || isUrgent,
        isRead: false,
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

    if (isExpired || isWarning) {
      notifications.push({
        id: "eng1-expiry",
        type: "certification",
        title: isExpired ? "ENG1 Medical Certificate Expired" : "ENG1 Expiring Soon",
        description: isExpired
          ? `Your ENG1 medical certificate expired on ${eng1Expiry.toLocaleDateString("en-GB")}. Please renew immediately.`
          : `Your ENG1 medical certificate expires on ${eng1Expiry.toLocaleDateString("en-GB")}. ${isUrgent ? "Book your renewal appointment now." : "Consider scheduling your renewal."}`,
        date: now.toISOString(),
        urgent: isExpired || isUrgent,
        isRead: false,
        actionLabel: "Update Certificate",
        actionHref: "/crew/documents#certificates",
        metadata: {
          certName: "ENG1",
          expiryDate: candidate.eng1_expiry,
        },
      });
    }
  }

  // Get certifications from certifications table for expiry alerts
  const { data: certifications } = await supabase
    .from("certifications")
    .select("id, name, expiry_date")
    .eq("candidate_id", candidate.id)
    .not("expiry_date", "is", null)
    .lte("expiry_date", ninetyDaysFromNow.toISOString().split("T")[0])
    .order("expiry_date", { ascending: true });

  for (const cert of certifications || []) {
    if (cert.expiry_date) {
      const expiryDate = new Date(cert.expiry_date);
      const isExpired = expiryDate < now;
      const isUrgent = expiryDate <= thirtyDaysFromNow;

      // Avoid duplicate alerts for STCW/ENG1 (already handled above)
      const certNameLower = cert.name.toLowerCase();
      if (certNameLower.includes("stcw") || certNameLower.includes("eng1")) {
        continue;
      }

      notifications.push({
        id: `cert-${cert.id}`,
        type: "certification",
        title: isExpired ? `${cert.name} Expired` : `${cert.name} Expiring`,
        description: isExpired
          ? `Your ${cert.name} expired on ${expiryDate.toLocaleDateString("en-GB")}.`
          : `Your ${cert.name} expires on ${expiryDate.toLocaleDateString("en-GB")}.`,
        date: now.toISOString(),
        urgent: isExpired || isUrgent,
        isRead: false,
        actionLabel: "Update Certificate",
        actionHref: "/crew/documents#certificates",
        metadata: {
          certName: cert.name,
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
      notifications.push({
        id: `app-placed-${app.id}`,
        type: "application",
        title: "Congratulations! You've Been Placed",
        description: `You have been placed for the ${jobData.title} position.`,
        date: app.updated_at,
        urgent: false,
        isRead: false,
        actionLabel: "View Details",
        actionHref: `/crew/applications/${app.id}`,
        metadata: {
          jobTitle: jobData.title,
          applicationId: app.id,
        },
      });
    } else if (app.stage === "rejected") {
      notifications.push({
        id: `app-rejected-${app.id}`,
        type: "application",
        title: "Application Update",
        description: `Unfortunately, your application for ${jobData.title} was not successful this time.`,
        date: app.updated_at,
        urgent: false,
        isRead: false,
        actionLabel: "Browse More Jobs",
        actionHref: "/crew/jobs",
        metadata: {
          jobTitle: jobData.title,
          applicationId: app.id,
        },
      });
    }
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
