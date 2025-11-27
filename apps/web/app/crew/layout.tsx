import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { CrewPortalLayout, type CrewUser } from "./crew-portal-layout";

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

  // Get the user record first
  const { data: userData } = await supabase
    .from("users")
    .select("id")
    .eq("auth_id", user.id)
    .single();

  if (!userData) {
    redirect("/auth/login?redirect=/crew/dashboard");
  }

  // Get candidate profile
  const { data: candidate } = await supabase
    .from("candidates")
    .select(
      "id, first_name, last_name, email, primary_position, profile_photo_url, availability_status"
    )
    .eq("user_id", userData.id)
    .single();

  if (!candidate) {
    // User is logged in but doesn't have a candidate profile
    // Redirect to onboarding or registration
    redirect("/crew/register");
  }

  // Transform to CrewUser type
  const crewUser: CrewUser = {
    id: candidate.id,
    firstName: candidate.first_name,
    lastName: candidate.last_name,
    email: candidate.email,
    primaryPosition: candidate.primary_position,
    profilePhotoUrl: candidate.profile_photo_url,
    availabilityStatus: candidate.availability_status,
  };

  return <CrewPortalLayout user={crewUser}>{children}</CrewPortalLayout>;
}
