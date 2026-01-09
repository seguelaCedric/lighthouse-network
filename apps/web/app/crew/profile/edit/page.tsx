import { getProfileData } from "../actions";
import { redirect } from "next/navigation";
import { ProfileEditClient } from "./profile-edit-client";

export default async function ProfileEditPage({
  searchParams,
}: {
  searchParams?: Promise<{ redirect?: string }>;
}) {
  const profileData = await getProfileData();
  const resolvedParams = await searchParams;
  const redirectTo = resolvedParams?.redirect;

  if (!profileData) {
    // Not authenticated or no candidate profile
    redirect("/auth/login?redirect=/crew/profile/edit");
  }

  return <ProfileEditClient data={profileData} redirectTo={redirectTo} />;
}
