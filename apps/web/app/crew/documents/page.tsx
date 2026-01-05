import { getDocumentsData } from "./actions";
import { redirect } from "next/navigation";
import { DocumentsClient } from "./documents-client";

export default async function DocumentsPage() {
  const documentsData = await getDocumentsData();

  if (!documentsData) {
    // Not authenticated or no candidate profile
    redirect("/auth/login?redirect=/crew/documents");
  }

  return <DocumentsClient data={documentsData} />;
}
