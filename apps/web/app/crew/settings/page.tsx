import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getSettingsData } from "./actions";
import { SettingsClient } from "./settings-client";

export const metadata = {
  title: "Settings | Lighthouse Crew Network",
  description: "Manage your account settings and preferences",
};

export default async function CrewSettingsPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login?redirect=/crew/settings");
  }

  // Get user record
  const { data: userData } = await supabase
    .from("users")
    .select("id")
    .eq("auth_id", user.id)
    .single();

  if (!userData) {
    redirect("/auth/login?redirect=/crew/settings");
  }

  // Get candidate profile
  const { data: candidate } = await supabase
    .from("candidates")
    .select("id")
    .eq("user_id", userData.id)
    .single();

  if (!candidate) {
    redirect("/auth/register");
  }

  const settings = await getSettingsData();

  if (!settings) {
    redirect("/auth/login?redirect=/crew/settings");
  }

  return <SettingsClient initialSettings={settings} />;
}
