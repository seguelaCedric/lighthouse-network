import { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import {
  MapPin,
  Calendar,
  Ship,
  DollarSign,
  Clock,
  Briefcase,
  AlertTriangle,
  ChevronLeft,
  Palmtree,
  Ruler,
  CheckCircle,
  ExternalLink,
  Building,
  Eye,
  Users,
} from "lucide-react";
import { Logo } from "@/components/ui/Logo";
import { JobPostingJsonLd, JobBreadcrumbJsonLd } from "@/components/seo/JobPostingJsonLd";
import type { PublicJob } from "@/components/job-board/JobBoardCard";
import { formatDescriptionFull } from "@/lib/utils/format-description";
import { JobBoardQuickApplyButton } from "@/components/job-board/JobBoardQuickApplyButton";
import { JobShareButtons } from "@/components/job-board/JobShareButtons";
import { signOut } from "@/lib/auth/actions";

interface PageProps {
  params: Promise<{ id: string }>;
}

async function getJob(id: string): Promise<PublicJob | null> {
  const supabase = await createClient();

  const { data: job, error } = await supabase
    .from("public_jobs")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !job) {
    return null;
  }

  // Increment view count (fire and forget - not critical)
  void supabase.rpc("increment_job_views", { job_id: id });

  return job as PublicJob;
}

async function getSimilarJobs(job: PublicJob): Promise<PublicJob[]> {
  const supabase = await createClient();

  const { data: similarJobs } = await supabase
    .from("public_jobs")
    .select("*")
    .neq("id", job.id)
    .eq("position_category", job.position_category)
    .limit(3);

  return (similarJobs || []) as PublicJob[];
}

