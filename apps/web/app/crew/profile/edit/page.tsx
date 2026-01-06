import { getProfileData } from "../actions";
import { redirect } from "next/navigation";
import { ProfileEditClient } from "./profile-edit-client";

export default async function ProfileEditPage({
  searchParams,
}: {
  searchParams?: { redirect?: string };
}) {
  const profileData = await getProfileData();
  const redirectTo = searchParams?.redirect;

  if (!profileData) {
    // Not authenticated or no candidate profile
    redirect("/auth/login?redirect=/crew/profile/edit");
  }

  return <ProfileEditClient data={profileData} redirectTo={redirectTo} />;
}
