import { notFound, redirect } from "next/navigation";
import { getJobById } from "../actions";
import { JobDetailClient } from "./job-detail-client";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function JobDetailPage({ params }: PageProps) {
  const { id } = await params;
  const job = await getJobById(id);

  if (job === null) {
    // Check if user is not authenticated vs job not found
    // If getJobById returns null due to auth, redirect to login
    redirect("/auth/login?redirect=/crew/jobs/" + id);
  }

  if (!job) {
    notFound();
  }

  return <JobDetailClient job={job} />;
}
