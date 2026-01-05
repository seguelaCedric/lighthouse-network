import { Suspense } from "react";
import { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { JobBoardClient } from "./JobBoardClient";
import { JobListJsonLd, JobListBreadcrumbJsonLd, JobBoardFaqJsonLd } from "@/components/seo/JobListJsonLd";
import type { PublicJob } from "@/components/job-board/JobBoardCard";

export const metadata: Metadata = {
  title: "Luxury Staff Jobs | Yacht Crew & Private Household | Lighthouse Careers",
  description:
    "Browse elite positions in yachting and private households. Captain, Chef, Butler, Estate Manager, Nanny, Stewardess roles worldwide. Apply directly to top employers.",
  keywords: [
    "yacht jobs",
    "yacht crew positions",
    "superyacht jobs",
    "private household jobs",
    "butler jobs",
    "estate manager jobs",
    "private chef jobs",
    "nanny jobs luxury",
    "housekeeper jobs",
    "captain jobs",
    "chief stew jobs",
    "deckhand jobs",
    "yacht recruitment",
    "private staff recruitment",
    "luxury hospitality jobs",
    "UHNW household staff",
  ],
  openGraph: {
    title: "Luxury Staff Jobs | Yacht Crew & Private Household | Lighthouse Careers",
    description:
      "Browse elite positions in yachting and private households. Captain, Chef, Butler, Estate Manager, Nanny - your next career awaits.",
    type: "website",
    url: "https://lighthouse-careers.com/job-board",
    siteName: "Lighthouse Careers",
    images: [
      {
        url: "https://lighthouse-careers.com/og-jobs.jpg",
        width: 1200,
        height: 630,
        alt: "Luxury Staff Jobs - Lighthouse Careers",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Luxury Staff Jobs | Lighthouse Careers",
    description:
      "Browse yacht crew and private household positions from top employers worldwide. Apply directly.",
    images: ["https://lighthouse-careers.com/og-jobs.jpg"],
  },
  alternates: {
    canonical: "https://lighthouse-careers.com/job-board",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-snippet": -1,
      "max-image-preview": "large",
      "max-video-preview": -1,
    },
  },
};

interface FilterOptions {
  positions: string[];
  regions: string[];
  vesselTypes: string[];
  contractTypes: string[];
}

async function getPublicJobs(): Promise<{ jobs: PublicJob[]; filterOptions: FilterOptions }> {
  const supabase = await createClient();

  // Fetch jobs from public_jobs view
  const { data: jobs, error } = await supabase
    .from("public_jobs")
    .select("*")
    .order("is_urgent", { ascending: false })
    .order("published_at", { ascending: false })
    .limit(100);

  if (error) {
    console.error("Error fetching jobs:", error);
    return {
      jobs: [],
      filterOptions: { positions: [], regions: [], vesselTypes: [], contractTypes: [] },
    };
  }

  // Extract unique filter options from the data
  const positions = [...new Set(jobs?.map((j) => j.position_category).filter(Boolean) as string[])].sort();
  const regions = [...new Set(jobs?.map((j) => j.primary_region).filter(Boolean) as string[])].sort();
  const vesselTypes = [...new Set(jobs?.map((j) => j.vessel_type).filter(Boolean) as string[])].sort();
  const contractTypes = [...new Set(jobs?.map((j) => j.contract_type).filter(Boolean) as string[])].sort();

  return {
    jobs: (jobs || []) as PublicJob[],
    filterOptions: { positions, regions, vesselTypes, contractTypes },
  };
}

export default async function JobBoardPage() {
  const { jobs, filterOptions } = await getPublicJobs();

  return (
    <>
      {/* SEO JSON-LD Structured Data */}
      <JobListJsonLd jobs={jobs} totalCount={jobs.length} currentPage={1} />
      <JobListBreadcrumbJsonLd />
      <JobBoardFaqJsonLd />

      {/* Client-side interactive component */}
      <Suspense fallback={<JobBoardLoadingSkeleton />}>
        <JobBoardClient
          initialJobs={jobs}
          filterOptions={filterOptions}
          totalCount={jobs.length}
        />
      </Suspense>
    </>
  );
}

function JobBoardLoadingSkeleton() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Skeleton */}
      <div className="bg-gradient-to-b from-navy-800 via-navy-900 to-[#0c1525] pt-28 pb-16">
        <div className="container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center animate-pulse">
            <div className="h-8 w-48 bg-white/10 rounded-full mx-auto mb-8" />
            <div className="h-16 w-full bg-white/10 rounded mb-6" />
            <div className="h-6 w-2/3 bg-white/10 rounded mx-auto mb-10" />
            <div className="h-14 w-full bg-white/20 rounded-2xl" />
          </div>
        </div>
      </div>

      {/* Content Skeleton */}
      <div className="container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="flex gap-8">
          {/* Filter Skeleton */}
          <div className="hidden lg:block w-80 flex-shrink-0">
            <div className="bg-white rounded-2xl h-96 animate-pulse" />
          </div>

          {/* List Skeleton */}
          <div className="flex-1">
            <div className="bg-white rounded-2xl overflow-hidden border border-gray-100">
              {/* Header */}
              <div className="px-6 py-3 bg-gray-50 border-b border-gray-100">
                <div className="h-4 w-20 bg-gray-200 rounded animate-pulse" />
              </div>
              {/* List Items */}
              {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                <div key={i} className="px-6 py-4 border-b border-gray-100 animate-pulse">
                  <div className="flex items-start gap-4">
                    <div className="hidden sm:block w-12 h-12 rounded-xl bg-gray-100" />
                    <div className="flex-1">
                      <div className="h-5 w-48 bg-gray-200 rounded mb-2" />
                      <div className="flex flex-wrap gap-3">
                        <div className="h-4 w-24 bg-gray-100 rounded" />
                        <div className="h-4 w-20 bg-gray-100 rounded" />
                        <div className="h-4 w-28 bg-gray-100 rounded" />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
