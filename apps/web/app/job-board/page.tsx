import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import {
  Search,
  MapPin,
  Ship,
  DollarSign,
  Clock,
  Briefcase,
  Filter,
  ChevronRight,
  Anchor,
} from "lucide-react";
import { cn } from "@/lib/utils";

export const metadata = {
  title: "Job Board | Lighthouse Crew Network",
  description: "Browse yacht crew positions from top agencies worldwide",
};

async function getPublicJobs() {
  const supabase = await createClient();

  const { data: jobs } = await supabase
    .from("jobs")
    .select(`
      id,
      title,
      position_category,
      primary_region,
      vessel_type,
      vessel_size_meters,
      salary_min,
      salary_max,
      salary_currency,
      contract_type,
      is_urgent,
      created_at,
      created_by_agency:organizations!jobs_created_by_agency_id_fkey (
        name
      )
    `)
    .eq("status", "active")
    .eq("is_public", true)
    .is("deleted_at", null)
    .order("created_at", { ascending: false })
    .limit(50);

  return jobs || [];
}

export default async function PublicJobBoardPage() {
  const jobs = await getPublicJobs();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto max-w-6xl px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2">
              <div className="flex size-9 items-center justify-center rounded-lg bg-navy-800">
                <Anchor className="size-5 text-gold-400" />
              </div>
              <span className="font-serif text-xl font-semibold text-navy-800">
                Lighthouse
              </span>
            </Link>
            <div className="flex items-center gap-3">
              <Link
                href="/auth/login"
                className="text-sm font-medium text-navy-600 hover:text-navy-800"
              >
                Sign In
              </Link>
              <Link
                href="/auth/register"
                className="rounded-lg bg-gold-500 px-4 py-2 text-sm font-medium text-white hover:bg-gold-600"
              >
                Join as Crew
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <div className="bg-navy-800 py-12">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <h1 className="text-center font-serif text-4xl font-bold text-white">
            Find Your Next Yacht Position
          </h1>
          <p className="mt-3 text-center text-lg text-navy-200">
            Browse {jobs.length} open positions from top yacht recruitment agencies
          </p>

          {/* Search Bar */}
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 size-5 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search positions, yachts, or locations..."
                className="w-full rounded-lg border-0 py-3 pl-12 pr-4 text-navy-800 placeholder-gray-400 shadow-lg focus:outline-none focus:ring-2 focus:ring-gold-500"
              />
            </div>
            <button className="flex items-center justify-center gap-2 rounded-lg bg-gold-500 px-6 py-3 font-medium text-white hover:bg-gold-600">
              <Filter className="size-5" />
              Filters
            </button>
          </div>
        </div>
      </div>

      {/* Jobs Grid */}
      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        {jobs.length === 0 ? (
          <div className="py-16 text-center">
            <Briefcase className="mx-auto size-12 text-gray-300" />
            <h3 className="mt-4 font-medium text-gray-900">No jobs available</h3>
            <p className="mt-1 text-gray-500">
              Check back later for new opportunities
            </p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {jobs.map((job) => (
              <JobCard key={job.id} job={job} />
            ))}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-200 bg-white py-8">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
            <p className="text-sm text-gray-500">
              &copy; {new Date().getFullYear()} Lighthouse Crew Network
            </p>
            <div className="flex items-center gap-6">
              <Link href="/privacy" className="text-sm text-gray-500 hover:text-navy-600">
                Privacy
              </Link>
              <Link href="/terms" className="text-sm text-gray-500 hover:text-navy-600">
                Terms
              </Link>
              <Link href="/contact" className="text-sm text-gray-500 hover:text-navy-600">
                Contact
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

function JobCard({
  job,
}: {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  job: any;
}) {
  const agency = job.created_by_agency;
  const agencyName = Array.isArray(agency) ? agency[0]?.name : agency?.name;

  const formatSalary = () => {
    if (!job.salary_min && !job.salary_max) return null;
    const currency = job.salary_currency || "EUR";
    const symbol = currency === "EUR" ? "\u20ac" : currency === "GBP" ? "\u00a3" : "$";
    if (job.salary_min && job.salary_max) {
      return `${symbol}${(job.salary_min / 1000).toFixed(0)}k-${(job.salary_max / 1000).toFixed(0)}k/mo`;
    }
    return job.salary_min
      ? `${symbol}${(job.salary_min / 1000).toFixed(0)}k+/mo`
      : `Up to ${symbol}${(job.salary_max / 1000).toFixed(0)}k/mo`;
  };

  const daysAgo = () => {
    const now = new Date();
    const created = new Date(job.created_at);
    const diffDays = Math.floor((now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Yesterday";
    return `${diffDays} days ago`;
  };

  return (
    <Link
      href={`/job-board/${job.id}`}
      className="group relative flex flex-col rounded-xl border border-gray-200 bg-white p-5 shadow-sm transition-all hover:border-gold-300 hover:shadow-md"
    >
      {job.is_urgent && (
        <span className="absolute -right-2 -top-2 rounded-full bg-error-500 px-2.5 py-0.5 text-xs font-bold text-white">
          URGENT
        </span>
      )}

      <div className="mb-3">
        <h3 className="font-semibold text-navy-900 group-hover:text-gold-700">
          {job.title}
        </h3>
        <p className="mt-1 text-sm text-gray-500">
          {agencyName || "Confidential Agency"}
        </p>
      </div>

      <div className="mb-4 flex-1 space-y-2 text-sm text-gray-600">
        {job.vessel_type && (
          <div className="flex items-center gap-2">
            <Ship className="size-4 text-gray-400" />
            <span>
              {job.vessel_type}
              {job.vessel_size_meters && ` \u2022 ${job.vessel_size_meters}m`}
            </span>
          </div>
        )}
        {job.primary_region && (
          <div className="flex items-center gap-2">
            <MapPin className="size-4 text-gray-400" />
            <span>{job.primary_region}</span>
          </div>
        )}
        {formatSalary() && (
          <div className="flex items-center gap-2">
            <DollarSign className="size-4 text-gray-400" />
            <span className="font-medium text-navy-800">{formatSalary()}</span>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between border-t border-gray-100 pt-3">
        <span className="flex items-center gap-1 text-xs text-gray-400">
          <Clock className="size-3" />
          {daysAgo()}
        </span>
        <span className="flex items-center gap-1 text-sm font-medium text-gold-600 group-hover:text-gold-700">
          View Details
          <ChevronRight className="size-4" />
        </span>
      </div>
    </Link>
  );
}
