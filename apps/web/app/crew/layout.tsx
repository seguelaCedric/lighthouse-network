import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { CrewPortalLayout, type CrewUser } from "./crew-portal-layout";

/**
 * Count all unread notifications:
 * - Expiring/expired certifications (within 90 days)
 * - Application status updates (placed/rejected within 30 days)
 */
async function getNotificationCount(
  supabase: Awaited<ReturnType<typeof createClient>>,
  candidateId: string,
  stcwExpiry: string | null,
  eng1Expiry: string | null
): Promise<number> {
  let count = 0;
  const now = new Date();
  const ninetyDaysFromNow = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000);
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  // Check STCW expiry (warning if expiring within 90 days or already expired)
  if (stcwExpiry) {
    const expiry = new Date(stcwExpiry);
    if (expiry <= ninetyDaysFromNow) count++;
  }

  // Check ENG1 expiry
  if (eng1Expiry) {
    const expiry = new Date(eng1Expiry);
    if (expiry <= ninetyDaysFromNow) count++;
  }

  // PERFORMANCE: Run both queries in parallel
  const [certsResult, appCountResult] = await Promise.all([
    // Check other certifications (exclude STCW/ENG1 to avoid double counting)
    supabase
      .from("candidate_certifications")
      .select("id, certification_type, custom_name, expiry_date")
      .eq("candidate_id", candidateId)
      .eq("has_certification", true)
      .not("expiry_date", "is", null)
      .lte("expiry_date", ninetyDaysFromNow.toISOString().split("T")[0]),
    // Count recent application status updates (placed/rejected)
    supabase
      .from("applications")
      .select("id", { count: "exact", head: true })
      .eq("candidate_id", candidateId)
      .in("stage", ["placed", "rejected"])
      .gte("updated_at", thirtyDaysAgo.toISOString()),
  ]);

  // Filter out STCW/ENG1 duplicates
  const otherCerts = (certsResult.data || []).filter((cert) => {
    const name = cert.custom_name || cert.certification_type;
    const nameLower = name.toLowerCase();
    return !nameLower.includes("stcw") && !nameLower.includes("eng1");
  });
  count += otherCerts.length;

  count += appCountResult.count || 0;

  return count;
}

export default async function CrewLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();

  // Check authentication
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login?redirect=/crew/dashboard");
  }

  // PERFORMANCE: Run both lookups in parallel instead of sequential
  // This reduces 3 sequential queries to 2 parallel queries
  const candidateFields =
    "id, first_name, last_name, email, primary_position, avatar_url, availability_status, stcw_expiry, eng1_expiry";

  const [userResult, candidateByEmailResult] = await Promise.all([
    // Strategy 1: Look up via users table
    supabase.from("users").select("id").eq("auth_id", user.id).maybeSingle(),
    // Strategy 2: Look up candidate by email (for Vincere imports)
    supabase
      .from("candidates")
      .select(candidateFields)
      .eq("email", user.email)
      .maybeSingle(),
  ]);

  let candidate = candidateByEmailResult.data;

  // If we have a user record, try to find candidate by user_id (more authoritative)
  if (userResult.data && !candidate) {
    const { data: candidateByUserId } = await supabase
      .from("candidates")
      .select(candidateFields)
      .eq("user_id", userResult.data.id)
      .maybeSingle();

    candidate = candidateByUserId;
  }

  if (!candidate) {
    // User is logged in but doesn't have a candidate profile
    // Redirect to registration page
    redirect("/auth/register?redirect=/crew/dashboard");
  }

  // Get notification count (runs after candidate is found, but uses parallel queries internally)
  const notificationCount = await getNotificationCount(
    supabase,
    candidate.id,
    candidate.stcw_expiry,
    candidate.eng1_expiry
  );

  // Transform to CrewUser type
  const crewUser: CrewUser = {
    id: candidate.id,
    firstName: candidate.first_name,
    lastName: candidate.last_name,
    email: candidate.email,
    primaryPosition: candidate.primary_position,
    profilePhotoUrl: candidate.avatar_url,
    availabilityStatus: candidate.availability_status,
  };

  return (
    <CrewPortalLayout user={crewUser} notificationCount={notificationCount}>
      {children}
    </CrewPortalLayout>
  );
}
