import { redirect } from "next/navigation";
import { getClientSession } from "@/lib/auth/client-actions";
import { ClientPortalLayout } from "./client-portal-layout";

export default async function ClientProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getClientSession();

  if (!session) {
    redirect("/client/auth/login");
  }

  return (
    <ClientPortalLayout session={session}>
      {children}
    </ClientPortalLayout>
  );
}
