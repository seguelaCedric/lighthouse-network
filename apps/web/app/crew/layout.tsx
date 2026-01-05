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

  // Check other certifications (exclude STCW/ENG1 to avoid double counting)
  const { data: certs } = await supabase
    .from("certifications")
    .select("id, name")
    .eq("candidate_id", candidateId)
    .not("expiry_date", "is", null)
    .lte("expiry_date", ninetyDaysFromNow.toISOString().split("T")[0]);

  // Filter out STCW/ENG1 duplicates
  const otherCerts = (certs || []).filter((cert) => {
    const nameLower = cert.name.toLowerCase();
    return !nameLower.includes("stcw") && !nameLower.includes("eng1");
  });
  count += otherCerts.length;

  // Count recent application status updates (placed/rejected)
  const { count: appCount } = await supabase
    .from("applications")
    .select("id", { count: "exact", head: true })
    .eq("candidate_id", candidateId)
    .in("stage", ["placed", "rejected"])
    .gte("updated_at", thirtyDaysAgo.toISOString());

  count += appCount || 0;

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

  // Get candidate profile - try multiple lookup strategies
  // This handles both linked users and Vincere imports without user_id
  let candidate = null;

  // Strategy 1: Look up via users table -> candidates.user_id
  const { data: userData } = await supabase
    .from("users")
    .select("id")
    .eq("auth_id", user.id)
    .maybeSingle();

  if (userData) {
    const { data: candidateByUserId } = await supabase
      .from("candidates")
      .select(
        "id, first_name, last_name, email, primary_position, avatar_url, availability_status, stcw_expiry, eng1_expiry"
      )
      .eq("user_id", userData.id)
      .maybeSingle();

    candidate = candidateByUserId;
  }

  // Strategy 2: If not found by user_id, try by email (handles Vincere imports)
  if (!candidate) {
    const { data: candidateByEmail } = await supabase
      .from("candidates")
      .select(
        "id, first_name, last_name, email, primary_position, avatar_url, availability_status, stcw_expiry, eng1_expiry"
      )
      .eq("email", user.email)
      .maybeSingle();

    candidate = candidateByEmail;
  }

  if (!candidate) {
    // User is logged in but doesn't have a candidate profile
    // Redirect to registration page
    redirect("/auth/register?redirect=/crew/dashboard");
  }

  // Get notification count
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
