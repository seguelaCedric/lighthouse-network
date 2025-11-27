import { redirect } from "next/navigation";
import { getClientSession } from "@/lib/auth/client-actions";

export default async function ClientPage() {
  const session = await getClientSession();

  if (session) {
    redirect("/client/dashboard");
  } else {
    redirect("/client/auth/login");
  }
}