import { generateMetadata as genMeta } from "@/lib/seo/metadata";

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const job = await getJob(id);

  if (!job) {
    return genMeta({
      title: "Job Not Found | Lighthouse Careers",
      noindex: true,
    });
  }

  const title = `${job.title} | Luxury Staff Jobs | Lighthouse Careers`;
  const description = job.description
    ? job.description.slice(0, 160)
    : `${job.title} position available. ${job.primary_region ? `Location: ${job.primary_region}.` : ""} Apply now through Lighthouse Careers.`;

  const keywords = [
    job.title.toLowerCase(),
    job.position_category || "",
    job.contract_type || "",
    job.primary_region || "",
    "yacht jobs",
    "luxury staff jobs",
    "private household jobs",
  ].filter(Boolean);

  return genMeta({
    title,
    description,
    keywords,
    canonical: `https://lighthouse-careers.com/job-board/${id}`,
    openGraph: {
      title: job.title,
      description,
      type: "website",
      url: `https://lighthouse-careers.com/job-board/${id}`,
      images: [
        {
          url: `https://lighthouse-careers.com/images/og-job-${id}.jpg`,
          width: 1200,
          height: 630,
          alt: job.title,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: job.title,
      description,
      images: [`https://lighthouse-careers.com/images/og-job-${id}.jpg`],
    },
  });
}

// Format position category for display
function formatPositionCategory(category: string): string {
  return category
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

// Format contract type for display
function formatContractType(type: string): string {
  const typeMap: Record<string, string> = {
    permanent: "Permanent",
    seasonal: "Seasonal",
    temporary: "Temporary",
    rotational: "Rotational",
    freelance: "Freelance",
  };
  return typeMap[type.toLowerCase()] || type.charAt(0).toUpperCase() + type.slice(1);
}

// Format salary for display
function formatSalary(
  min: number | null,
  max: number | null,
  currency: string | null,
  period: string | null
): { amount: string; period: string } {
  const currencySymbol = currency === "USD" ? "$" : currency === "GBP" ? "£" : "€";
  const periodLabel = period === "yearly" ? "/year" : period === "daily" ? "/day" : "/month";

  if (min && max) {
    if (min === max) {
      return { amount: `${currencySymbol}${min.toLocaleString("en-US")}`, period: periodLabel };
    }
    return { amount: `${currencySymbol}${min.toLocaleString("en-US")} - ${currencySymbol}${max.toLocaleString("en-US")}`, period: periodLabel };
  }
  if (min) {
    return { amount: `From ${currencySymbol}${min.toLocaleString("en-US")}`, period: periodLabel };
  }
  if (max) {
    return { amount: `Up to ${currencySymbol}${max.toLocaleString("en-US")}`, period: periodLabel };
  }
  return { amount: "Competitive", period: "" };
}

// Format date for display
function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

// Format posted date with relative time
function formatPostedDate(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
  const diffDays = Math.floor(diffHours / 24);

  if (diffHours < 1) return "Just posted";
  if (diffHours < 24) return `Posted ${diffHours} hour${diffHours > 1 ? "s" : ""} ago`;
  if (diffDays === 1) return "Posted yesterday";
  if (diffDays < 7) return `Posted ${diffDays} days ago`;
  if (diffDays < 30) return `Posted ${Math.floor(diffDays / 7)} week${Math.floor(diffDays / 7) > 1 ? "s" : ""} ago`;
  return `Posted ${formatDate(dateString)}`;
}

// Check if starting soon (within 14 days)
function isStartingSoon(dateString: string): boolean {
  const date = new Date(dateString);
  const now = new Date();
  const diffDays = Math.ceil((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  return diffDays >= 0 && diffDays <= 14;
}

export default async function JobDetailPage({ params }: PageProps) {
  const { id } = await params;
  const job = await getJob(id);
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const isAuthenticated = !!user;
  let hasApplied = false;
  let dashboardHref = "/dashboard";

  if (user?.email) {
    const { data: userData } = await supabase
      .from("users")
      .select("id, user_type")
      .eq("auth_id", user.id)
      .maybeSingle();

    if (userData?.user_type === "candidate") {
      dashboardHref = "/crew/dashboard";
    }

    let candidateId: string | null = null;
    if (userData?.id) {
      const { data: candidateByUserId } = await supabase
        .from("candidates")
        .select("id")
        .eq("user_id", userData.id)
        .maybeSingle();
      candidateId = candidateByUserId?.id || null;
    }

    if (!candidateId) {
      const { data: candidateByEmail } = await supabase
        .from("candidates")
        .select("id")
        .ilike("email", user.email)
        .maybeSingle();
      candidateId = candidateByEmail?.id || null;
    }

    if (!candidateId) {
      const { data: candidateByAuthId } = await supabase
        .from("candidates")
        .select("id")
        .eq("user_id", user.id)
        .maybeSingle();
      candidateId = candidateByAuthId?.id || null;
    }

    if (candidateId) {
      const { data: existingApplication } = await supabase
        .from("applications")
        .select("id")
        .eq("candidate_id", candidateId)
        .eq("job_id", id)
        .maybeSingle();
      hasApplied = !!existingApplication;
    }
  }

  if (!job) {
    notFound();
  }

  const similarJobs = await getSimilarJobs(job);
  const hasSalary = job.salary_min || job.salary_max;
  const startingSoon = job.start_date && isStartingSoon(job.start_date);

  return (
    <>
      {/* SEO JSON-LD */}
      <JobPostingJsonLd job={job} />
      <JobBreadcrumbJsonLd jobTitle={job.title} jobId={id} />

      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
        {/* Header */}
        <header className="border-b border-gray-200/80 bg-white/95 backdrop-blur-sm sticky top-0 z-50">
          <div className="mx-auto max-w-6xl px-4 py-3 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between">
              <Link href="/">
                <Logo size="md" />
              </Link>
              <div className="flex items-center gap-3">
                {isAuthenticated ? (
                  <>
                    <Link
                      href={dashboardHref}
                      className="rounded-xl border border-gray-200 px-4 py-2 text-sm font-medium text-navy-700 hover:bg-gray-50 transition-colors"
                    >
                      Go to Dashboard
                    </Link>
                    <form action={signOut}>
                      <button
                        type="submit"
                        className="text-sm font-medium text-navy-600 hover:text-navy-800 transition-colors"
                      >
                        Sign Out
                      </button>
                    </form>
                  </>
                ) : (
                  <>
                    <Link
                      href={`/auth/login?redirect=/job-board/${id}`}
                      className="text-sm font-medium text-navy-600 hover:text-navy-800 transition-colors"
                    >
                      Sign In
                    </Link>
                    <Link
                      href={`/auth/register?redirect=/job-board/${id}`}
                      className="rounded-xl bg-gradient-to-r from-gold-500 to-gold-600 px-5 py-2.5 text-sm font-medium text-white hover:from-gold-600 hover:to-gold-700 transition-all shadow-lg"
                    >
                      Join Now
                    </Link>
                  </>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Breadcrumb */}
        <div className="bg-white border-b border-gray-100">
          <div className="mx-auto max-w-6xl px-4 py-3 sm:px-6 lg:px-8">
            <nav className="flex items-center gap-2 text-sm">
              <Link href="/job-board" className="text-gray-500 hover:text-navy-600 flex items-center gap-1">
                <ChevronLeft className="h-4 w-4" />
                All Jobs
              </Link>
              <span className="text-gray-300">/</span>
              <span className="text-navy-900 font-medium truncate">{job.title}</span>
            </nav>
          </div>
        </div>

        <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="grid gap-8 lg:grid-cols-3">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Job Header Card */}
              <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
                {/* Urgent Banner */}
                {job.is_urgent && (
                  <div className="bg-gradient-to-r from-red-500 to-red-600 px-6 py-2 flex items-center gap-2 text-white text-sm font-medium">
                    <AlertTriangle className="h-4 w-4" />
                    Urgent Hire - Immediate Start Required
                  </div>
                )}

                {/* Starting Soon Banner */}
                {startingSoon && !job.is_urgent && (
                  <div className="bg-gradient-to-r from-amber-400 to-amber-500 px-6 py-2 flex items-center gap-2 text-white text-sm font-medium">
                    <Calendar className="h-4 w-4" />
                    Starting Soon - Apply Now
                  </div>
                )}

                <div className="p-6 sm:p-8">
                  {/* Top Row: Badges + Posted Date */}
                  <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                    <div className="flex flex-wrap items-center gap-2">
                      {job.position_category && (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-gold-100 px-3 py-1 text-xs font-semibold text-gold-700 uppercase tracking-wide">
                          <Briefcase className="h-3 w-3" />
                          {formatPositionCategory(job.position_category)}
                        </span>
                      )}
                      {job.contract_type && (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-navy-100 px-3 py-1 text-xs font-medium text-navy-700">
                          <Clock className="h-3 w-3" />
                          {formatContractType(job.contract_type)}
                        </span>
                      )}
                    </div>
                    {job.published_at && (
                      <span className="text-sm text-gray-500">
                        {formatPostedDate(job.published_at)}
                      </span>
                    )}
                  </div>

                  {/* Title */}
                  <h1 className="text-2xl sm:text-3xl font-semibold text-navy-900 mb-4">
                    {job.title}
                  </h1>

                  {/* Agency */}
                  {job.agency_name && (
                    <div className="flex items-center gap-2 text-gray-600 mb-6">
                      <Building className="h-4 w-4 text-gray-400" />
                      <span>Posted by <span className="font-medium">{job.agency_name}</span></span>
                    </div>
                  )}

                  {/* Key Details Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 p-4 sm:p-5 bg-gray-50 rounded-xl">
                    {job.primary_region && (
                      <div className="flex flex-col space-y-2 p-4 bg-white rounded-lg shadow-sm">
                        <span className="text-xs text-gray-500 uppercase tracking-wide font-medium">Location</span>
                        <div className="flex items-center gap-2.5 text-navy-800">
                          <MapPin className="h-5 w-5 text-gold-500 flex-shrink-0" />
                          <span className="font-medium text-base">{job.primary_region}</span>
                        </div>
                      </div>
                    )}
                    {hasSalary && (() => {
                      const salary = formatSalary(job.salary_min, job.salary_max, job.salary_currency, job.salary_period);
                      return (
                        <div className="flex flex-col space-y-2 p-4 bg-white rounded-lg shadow-sm">
                          <span className="text-xs text-gray-500 uppercase tracking-wide font-medium">Salary</span>
                          <div className="flex items-center gap-2.5 text-navy-800">
                            <DollarSign className="h-5 w-5 text-gold-500 flex-shrink-0" />
                            <span className="font-semibold text-base">
                              {salary.amount}<span className="text-gray-500 font-normal">{salary.period}</span>
                            </span>
                          </div>
                        </div>
                      );
                    })()}
                    {job.start_date && (
                      <div className="flex flex-col space-y-2 p-4 bg-white rounded-lg shadow-sm">
                        <span className="text-xs text-gray-500 uppercase tracking-wide font-medium">Start Date</span>
                        <div className={`flex items-center gap-2.5 ${startingSoon ? "text-amber-600" : "text-navy-800"}`}>
                          <Calendar className="h-5 w-5 text-gold-500 flex-shrink-0" />
                          <span className={`text-base ${startingSoon ? "font-semibold" : "font-medium"}`}>
                            {formatDate(job.start_date)}
                          </span>
                        </div>
                      </div>
                    )}
                    {job.holiday_days && (
                      <div className="flex flex-col space-y-2 p-4 bg-white rounded-lg shadow-sm">
                        <span className="text-xs text-gray-500 uppercase tracking-wide font-medium">Annual Leave</span>
                        <div className="flex items-center gap-2.5 text-navy-800">
                          <Palmtree className="h-5 w-5 text-gold-500 flex-shrink-0" />
                          <span className="font-medium text-base">{job.holiday_days} days</span>
                        </div>
                      </div>
                    )}
                    {job.vessel_type && (
                      <div className="flex flex-col space-y-2 p-4 bg-white rounded-lg shadow-sm">
                        <span className="text-xs text-gray-500 uppercase tracking-wide font-medium">Vessel</span>
                        <div className="flex items-center gap-2.5 text-navy-800">
                          <Ship className="h-5 w-5 text-gold-500 flex-shrink-0" />
                          <span className="font-medium text-base">
                            {job.vessel_type}
                            {job.vessel_size_meters && ` (${job.vessel_size_meters}m)`}
                          </span>
                        </div>
                      </div>
                    )}
                    {job.rotation_schedule && (
                      <div className="flex flex-col space-y-2 p-4 bg-white rounded-lg shadow-sm">
                        <span className="text-xs text-gray-500 uppercase tracking-wide font-medium">Rotation</span>
                        <div className="flex items-center gap-2.5 text-navy-800">
                          <Clock className="h-5 w-5 text-gold-500 flex-shrink-0" />
                          <span className="font-medium text-base">{job.rotation_schedule}</span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Stats Row */}
                  {((job.views_count !== null && job.views_count > 0) || (job.applications_count !== null && job.applications_count > 0)) && (
                    <div className="flex items-center gap-6 mt-4 pt-4 border-t border-gray-100 text-sm text-gray-500">
                      {job.views_count !== null && job.views_count > 0 && (
                        <div className="flex items-center gap-1.5">
                          <Eye className="h-4 w-4" />
                          <span>{job.views_count} views</span>
                        </div>
                      )}
                      {job.applications_count !== null && job.applications_count > 0 && (
                        <div className="flex items-center gap-1.5">
                          <Users className="h-4 w-4" />
                          <span>{job.applications_count} applicant{job.applications_count > 1 ? "s" : ""}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Job Description */}
              <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6 sm:p-8">
                <h2 className="text-xl font-semibold text-navy-900 mb-4">About This Position</h2>
                {(() => {
                  const formattedDescription = formatDescriptionFull(job.description);
                  return formattedDescription ? (
                    <div className="prose prose-navy max-w-none">
                      <p className="whitespace-pre-line text-gray-700 leading-relaxed">{formattedDescription}</p>
                    </div>
                  ) : (
                    <p className="text-gray-500 italic">Contact the agency for more details about this position.</p>
                  );
                })()}
              </div>

              {/* Requirements */}
              {job.requirements && job.requirements.length > 0 && (
                <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6 sm:p-8">
                  <h2 className="text-xl font-semibold text-navy-900 mb-4">Requirements</h2>
                  <ul className="space-y-3">
                    {job.requirements.map((req, index) => (
                      <li key={index} className="flex items-start gap-3">
                        <CheckCircle className="h-5 w-5 text-gold-500 flex-shrink-0 mt-0.5" />
                        <span className="text-gray-700">{req}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Benefits */}
              {(job.benefits && job.benefits.length > 0) || job.holiday_days || job.rotation_schedule ? (
                <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6 sm:p-8">
                  <h2 className="text-xl font-semibold text-navy-900 mb-4">Benefits & Package</h2>
                  <ul className="space-y-3">
                    {job.holiday_days && (
                      <li className="flex items-start gap-3">
                        <Palmtree className="h-5 w-5 text-gold-500 flex-shrink-0 mt-0.5" />
                        <span className="text-gray-700">{job.holiday_days} days annual leave</span>
                      </li>
                    )}
                    {job.rotation_schedule && (
                      <li className="flex items-start gap-3">
                        <Calendar className="h-5 w-5 text-gold-500 flex-shrink-0 mt-0.5" />
                        <span className="text-gray-700">Rotation: {job.rotation_schedule}</span>
                      </li>
                    )}
                    {job.benefits?.map((benefit, index) => (
                      <li key={index} className="flex items-start gap-3">
                        <CheckCircle className="h-5 w-5 text-gold-500 flex-shrink-0 mt-0.5" />
                        <span className="text-gray-700">{benefit}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </div>

            {/* Sidebar */}
            <div className="lg:col-span-1 space-y-6">
              {/* Apply Card */}
              <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6 sticky top-24">
                <h3 className="text-lg font-semibold text-navy-900 mb-4">Apply for this position</h3>

                {isAuthenticated ? (
                  <JobBoardQuickApplyButton jobId={id} initialApplied={hasApplied} />
                ) : (
                  <div className="space-y-3">
                    <Link
                      href={`/auth/login?redirect=/job-board/${id}`}
                      className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-gold-500 to-gold-600 px-6 py-3.5 font-medium text-white hover:from-gold-600 hover:to-gold-700 transition-all shadow-lg hover:shadow-xl"
                    >
                      Sign in to Apply
                      <ExternalLink className="h-4 w-4" />
                    </Link>
                    <Link
                      href={`/auth/register?redirect=/job-board/${id}`}
                      className="w-full flex items-center justify-center gap-2 rounded-xl border border-gray-200 px-6 py-3.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      Create Candidate Account
                    </Link>
                  </div>
                )}

                <div className="mt-4">
                  <JobShareButtons jobId={id} jobTitle={job.title} />
                </div>

                {job.apply_deadline && (
                  <p className="text-sm text-gray-500 mt-4 text-center">
                    Applications close {formatDate(job.apply_deadline)}
                  </p>
                )}
              </div>

              {/* Vessel Info */}
              {(job.vessel_type || job.vessel_size_meters) && (
                <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6">
                  <h3 className="text-lg font-semibold text-navy-900 mb-4">Vessel Information</h3>
                  <div className="space-y-3">
                    {job.vessel_type && (
                      <div className="flex items-center gap-3">
                        <Ship className="h-5 w-5 text-gold-500" />
                        <span className="text-gray-700">{job.vessel_type}</span>
                      </div>
                    )}
                    {job.vessel_size_meters && (
                      <div className="flex items-center gap-3">
                        <Ruler className="h-5 w-5 text-gold-500" />
                        <span className="text-gray-700">{job.vessel_size_meters} meters</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Job ID */}
              <div className="bg-gray-50 rounded-xl p-4 text-center">
                <p className="text-xs text-gray-500">Job Reference</p>
                <p className="text-sm font-mono text-navy-700">{id.slice(0, 8).toUpperCase()}</p>
              </div>
            </div>
          </div>

          {/* Similar Jobs */}
          {similarJobs.length > 0 && (
            <section className="mt-16">
              <h2 className="text-2xl font-cormorant font-semibold text-navy-900 mb-6">Similar Positions</h2>
              <div className="grid gap-6 md:grid-cols-3">
                {similarJobs.map((similarJob) => (
                  <Link
                    key={similarJob.id}
                    href={`/job-board/${similarJob.id}`}
                    className="group bg-white rounded-xl border border-gray-100 shadow-lg p-5 hover:border-gold-300 hover:shadow-xl transition-all"
                  >
                    <h3 className="font-semibold text-navy-900 group-hover:text-gold-600 transition-colors mb-2">
                      {similarJob.title}
                    </h3>
                    {similarJob.primary_region && (
                      <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
                        <MapPin className="h-4 w-4" />
                        <span>{similarJob.primary_region}</span>
                      </div>
                    )}
                    {(similarJob.salary_min || similarJob.salary_max) && (() => {
                      const salary = formatSalary(
                        similarJob.salary_min,
                        similarJob.salary_max,
                        similarJob.salary_currency,
                        similarJob.salary_period
                      );
                      return (
                        <div className="text-sm font-medium text-gold-600">
                          {salary.amount}<span className="text-gold-500">{salary.period}</span>
                        </div>
                      );
                    })()}
                  </Link>
                ))}
              </div>
            </section>
          )}
        </main>

        {/* Footer */}
        <footer className="border-t border-gray-200 bg-white py-12 mt-16">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col items-center justify-between gap-6 sm:flex-row">
              <Logo size="sm" />
              <p className="text-sm text-gray-500">
                &copy; {new Date().getFullYear()} Lighthouse Crew Network
              </p>
              <div className="flex items-center gap-6">
                <Link href="/mlc" className="text-sm text-gray-500 hover:text-navy-600 transition-colors">
                  MLC
                </Link>
                <Link href="/privacy" className="text-sm text-gray-500 hover:text-navy-600 transition-colors">
                  Privacy
                </Link>
                <Link href="/terms" className="text-sm text-gray-500 hover:text-navy-600 transition-colors">
                  Terms
                </Link>
                <Link href="/contact" className="text-sm text-gray-500 hover:text-navy-600 transition-colors">
                  Contact
                </Link>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}
