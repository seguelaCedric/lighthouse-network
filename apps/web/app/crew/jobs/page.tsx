import { getJobsData } from "./actions";
import { redirect } from "next/navigation";
import { JobsClient } from "./jobs-client";

export default async function JobsPage() {
  // Fetch all active jobs (no limit, or high limit to cover all jobs)
  const jobsData = await getJobsData(undefined, 1, 100);

  if (!jobsData) {
    redirect("/auth/login?redirect=/crew/jobs");
  }

  return <JobsClient data={jobsData} />;
}
