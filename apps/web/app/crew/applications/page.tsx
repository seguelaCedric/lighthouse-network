import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import {
  Briefcase,
  MapPin,
  Ship,
  Calendar,
  ChevronRight,
  Clock,
  CheckCircle,
  XCircle,
  MessageSquare,
  FileText,
  ExternalLink,
  HourglassIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

export const metadata = {
  title: "My Applications | Lighthouse Crew Network",
  description: "Track your job applications and interview progress",
};

const STAGE_CONFIG: Record<
  string,
  { label: string; color: string; bgColor: string; icon: React.ReactNode }
> = {
  applied: {
    label: "Applied",
    color: "text-blue-700",
    bgColor: "bg-blue-100",
    icon: <FileText className="size-3.5" />,
  },
  screening: {
    label: "Screening",
    color: "text-purple-700",
    bgColor: "bg-purple-100",
    icon: <HourglassIcon className="size-3.5" />,
  },
  shortlisted: {
    label: "Shortlisted",
    color: "text-cyan-700",
    bgColor: "bg-cyan-100",
    icon: <CheckCircle className="size-3.5" />,
  },
  submitted: {
    label: "Sent to Client",
    color: "text-gold-700",
    bgColor: "bg-gold-100",
    icon: <ExternalLink className="size-3.5" />,
  },
  interview: {
    label: "Interview",
    color: "text-gold-700",
    bgColor: "bg-gold-100",
    icon: <MessageSquare className="size-3.5" />,
  },
  offer: {
    label: "Offer!",
    color: "text-success-700",
    bgColor: "bg-success-100",
    icon: <CheckCircle className="size-3.5" />,
  },
  placed: {
    label: "Placed",
    color: "text-success-700",
    bgColor: "bg-success-100",
    icon: <CheckCircle className="size-3.5" />,
  },
  rejected: {
    label: "Not Selected",
    color: "text-gray-600",
    bgColor: "bg-gray-100",
    icon: <XCircle className="size-3.5" />,
  },
};

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

  // Get user record
  const { data: userData } = await supabase
    .from("users")
    .select("id")
    .eq("auth_id", user.id)
    .single();

  if (!userData) {
    redirect("/auth/login?redirect=/crew/applications");
  }

  // Get candidate profile
  const { data: candidate } = await supabase
    .from("candidates")
    .select("id")
    .eq("user_id", userData.id)
    .single();

  if (!candidate) {
    redirect("/crew/register");
  }

  const applications = await getApplicationsData(candidate.id);

  // Calculate stats
  const stats = {
    total: applications.length,
    active: applications.filter((a) =>
      ["applied", "screening", "shortlisted", "submitted", "interview", "offer"].includes(a.stage)
    ).length,
    interviews: applications.filter((a) => a.stage === "interview").length,
    offers: applications.filter((a) => a.stage === "offer").length,
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-3xl font-bold text-navy-800">
          My Applications
        </h1>
        <p className="mt-1 text-gray-600">
          Track the progress of your job applications
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard label="Total Applied" value={stats.total} />
        <StatCard label="Active" value={stats.active} highlight />
        <StatCard label="Interviews" value={stats.interviews} />
        <StatCard label="Offers" value={stats.offers} />
      </div>

      {/* Applications List */}
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
  );
}

function StatCard({
  label,
  value,
  highlight = false,
}: {
  label: string;
  value: number;
  highlight?: boolean;
}) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
      <p
        className={cn(
          "text-2xl font-bold",
          highlight ? "text-gold-600" : "text-navy-800"
        )}
      >
        {value}
      </p>
      <p className="text-sm text-gray-500">{label}</p>
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

  const config = STAGE_CONFIG[application.stage] || STAGE_CONFIG.applied;

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
      href={`/crew/applications/${application.id}`}
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
