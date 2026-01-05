import { getJobsData } from "./actions";
import { redirect } from "next/navigation";
import { JobsClient } from "./jobs-client";

export default async function JobsPage() {
  const jobsData = await getJobsData();

  if (!jobsData) {
    redirect("/auth/login?redirect=/crew/jobs");
  }

  return <JobsClient data={jobsData} />;
}
