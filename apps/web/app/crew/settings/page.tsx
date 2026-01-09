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

  // PERFORMANCE: Run user and candidate-by-email lookups in parallel
  const [userResult, candidateByEmailResult] = await Promise.all([
    supabase.from("users").select("id").eq("auth_id", user.id).maybeSingle(),
    user.email
      ? supabase.from("candidates").select("id").eq("email", user.email).maybeSingle()
      : Promise.resolve({ data: null }),
  ]);

  let candidate = candidateByEmailResult.data;

  // If we have a user record but no candidate yet, try by user_id
  if (userResult.data && !candidate) {
    const { data: candidateByUserId } = await supabase
      .from("candidates")
      .select("id")
      .eq("user_id", userResult.data.id)
      .maybeSingle();

    candidate = candidateByUserId;
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
