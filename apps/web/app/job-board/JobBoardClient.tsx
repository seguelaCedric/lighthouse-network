"use client";

import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { Briefcase, ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { Logo } from "@/components/ui/Logo";
import { JobBoardHero } from "@/components/job-board/JobBoardHero";
import { JobBoardFilters, type JobFilters } from "@/components/job-board/JobBoardFilters";
import { JobBoardCard, JobBoardCardSkeleton, type PublicJob } from "@/components/job-board/JobBoardCard";
import { JobBoardListItem, JobBoardListItemSkeleton } from "@/components/job-board/JobBoardListItem";
import { JobMatchPrompt } from "@/components/job-board/JobMatchBadge";

interface FilterOptions {
  positions: string[];
  regions: string[];
  vesselTypes: string[];
  contractTypes: string[];
}

interface JobWithScore extends PublicJob {
  matchScore?: number;
}

interface JobBoardClientProps {
  initialJobs: PublicJob[];
  filterOptions: FilterOptions;
  totalCount: number;
}

const JOBS_PER_PAGE = 20; // List view allows more items per page

const initialFilters: JobFilters = {
  position: "",
  region: "",
  contractType: "",
  vesselType: "",
  minSalary: "",
  maxSalary: "",
};

export function JobBoardClient({ initialJobs, filterOptions, totalCount }: JobBoardClientProps) {
  const [filters, setFilters] = useState<JobFilters>(initialFilters);
  const [searchQuery, setSearchQuery] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [isFiltersCollapsed, setIsFiltersCollapsed] = useState(true);
  const [matchScores, setMatchScores] = useState<Record<string, number>>({});
  const [isLoadingMatches, setIsLoadingMatches] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Check authentication and load match scores on mount
  useEffect(() => {
    async function loadMatchScores() {
      try {
        const response = await fetch("/api/public/job-match", {
          credentials: "include",
        });

        if (response.ok) {
          const data = await response.json();
          if (data.authenticated && data.scores) {
            setIsAuthenticated(true);
            setMatchScores(data.scores);
          }
        }
      } catch (error) {
        console.error("Failed to load match scores:", error);
      } finally {
        setIsLoadingMatches(false);
      }
    }

    setIsLoadingMatches(true);
    loadMatchScores();
  }, []);

  // Filter and search jobs
  const filteredJobs = useMemo(() => {
    let result = [...initialJobs];

    // Apply search
    if (appliedSearch) {
      const searchLower = appliedSearch.toLowerCase();
      result = result.filter(
        (job) =>
          job.title?.toLowerCase().includes(searchLower) ||
          job.description?.toLowerCase().includes(searchLower) ||
          job.position_category?.toLowerCase().includes(searchLower) ||
          job.primary_region?.toLowerCase().includes(searchLower) ||
          job.vessel_type?.toLowerCase().includes(searchLower) ||
          job.agency_name?.toLowerCase().includes(searchLower)
      );
    }

    // Apply filters
    if (filters.position) {
      result = result.filter((job) => job.position_category === filters.position);
    }
    if (filters.region) {
      result = result.filter((job) => job.primary_region === filters.region);
    }
    if (filters.contractType) {
      result = result.filter((job) => job.contract_type === filters.contractType);
    }
    if (filters.vesselType) {
      result = result.filter((job) => job.vessel_type === filters.vesselType);
    }
    if (filters.minSalary) {
      const minSalary = parseInt(filters.minSalary, 10);
      result = result.filter((job) => (job.salary_max || job.salary_min || 0) >= minSalary);
    }
    if (filters.maxSalary) {
      const maxSalary = parseInt(filters.maxSalary, 10);
      result = result.filter((job) => (job.salary_min || job.salary_max || Infinity) <= maxSalary);
    }

    // Add match scores and sort by match score if authenticated
    const jobsWithScores: JobWithScore[] = result.map((job) => ({
      ...job,
      matchScore: matchScores[job.id],
    }));

    // Sort: urgent first, then by match score (if available), then by date
    jobsWithScores.sort((a, b) => {
      // Urgent jobs first
      if (a.is_urgent && !b.is_urgent) return -1;
      if (!a.is_urgent && b.is_urgent) return 1;

      // Then by match score if available
      if (a.matchScore !== undefined && b.matchScore !== undefined) {
        return b.matchScore - a.matchScore;
      }
      if (a.matchScore !== undefined) return -1;
      if (b.matchScore !== undefined) return 1;

      // Then by date
      const dateA = new Date(a.published_at || a.created_at).getTime();
      const dateB = new Date(b.published_at || b.created_at).getTime();
      return dateB - dateA;
    });

    return jobsWithScores;
  }, [initialJobs, appliedSearch, filters, matchScores]);

  // Pagination
  const totalPages = Math.ceil(filteredJobs.length / JOBS_PER_PAGE);
  const paginatedJobs = filteredJobs.slice(
    (currentPage - 1) * JOBS_PER_PAGE,
    currentPage * JOBS_PER_PAGE
  );

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [filters, appliedSearch]);

  const handleSearchSubmit = () => {
    setAppliedSearch(searchQuery);
  };

  const handleResetFilters = () => {
    setFilters(initialFilters);
    setSearchQuery("");
    setAppliedSearch("");
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 border-b border-gray-200/80 bg-white/95 backdrop-blur-sm">
        <div className="mx-auto max-w-7xl px-4 py-3 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <Link href="/">
              <Logo size="md" />
            </Link>
            <div className="flex items-center gap-3">
              <Link
                href="/auth/login"
                className="text-sm font-medium text-navy-600 hover:text-navy-800 transition-colors"
              >
                Sign In
              </Link>
              <Link
                href="/auth/register"
                className="rounded-xl bg-gradient-to-r from-gold-500 to-gold-600 px-5 py-2.5 text-sm font-medium text-white hover:from-gold-600 hover:to-gold-700 transition-all shadow-lg hover:shadow-xl"
              >
                Join Now
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero */}
      <JobBoardHero
        jobCount={totalCount}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onSearchSubmit={handleSearchSubmit}
      />

      {/* Main Content */}
      <main className="container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Filters Sidebar */}
          <aside className="lg:w-80 flex-shrink-0">
            <div className="lg:sticky lg:top-24">
              <JobBoardFilters
                filters={filters}
                filterOptions={filterOptions}
                onFiltersChange={setFilters}
                onReset={handleResetFilters}
                isCollapsed={isFiltersCollapsed}
                onToggleCollapse={() => setIsFiltersCollapsed(!isFiltersCollapsed)}
              />

              {/* Match Score Prompt for Unauthenticated */}
              {!isAuthenticated && !isLoadingMatches && (
                <div className="mt-6 hidden lg:block">
                  <JobMatchPrompt />
                </div>
              )}
            </div>
          </aside>

          {/* Jobs Grid */}
          <div className="flex-1">
            {/* Results Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
              <div>
                <h2 className="text-lg font-semibold text-navy-900">
                  {filteredJobs.length === totalCount
                    ? `${totalCount} Open Positions`
                    : `${filteredJobs.length} of ${totalCount} Positions`}
                </h2>
                {appliedSearch && (
                  <p className="text-sm text-gray-500 mt-1">
                    Showing results for &quot;{appliedSearch}&quot;
                  </p>
                )}
              </div>

              {isAuthenticated && (
                <div className="flex items-center gap-2 text-sm text-gold-600 bg-gold-50 px-3 py-1.5 rounded-full">
                  {isLoadingMatches ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Calculating matches...</span>
                    </>
                  ) : (
                    <>
                      <span className="h-2 w-2 rounded-full bg-gold-500" />
                      <span>Sorted by your match score</span>
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Jobs List */}
            {filteredJobs.length === 0 ? (
              <div className="py-16 text-center bg-white rounded-2xl border border-gray-100 shadow-lg">
                <Briefcase className="mx-auto h-12 w-12 text-gray-300" />
                <h3 className="mt-4 font-medium text-gray-900">No jobs found</h3>
                <p className="mt-1 text-gray-500">
                  Try adjusting your search or filters
                </p>
                <button
                  onClick={handleResetFilters}
                  className="mt-6 inline-flex items-center gap-2 rounded-xl bg-gold-500 px-6 py-2.5 text-sm font-medium text-white hover:bg-gold-600 transition-colors"
                >
                  Reset Filters
                </button>
              </div>
            ) : isLoadingMatches ? (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-lg overflow-hidden">
                {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                  <JobBoardListItemSkeleton key={i} />
                ))}
              </div>
            ) : (
              <>
                {/* Professional List View */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-lg overflow-hidden">
                  {/* List Header */}
                  <div className="px-4 sm:px-6 py-3 bg-gray-50/80 border-b border-gray-100">
                    <div className="flex items-center justify-between text-xs text-gray-500 uppercase tracking-wide font-medium">
                      <span>Position</span>
                      <span className="hidden sm:inline">Posted</span>
                    </div>
                  </div>

                  {/* Job Rows */}
                  {paginatedJobs.map((job) => (
                    <JobBoardListItem
                      key={job.id}
                      job={job}
                      matchScore={job.matchScore}
                    />
                  ))}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="mt-10 flex items-center justify-center gap-2">
                    <button
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className="flex items-center gap-1 rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      <ChevronLeft className="h-4 w-4" />
                      Previous
                    </button>

                    <div className="flex items-center gap-1">
                      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        let pageNum: number;
                        if (totalPages <= 5) {
                          pageNum = i + 1;
                        } else if (currentPage <= 3) {
                          pageNum = i + 1;
                        } else if (currentPage >= totalPages - 2) {
                          pageNum = totalPages - 4 + i;
                        } else {
                          pageNum = currentPage - 2 + i;
                        }

                        return (
                          <button
                            key={pageNum}
                            onClick={() => setCurrentPage(pageNum)}
                            className={`h-10 w-10 rounded-lg text-sm font-medium transition-colors ${
                              currentPage === pageNum
                                ? "bg-gold-500 text-white shadow-lg"
                                : "text-gray-600 hover:bg-gray-100"
                            }`}
                          >
                            {pageNum}
                          </button>
                        );
                      })}
                    </div>

                    <button
                      onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                      className="flex items-center gap-1 rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      Next
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>
                )}
              </>
            )}

            {/* Mobile Match Prompt */}
            {!isAuthenticated && !isLoadingMatches && (
              <div className="mt-8 lg:hidden">
                <JobMatchPrompt />
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-200 bg-white py-12 mt-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center justify-between gap-6 sm:flex-row">
            <Logo size="sm" />
            <p className="text-sm text-gray-500">
              &copy; {new Date().getFullYear()} Lighthouse Crew Network. All rights reserved.
            </p>
            <div className="flex items-center gap-6">
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
  );
}
