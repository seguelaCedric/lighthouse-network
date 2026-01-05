import { getDashboardData } from "./actions";
import { redirect } from "next/navigation";
import { DashboardClient } from "./dashboard-client";

export default async function CrewDashboardPage() {
  const dashboardData = await getDashboardData();

  if (!dashboardData) {
    // Not authenticated or no candidate profile
    redirect("/auth/login?redirect=/crew/dashboard");
  }

  return <DashboardClient data={dashboardData} />;
}
