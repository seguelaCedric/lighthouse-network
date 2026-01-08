import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { MainLayoutClient } from "./layout-client";

export default async function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();

  // Check authentication
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect("/auth/login");
  }

  // Get user's user_type to prevent candidates from accessing agency routes
  const { data: userData } = await supabase
    .from("users")
    .select("user_type")
    .eq("auth_id", user.id)
    .single();

  // Prevent candidates from accessing agency dashboard and routes
  if (userData?.user_type === "candidate") {
    redirect("/crew/dashboard?redirected=agency_access");
  }

  return <MainLayoutClient>{children}</MainLayoutClient>;
}
