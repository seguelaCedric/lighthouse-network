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
      .select("id")
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
      .select("id")
      .eq("email", user.email)
      .maybeSingle();

    if (candidateByEmail) {
      candidate = candidateByEmail;
    }
  }

  if (!candidate) {
    redirect("/auth/register");
  }

  const settings = await getSettingsData();

  if (!settings) {
    redirect("/auth/login?redirect=/crew/settings");
  }

  return <SettingsClient initialSettings={settings} />;
}
