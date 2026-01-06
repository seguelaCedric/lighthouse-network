import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import {
  Briefcase,
  MapPin,
  Ship,
  ChevronRight,
  Clock,
  CheckCircle,
  XCircle,
  FileText,
} from "lucide-react";
import { cn } from "@/lib/utils";

export const metadata = {
  title: "My Applications | Lighthouse Crew Network",
  description: "Track your job applications and interview progress",
};

/**
 * Simplified stage display for candidates
 * Candidates only see: Applied, In Progress, or final outcomes (Placed/Not Selected)
 * We don't expose detailed pipeline status to candidates
 */
function getSimplifiedStage(stage: string): {
  label: string;
  color: string;
  bgColor: string;
  icon: React.ReactNode;
} {
  // Terminal states that candidates should see
  if (stage === "placed") {
    return {
      label: "Placed",
      color: "text-success-700",
      bgColor: "bg-success-100",
      icon: <CheckCircle className="size-3.5" />,
    };
  }

  if (stage === "rejected" || stage === "withdrawn") {
    return {
      label: stage === "withdrawn" ? "Withdrawn" : "Not Selected",
      color: "text-gray-600",
      bgColor: "bg-gray-100",
      icon: <XCircle className="size-3.5" />,
    };
  }

  // Initial applied state
  if (stage === "applied") {
    return {
      label: "Applied",
      color: "text-blue-700",
      bgColor: "bg-blue-100",
      icon: <FileText className="size-3.5" />,
    };
  }

  // All other active stages show as "In Progress"
  // This includes: screening, shortlisted, submitted, interview, offer
  return {
    label: "In Progress",
    color: "text-gold-700",
    bgColor: "bg-gold-100",
    icon: <Clock className="size-3.5" />,
  };
}

async function getApplicationsData(candidateId: string) {
  const supabase = await createClient();

  const { data: applications } = await supabase
    .from("applications")
    .select(`
      id,
      stage,
      created_at,
      applied_at,
      interview_scheduled_at,
      job:jobs (
        id,
        title,
        primary_region,
        vessel_type,
        vessel_size_meters,
        salary_min,
        salary_max,
        salary_currency,
        created_by_agency:organizations!jobs_created_by_agency_id_fkey (
          name
        )
      )
    `)
    .eq("candidate_id", candidateId)
    .order("created_at", { ascending: false });

  return applications || [];
}

export default async function CrewApplicationsPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login?redirect=/crew/applications");
  }

  // Get user record (auth_id -> user_id mapping)
  const { data: userData } = await supabase
    .from("users")
    .select("id")
    .eq("auth_id", user.id)
    .maybeSingle();

  let candidate = null;

  // Try to find candidate by user_id if user record exists
  if (userData) {
    const { data: candidateByUserId } = await supabase
      .from("candidates")
      .select("id")
      .eq("user_id", userData.id)
      .maybeSingle();

    if (candidateByUserId) {
      candidate = candidateByUserId;
    }
  }

  // Fallback: Try to find candidate by email (for Vincere-imported candidates)
  if (!candidate && user.email) {
    const { data: candidateByEmail } = await supabase
      .from("candidates")
      .select("id")
      .eq("email", user.email)
      .maybeSingle();

    if (candidateByEmail) {
      candidate = candidateByEmail;
    }
  }

  if (!candidate) {
    redirect("/crew/register");
  }

  const applications = await getApplicationsData(candidate.id);

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-gray-50">
        <div className="mx-auto max-w-6xl px-6 py-6">
          <div className="border-b border-gray-200 pb-4">
            <h1 className="flex items-center gap-3 font-serif text-3xl font-semibold text-navy-800">
              <Briefcase className="size-7 text-gold-500" />
              My Applications
            </h1>
            <p className="mt-2 text-gray-600">
              Track the progress of your job applications
            </p>
          </div>
        </div>
      </header>

      {/* Applications List */}
      <div className="mx-auto max-w-6xl px-6 pb-6">
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
          {applications.length === 0 ? (
            <div className="px-6 py-16 text-center">
              <Briefcase className="mx-auto mb-4 size-12 text-gray-300" />
              <h3 className="font-medium text-gray-900">No applications yet</h3>
              <p className="mt-1 text-sm text-gray-500">
                Start browsing jobs and submit your first application
              </p>
              <Link
                href="/crew/jobs"
                className="mt-4 inline-flex items-center gap-2 rounded-lg bg-gold-500 px-4 py-2 text-sm font-medium text-white hover:bg-gold-600"
              >
                Browse Jobs
                <ChevronRight className="size-4" />
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {applications.map((application) => (
                <ApplicationRow key={application.id} application={application} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function ApplicationRow({
  application,
}: {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  application: any;
}) {
  const job = application.job;
  if (!job) return null;

  const jobData = Array.isArray(job) ? job[0] : job;
  if (!jobData) return null;

  const agency = jobData.created_by_agency;
  const agencyName = Array.isArray(agency) ? agency[0]?.name : agency?.name;

  const config = getSimplifiedStage(application.stage);

  const formatSalary = () => {
    if (!jobData.salary_min && !jobData.salary_max) return null;
    const currency = jobData.salary_currency || "EUR";
    const symbol = currency === "EUR" ? "\u20ac" : currency === "GBP" ? "\u00a3" : "$";
    if (jobData.salary_min && jobData.salary_max) {
      return `${symbol}${(jobData.salary_min / 1000).toFixed(0)}k-${(jobData.salary_max / 1000).toFixed(0)}k`;
    }
    return jobData.salary_min
      ? `${symbol}${(jobData.salary_min / 1000).toFixed(0)}k+`
      : `${symbol}${(jobData.salary_max / 1000).toFixed(0)}k`;
  };

  const timeAgo = (date: string) => {
    const now = new Date();
    const past = new Date(date);
    const diffInDays = Math.floor((now.getTime() - past.getTime()) / (1000 * 60 * 60 * 24));

    if (diffInDays === 0) return "Today";
    if (diffInDays === 1) return "Yesterday";
    if (diffInDays < 7) return `${diffInDays}d ago`;
    if (diffInDays < 30) return `${Math.floor(diffInDays / 7)}w ago`;
    return past.toLocaleDateString("en-GB", { month: "short", day: "numeric" });
  };

  return (
    <Link
      href={`/crew/jobs/${jobData.id}`}
      className="block px-6 py-4 transition-colors hover:bg-gray-50"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <h3 className="truncate font-medium text-navy-800">{jobData.title}</h3>
          <p className="mt-0.5 text-sm text-gray-500">
            {agencyName || "Confidential"}
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-500">
            {jobData.vessel_type && (
              <span className="flex items-center gap-1">
                <Ship className="size-3 text-gray-400" />
                {jobData.vessel_type}
                {jobData.vessel_size_meters && ` ${jobData.vessel_size_meters}m`}
              </span>
            )}
            {jobData.primary_region && (
              <span className="flex items-center gap-1">
                <MapPin className="size-3 text-gray-400" />
                {jobData.primary_region}
              </span>
            )}
            {formatSalary() && (
              <span className="font-medium text-navy-700">{formatSalary()}</span>
            )}
          </div>
        </div>
        <div className="flex flex-col items-end gap-2">
          <span
            className={cn(
              "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium",
              config.bgColor,
              config.color
            )}
          >
            {config.icon}
            {config.label}
          </span>
          <span className="text-xs text-gray-400">
            Applied {timeAgo(application.applied_at || application.created_at)}
          </span>
        </div>
      </div>
    </Link>
  );
}
