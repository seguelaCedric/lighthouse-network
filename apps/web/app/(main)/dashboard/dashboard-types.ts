import type { BriefStatus } from "@lighthouse/database";

export interface DashboardStats {
  newBriefsCount: number;
  openJobsCount: number;
  placementsThisMonth: number;
}

export interface DashboardBrief {
  id: string;
  clientName: string;
  position: string;
  receivedAt: Date;
  status: BriefStatus;
  confidenceScore?: number;
}

export interface DashboardJob {
  id: string;
  title: string;
  client: string;
  daysSinceActivity: number;
  candidateCount: number;
  salary?: string;
}

export interface DashboardApplication {
  id: string;
  candidateName: string;
  jobTitle: string;
  jobId: string;
  vesselName: string;
  appliedAt: Date;
  source: string;
}
