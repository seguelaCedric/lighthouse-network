import { getNotificationsData } from "./actions";
import { redirect } from "next/navigation";
import { NotificationsClient } from "./notifications-client";

export const metadata = {
  title: "Notifications | Lighthouse Crew Network",
  description: "View your notifications and alerts",
};

export default async function NotificationsPage() {
  const data = await getNotificationsData();

  if (!data) {
    redirect("/auth/login?redirect=/crew/notifications");
  }

  return <NotificationsClient data={data} />;
}
