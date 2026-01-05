import { getProfileData } from "../actions";
import { redirect } from "next/navigation";
import { ProfileEditClient } from "./profile-edit-client";

export default async function ProfileEditPage() {
  const profileData = await getProfileData();

  if (!profileData) {
    // Not authenticated or no candidate profile
    redirect("/auth/login?redirect=/crew/profile/edit");
  }

  return <ProfileEditClient data={profileData} />;
}
