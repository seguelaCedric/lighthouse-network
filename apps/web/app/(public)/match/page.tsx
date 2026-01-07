"use client";

import { useState, useEffect, useMemo, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { PublicHeader } from "@/components/pricing/PublicHeader";
import { PublicFooter } from "@/components/pricing/PublicFooter";
import {
  Search,
  Loader2,
  Briefcase,
  CheckCircle,
  Globe,
  ArrowRight,
  Phone,
  Sparkles,
  Award,
  Building2,
  Languages,
  Shield,
  Target,
  Heart,
  Calendar,
  GraduationCap,
  FileCheck,
  Users,
  RefreshCw,
  Filter,
  ChevronDown,
  X,
  Star,
  Info,
} from "lucide-react";
import { MatchQualityBadge, getMatchTier, SearchQualityBanner, LeadCaptureForm } from "@/components/match";

// Sort options for results
const SORT_OPTIONS = [
  { value: "match_score", label: "Best Match", desc: true },
  { value: "experience_years", label: "Most Experienced", desc: true },
  { value: "experience_years_asc", label: "Least Experienced", desc: false },
] as const;

// Experience filter ranges
const EXPERIENCE_FILTERS = [
  { value: "all", label: "Any Experience" },
  { value: "0-3", label: "0-3 years" },
  { value: "3-5", label: "3-5 years" },
  { value: "5-10", label: "5-10 years" },
  { value: "10+", label: "10+ years" },
];

// Availability filter options
// Note: Availability is based on last known status - always verify directly with candidate
const AVAILABILITY_FILTERS = [
  { value: "all", label: "Any Availability" },
  { value: "immediate", label: "Listed as Available" },
  { value: "soon", label: "Listed as Available Soon" },
];

interface WorkHistoryEntry {
  employer: string;
  position: string;
  duration: string;
  dates: string;
  details?: string;
}

interface AnonymizedCandidate {
  id: string;
  display_name: string;
  avatar_url: string | null;
  position: string;
  experience_years: number;
  rich_bio: string;
  career_highlights: string[];
  experience_summary: string;
  work_history?: WorkHistoryEntry[];
  languages: string[];
  nationality: string;
  availability: string;
  match_score: number;
  key_strengths: string[];
  qualifications: string[];
  notable_employers: string[];
  why_good_fit: string;
  employee_qualities: string[];
  longevity_assessment: string;
  education_summary?: string;
  reference_count?: number;
  properties_managed?: number;
  years_in_private_service?: number;
  specializations?: string[];
  certifications_count?: number;
}

interface SearchFormData {
  query: string;
}

function MatchPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Initialize form from URL params
  const [formData, setFormData] = useState<SearchFormData>({
    query: searchParams.get("query") || "",
  });

  const [candidates, setCandidates] = useState<AnonymizedCandidate[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [showFilters, setShowFilters] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Sorting and filtering state
  const [sortBy, setSortBy] = useState<string>("match_score");
  const [experienceFilter, setExperienceFilter] = useState<string>("all");
  const [availabilityFilter, setAvailabilityFilter] = useState<string>("all");
  const [languageFilter, setLanguageFilter] = useState<string>("all");
  const [showResultFilters, setShowResultFilters] = useState(false);

  // Get unique languages from candidates for filter dropdown
  const availableLanguages = useMemo(() => {
    const langs = new Set<string>();
    candidates.forEach((c) => {
      c.languages.forEach((lang) => langs.add(lang));
    });
    return Array.from(langs).sort();
  }, [candidates]);

  // Filter and sort candidates
  const filteredAndSortedCandidates = useMemo(() => {
    let result = [...candidates];

    // Apply experience filter
    if (experienceFilter !== "all") {
      result = result.filter((c) => {
        const years = c.experience_years;
        switch (experienceFilter) {
          case "0-3":
            return years >= 0 && years <= 3;
          case "3-5":
            return years > 3 && years <= 5;
          case "5-10":
            return years > 5 && years <= 10;
          case "10+":
            return years > 10;
          default:
            return true;
        }
      });
    }

    // Apply availability filter
    if (availabilityFilter !== "all") {
      result = result.filter((c) => {
        const avail = c.availability.toLowerCase();
        switch (availabilityFilter) {
          case "immediate":
            return avail.includes("immediate");
          case "soon":
            return avail.includes("immediate") || avail.includes("soon") || avail.includes("within");
          default:
            return true;
        }
      });
    }

    // Apply language filter
    if (languageFilter !== "all") {
      result = result.filter((c) => c.languages.includes(languageFilter));
    }

    // Apply sorting
    result.sort((a, b) => {
      switch (sortBy) {
        case "match_score":
          return b.match_score - a.match_score;
        case "experience_years":
          return b.experience_years - a.experience_years;
        case "experience_years_asc":
          return a.experience_years - b.experience_years;
        default:
          return b.match_score - a.match_score;
      }
    });

    return result;
  }, [candidates, sortBy, experienceFilter, availabilityFilter, languageFilter]);

  // Search quality metrics for visual feedback
  const searchQualityMetrics = useMemo(() => {
    if (candidates.length === 0) return null;
    const scores = candidates.map(c => c.match_score * 100);
    return {
      bestMatch: Math.max(...scores),
      hasStrongMatches: scores.some(s => s >= 70),
      showQualityBanner: !scores.some(s => s >= 70) && candidates.length > 0,
    };
  }, [candidates]);

  // Check if any filters are active
  const hasActiveFilters = experienceFilter !== "all" || availabilityFilter !== "all" || languageFilter !== "all";

  // Reset all filters
  const resetFilters = () => {
    setExperienceFilter("all");
    setAvailabilityFilter("all");
    setLanguageFilter("all");
    setSortBy("match_score");
  };

  // Email capture state
  const [showEmailCapture, setShowEmailCapture] = useState(false);

  // Auto-search if URL has params
  useEffect(() => {
    if (searchParams.get("query")) {
      handleSearch();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSearch = async () => {
    if (!formData.query.trim()) {
      setError("Please enter a search query");
      return;
    }

    setError(null);
    setIsLoading(true);
    setHasSearched(true);
    setShowFilters(false);

    // Update URL with search param
    const params = new URLSearchParams();
    params.set("query", formData.query);
    router.replace(`/match?${params.toString()}`, { scroll: false });

    try {
      const response = await fetch("/api/public/brief-match/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error("Search failed");
      }

      const data = await response.json();
      setCandidates(data.candidates || []);
      
      // Store query in sessionStorage for thank you page
      if (formData.query) {
        sessionStorage.setItem("match_query", formData.query);
      }
    } catch (err) {
      console.error("Brief match error:", err);
      setError("Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };


  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 via-white to-gray-50">
      <PublicHeader />

      {/* Hero Section - Luxury Styled */}
      <section className="relative overflow-hidden pt-28 pb-16">
        {/* Rich navy gradient */}
        <div className="absolute inset-0 bg-gradient-to-b from-navy-800 via-navy-900 to-[#0c1525]" />

        {/* Warm champagne ambient light from top */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_0%,rgba(195,165,120,0.15),transparent_60%)]" />

        {/* Subtle side accents for depth */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_50%_80%_at_0%_50%,rgba(195,165,120,0.06),transparent_50%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_50%_80%_at_100%_50%,rgba(195,165,120,0.06),transparent_50%)]" />

        {/* Art Deco sunburst pattern */}
        <div className="absolute inset-0 opacity-[0.15]">
          <svg className="h-full w-full" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid slice">
            <defs>
              <radialGradient id="sunburst-fade" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#C3A578" stopOpacity="1"/>
                <stop offset="100%" stopColor="#C3A578" stopOpacity="0.3"/>
              </radialGradient>
            </defs>
            <g stroke="url(#sunburst-fade)" strokeWidth="0.5" fill="none">
              {/* Radiating lines from center */}
              {[...Array(36)].map((_, i) => {
                const angle = (i * 10) * (Math.PI / 180);
                const x2 = Math.round((50 + 70 * Math.cos(angle)) * 100) / 100;
                const y2 = Math.round((50 + 70 * Math.sin(angle)) * 100) / 100;
                return <line key={i} x1="50%" y1="50%" x2={`${x2}%`} y2={`${y2}%`} />;
              })}
            </g>
            {/* Concentric arcs */}
            <circle cx="50%" cy="50%" r="15%" fill="none" stroke="#C3A578" strokeWidth="0.3" opacity="0.5"/>
            <circle cx="50%" cy="50%" r="30%" fill="none" stroke="#C3A578" strokeWidth="0.3" opacity="0.4"/>
            <circle cx="50%" cy="50%" r="45%" fill="none" stroke="#C3A578" strokeWidth="0.3" opacity="0.3"/>
          </svg>
        </div>

        <div className="container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="max-w-3xl mx-auto text-center">
            {/* Elegant badge */}
            <div className="inline-flex items-center gap-2 rounded-full border border-gold-500/30 bg-gold-500/10 px-5 py-2.5 text-sm font-medium text-gold-300 mb-8 backdrop-blur-sm">
              <Sparkles className="h-4 w-4" />
              AI-Powered Candidate Matching
            </div>
            <h1 className="font-cormorant text-5xl sm:text-6xl lg:text-7xl font-semibold tracking-tight text-white mb-6">
              Find Your Perfect
              <span className="block text-gradient-gold">Crew & Staff</span>
            </h1>
            <p className="mx-auto max-w-2xl text-lg text-white/90 sm:text-xl">
              Our AI instantly matches your requirements against 44,000+ vetted yacht crew and private staff professionals
            </p>
            {/* Trust indicators */}
            <div className="mt-8 flex flex-wrap items-center justify-center gap-6 text-sm text-gray-400">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-gold-400" />
                <span>Anonymized Results</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-gold-400" />
                <span>No Commitment</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-gold-400" />
                <span>Instant Matches</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-8 bg-gray-50">
        <div className="container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Sidebar - Search Filters - Luxury Styled */}
            <div className="lg:col-span-4">
              <div className={`lg:sticky lg:top-28 ${showFilters ? "" : "hidden lg:block"}`}>
                <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden ring-1 ring-black/5">
                  {/* Elegant header with gradient */}
                  <div className="relative bg-gradient-to-r from-navy-900 via-navy-800 to-navy-900 px-6 py-5">
                    <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-gold-500/10 via-transparent to-transparent" />
                    <div className="relative flex items-center justify-between">
                      <h2 className="text-lg font-semibold text-white flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gold-500/20 ring-1 ring-gold-500/30">
                          <Filter className="h-4 w-4 text-gold-400" />
                        </div>
                        Search Criteria
                      </h2>
                      {hasSearched && (
                        <button
                          onClick={() => setShowFilters(!showFilters)}
                          className="lg:hidden text-gray-300 hover:text-white text-sm"
                        >
                          {showFilters ? "Hide" : "Show"}
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="p-6 space-y-5">
                    {/* Single Query Field */}
                    <div>
                      <label className="block text-sm font-semibold text-navy-900 mb-2">
                        Describe what you&apos;re looking for <span className="text-gold-600">*</span>
                      </label>
                      <textarea
                        value={formData.query}
                        onChange={(e) => setFormData({ query: e.target.value })}
                        placeholder="e.g., Chief Stewardess, female, can make cocktails, Monaco"
                        rows={8}
                        className="w-full rounded-xl border border-gray-200 px-4 py-3.5 text-gray-900 bg-gray-50/50 focus:bg-white focus:border-gold-500 focus:ring-2 focus:ring-gold-500/20 transition-all resize-none text-sm placeholder:text-gray-400"
                      />
                      <p className="mt-2 text-xs text-gray-500">
                        Include role, location, requirements, skills, or any other details
                      </p>
                    </div>

                    {error && !hasSearched && (
                      <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>
                    )}

                    <Button
                      onClick={handleSearch}
                      className="w-full shadow-lg shadow-gold-500/20"
                      size="lg"
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                          Searching...
                        </>
                      ) : hasSearched ? (
                        <>
                          <RefreshCw className="mr-2 h-5 w-5" />
                          Update Search
                        </>
                      ) : (
                        <>
                          <Search className="mr-2 h-5 w-5" />
                          Find Candidates
                        </>
                      )}
                    </Button>

                    <p className="text-center text-xs text-gray-500">
                      Results are anonymized. No commitment required.
                    </p>
                  </div>
                </div>

                {/* Quick Help Card - Luxury Styled */}
                {hasSearched && (
                  <div className="mt-6 relative overflow-hidden bg-gradient-to-br from-navy-900 via-navy-800 to-navy-900 rounded-2xl p-6 text-white shadow-xl">
                    <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,_var(--tw-gradient-stops))] from-gold-500/20 via-transparent to-transparent" />
                    <div className="relative">
                      <h3 className="font-semibold mb-2 flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gold-500/20 ring-1 ring-gold-500/30">
                          <Phone className="h-4 w-4 text-gold-400" />
                        </div>
                        Need Help?
                      </h3>
                      <p className="text-sm text-gray-300 mb-4">
                        Speak directly with a recruitment consultant
                      </p>
                      <a
                        href="tel:+33676410299"
                        className="inline-flex items-center gap-2 text-gold-400 hover:text-gold-300 font-semibold text-sm group"
                      >
                        +33 6 76 41 02 99
                        <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
                      </a>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Main Results Area */}
            <div className="lg:col-span-8">
              {/* Mobile Filter Toggle */}
              {hasSearched && !showFilters && (
                <button
                  onClick={() => setShowFilters(true)}
                  className="lg:hidden mb-4 flex items-center gap-2 text-sm font-medium text-navy-600 hover:text-navy-700"
                >
                  <Filter className="h-4 w-4" />
                  Edit Search Criteria
                </button>
              )}

              {/* Loading State - Luxury Styled */}
              {isLoading && (
                <div className="relative overflow-hidden bg-white rounded-2xl shadow-xl border border-gray-100 p-16 text-center">
                  {/* Subtle animated background */}
                  <div className="absolute inset-0 bg-gradient-to-br from-gold-50/50 via-white to-navy-50/30" />
                  <div className="relative">
                    <div className="relative mx-auto mb-8 h-24 w-24">
                      {/* Outer glow ring */}
                      <div className="absolute inset-0 rounded-full bg-gold-500/10 animate-pulse"></div>
                      {/* Spinner track */}
                      <div className="absolute inset-2 rounded-full border-4 border-gray-100"></div>
                      {/* Animated spinner */}
                      <div className="absolute inset-2 animate-spin rounded-full border-4 border-transparent border-t-gold-500 border-r-gold-300"></div>
                      {/* Center icon */}
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="h-12 w-12 rounded-full bg-gradient-to-br from-gold-400 to-gold-600 flex items-center justify-center shadow-lg shadow-gold-500/30">
                          <Sparkles className="h-6 w-6 text-white" />
                        </div>
                      </div>
                    </div>
                    <h3 className="heading-h2 mb-3">
                      Searching our candidate database...
                    </h3>
                    <p className="body-md max-w-md mx-auto">
                      Our AI is matching your requirements against 44,000+ professionals
                    </p>
                    {/* Progress dots */}
                    <div className="flex justify-center gap-2 mt-6">
                      <div className="h-2 w-2 rounded-full bg-gold-400 animate-bounce" style={{ animationDelay: '0ms' }}></div>
                      <div className="h-2 w-2 rounded-full bg-gold-400 animate-bounce" style={{ animationDelay: '150ms' }}></div>
                      <div className="h-2 w-2 rounded-full bg-gold-400 animate-bounce" style={{ animationDelay: '300ms' }}></div>
                    </div>
                  </div>
                </div>
              )}

              {/* Initial State - No Search Yet - Luxury Styled */}
              {!hasSearched && !isLoading && (
                <div className="relative overflow-hidden bg-white rounded-2xl shadow-xl border border-gray-100 p-8 lg:p-12 flex flex-col items-center justify-center min-h-[450px]">
                  {/* Decorative background */}
                  <div className="absolute inset-0 bg-gradient-to-br from-gold-50/30 via-white to-navy-50/20" />
                  <div className="absolute top-0 right-0 w-64 h-64 bg-gold-100/30 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
                  <div className="absolute bottom-0 left-0 w-48 h-48 bg-navy-100/30 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />

                  <div className="relative">
                    {/* Icon with glow */}
                    <div className="mx-auto mb-8 relative">
                      <div className="absolute inset-0 bg-gold-400/20 rounded-2xl blur-xl scale-150"></div>
                      <div className="relative flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-gold-400 to-gold-600 shadow-lg shadow-gold-500/30">
                        <Search className="h-10 w-10 text-white" />
                      </div>
                    </div>
                    <h3 className="heading-h2 mb-3 text-center">
                      Start Your Search
                    </h3>
                    <p className="body-md max-w-md mx-auto mb-8 text-center">
                      Select a role and enter your requirements to instantly see matching candidates
                      from our database of 44,000+ vetted professionals.
                    </p>
                    {/* Example queries */}
                    <div className="flex flex-wrap justify-center gap-3">
                      {[
                        "Chief Stewardess, Monaco",
                        "Private Chef, London",
                        "Estate Manager, 10+ years",
                        "Nanny, French-speaking",
                        "Butler, experienced",
                        "Chauffeur, security trained"
                      ].map((example) => (
                        <button
                          key={example}
                          onClick={() => {
                            setFormData({ query: example });
                          }}
                          className="rounded-full bg-white border border-gray-200 px-5 py-2.5 text-sm font-medium text-gray-700 hover:border-gold-300 hover:bg-gold-50 hover:text-gold-700 transition-all shadow-sm hover:shadow-md"
                        >
                          {example}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Results */}
              {hasSearched && !isLoading && (
                <>
                  {/* Results Header - Luxury Styled */}
                  <div className="mb-8">
                    <div className="flex items-center justify-between flex-wrap gap-4 mb-6">
                      <div>
                        <h2 className="heading-h1">
                          {candidates.length > 0 ? (
                            <>
                              {filteredAndSortedCandidates.length === candidates.length ? (
                                <>{candidates.length} Matching{" "}</>
                              ) : (
                                <>{filteredAndSortedCandidates.length} of {candidates.length}{" "}</>
                              )}
                              <span className="text-gradient-gold">Matching</span>{" "}
                              Candidates
                            </>
                          ) : (
                            "No Exact Matches Found"
                          )}
                        </h2>
                        <p className="body-md mt-2">
                          {candidates.length > 0
                            ? "Preview of candidates matching your requirements"
                            : "Our team can help find the perfect candidate for your needs"}
                        </p>
                      </div>
                      {candidates.length > 0 && (
                        <div className="badge-available flex items-center gap-2 px-5 py-2.5">
                          <Sparkles className="h-4 w-4" />
                          AI Matched
                        </div>
                      )}
                    </div>

                    {/* Filter & Sort Controls - Luxury Styled */}
                    {candidates.length > 0 && (
                      <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
                        <div className="flex items-center justify-between mb-4">
                          <button
                            onClick={() => setShowResultFilters(!showResultFilters)}
                            className="flex items-center gap-2 text-sm font-semibold text-navy-800 hover:text-navy-900 transition-colors"
                          >
                            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-navy-100">
                              <Filter className="h-3.5 w-3.5 text-navy-600" />
                            </div>
                            Filter & Sort Results
                            <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform ${showResultFilters ? "rotate-180" : ""}`} />
                          </button>
                          {hasActiveFilters && (
                            <button
                              onClick={resetFilters}
                              className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-red-600 transition-colors"
                            >
                              <X className="h-4 w-4" />
                              Clear filters
                            </button>
                          )}
                        </div>

                        {showResultFilters && (
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-3 border-t border-gray-100">
                            {/* Sort By */}
                            <div>
                              <label className="block text-xs font-medium text-gray-500 mb-1">
                                Sort By
                              </label>
                              <select
                                value={sortBy}
                                onChange={(e) => setSortBy(e.target.value)}
                                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-gold-500 focus:ring-1 focus:ring-gold-500"
                              >
                                {SORT_OPTIONS.map((option) => (
                                  <option key={option.value} value={option.value}>
                                    {option.label}
                                  </option>
                                ))}
                              </select>
                            </div>

                            {/* Experience Filter */}
                            <div>
                              <label className="block text-xs font-medium text-gray-500 mb-1">
                                Experience
                              </label>
                              <select
                                value={experienceFilter}
                                onChange={(e) => setExperienceFilter(e.target.value)}
                                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-gold-500 focus:ring-1 focus:ring-gold-500"
                              >
                                {EXPERIENCE_FILTERS.map((option) => (
                                  <option key={option.value} value={option.value}>
                                    {option.label}
                                  </option>
                                ))}
                              </select>
                            </div>

                            {/* Availability Filter */}
                            <div>
                              <label className="block text-xs font-medium text-gray-500 mb-1">
                                Availability
                              </label>
                              <select
                                value={availabilityFilter}
                                onChange={(e) => setAvailabilityFilter(e.target.value)}
                                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-gold-500 focus:ring-1 focus:ring-gold-500"
                              >
                                {AVAILABILITY_FILTERS.map((option) => (
                                  <option key={option.value} value={option.value}>
                                    {option.label}
                                  </option>
                                ))}
                              </select>
                            </div>

                            {/* Language Filter */}
                            <div>
                              <label className="block text-xs font-medium text-gray-500 mb-1">
                                Language
                              </label>
                              <select
                                value={languageFilter}
                                onChange={(e) => setLanguageFilter(e.target.value)}
                                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-gold-500 focus:ring-1 focus:ring-gold-500"
                              >
                                <option value="all">Any Language</option>
                                {availableLanguages.map((lang) => (
                                  <option key={lang} value={lang}>
                                    {lang}
                                  </option>
                                ))}
                              </select>
                            </div>
                          </div>
                        )}

                        {/* Active Filters Display */}
                        {hasActiveFilters && !showResultFilters && (
                          <div className="flex flex-wrap gap-2 pt-2">
                            {experienceFilter !== "all" && (
                              <span className="inline-flex items-center gap-1 rounded-full bg-gold-100 px-3 py-1 text-xs font-medium text-gold-700">
                                {EXPERIENCE_FILTERS.find((f) => f.value === experienceFilter)?.label}
                                <button onClick={() => setExperienceFilter("all")} className="hover:text-gold-900">
                                  <X className="h-3 w-3" />
                                </button>
                              </span>
                            )}
                            {availabilityFilter !== "all" && (
                              <span className="inline-flex items-center gap-1 rounded-full bg-gold-100 px-3 py-1 text-xs font-medium text-gold-700">
                                {AVAILABILITY_FILTERS.find((f) => f.value === availabilityFilter)?.label}
                                <button onClick={() => setAvailabilityFilter("all")} className="hover:text-gold-900">
                                  <X className="h-3 w-3" />
                                </button>
                              </span>
                            )}
                            {languageFilter !== "all" && (
                              <span className="inline-flex items-center gap-1 rounded-full bg-gold-100 px-3 py-1 text-xs font-medium text-gold-700">
                                {languageFilter}
                                <button onClick={() => setLanguageFilter("all")} className="hover:text-gold-900">
                                  <X className="h-3 w-3" />
                                </button>
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Search Quality Banner - shown when no strong matches */}
                  {searchQualityMetrics?.showQualityBanner && (
                    <SearchQualityBanner
                      query={formData.query}
                      bestScore={searchQualityMetrics.bestMatch}
                      onContactClick={() => setShowEmailCapture(true)}
                      onRefineSearch={() => setShowFilters(true)}
                      className="mb-8"
                    />
                  )}

                  {filteredAndSortedCandidates.length > 0 ? (
                    <>
                      {/* Candidate Cards - Using Design System */}
                      <div className="space-y-8">
                        {filteredAndSortedCandidates.map((candidate, index) => (
                          <div
                            key={candidate.id}
                            className="card group relative overflow-hidden hover:shadow-xl transition-all duration-500"
                          >
                            {/* Top Banner with Match Score - Design System */}
                            <div className="relative gradient-navy px-4 sm:px-8 py-6">
                              {/* Decorative gold accent */}
                              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-gold-500/10 via-transparent to-transparent" />
                              <div className="absolute bottom-0 left-0 right-0 h-px gradient-gold-shimmer opacity-30" />

                              <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                                <div className="flex items-center gap-4 sm:gap-5">
                                  {/* Blurred Avatar or Fallback - Enhanced */}
                                  <div className="relative flex-shrink-0">
                                    {candidate.avatar_url ? (
                                      <div className="relative h-20 w-20 rounded-xl overflow-hidden ring-2 ring-gold-500/30 shadow-lg">
                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                        <img
                                          src={candidate.avatar_url}
                                          alt=""
                                          className="h-full w-full object-cover blur-[2px] scale-105"
                                        />
                                        <div className="absolute inset-0 bg-gradient-to-br from-navy-800/20 to-navy-900/30" />
                                      </div>
                                    ) : (
                                      <div className="flex h-20 w-20 items-center justify-center rounded-xl gradient-gold text-white text-3xl font-bold ring-2 ring-gold-500/30 shadow-lg shadow-gold">
                                        {candidate.display_name?.charAt(0) || String.fromCharCode(65 + index)}
                                      </div>
                                    )}
                                    {/* Verified Badge - Premium */}
                                    <div className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 ring-2 ring-white shadow-lg">
                                      <Shield className="h-4 w-4 text-white" />
                                    </div>
                                  </div>
                                  <div>
                                    <h3 className="font-cormorant font-semibold text-white text-2xl tracking-tight">
                                      {candidate.display_name || `Candidate ${String.fromCharCode(65 + index)}`}
                                    </h3>
                                    <p className="text-gold-400 font-medium text-lg font-inter">
                                      {candidate.position}
                                    </p>
                                  </div>
                                </div>
                                {/* Match Score - Tiered Quality Badge */}
                                <div className="text-right">
                                  <MatchQualityBadge
                                    score={Math.round(candidate.match_score * 100)}
                                    size="md"
                                  />
                                </div>
                              </div>
                            </div>

                            {/* Key Metrics Bar - Design System */}
                            <div className="bg-surface-ivory border-b border-gray-200 px-4 sm:px-8 py-4">
                              <div className="flex flex-wrap items-center gap-4 sm:gap-8">
                                <div className="flex items-center gap-2">
                                  <Briefcase className="h-5 w-5 text-gold-600" />
                                  <span className="heading-h6">{candidate.experience_years}+ years</span>
                                  <span className="body-sm">experience</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Globe className="h-5 w-5 text-gold-600" />
                                  <span className="body-md text-navy-800">{candidate.nationality}</span>
                                </div>
                                {candidate.languages.length > 0 && (
                                  <div className="flex items-center gap-2">
                                    <Languages className="h-5 w-5 text-gold-600" />
                                    <span className="body-md text-navy-800">{candidate.languages.join(", ")}</span>
                                  </div>
                                )}
                                <div className="flex items-center gap-2">
                                  <Calendar className="h-5 w-5 text-navy-400" />
                                  <span className="inline-flex items-center px-2.5 py-1 bg-navy-100 text-navy-500 font-inter text-xs font-medium rounded">
                                    To Be Confirmed
                                  </span>
                                </div>
                              </div>
                            </div>

                            {/* Main Content */}
                            <div className="p-4 sm:p-8">
                              {/* WHY THEY'RE THE RIGHT FIT - Tiered based on match quality */}
                              {candidate.why_good_fit && (
                                getMatchTier(Math.round(candidate.match_score * 100)) === 'excellent' ||
                                getMatchTier(Math.round(candidate.match_score * 100)) === 'strong' ? (
                                  <div className="mb-6 bg-gradient-to-r from-success-50 via-success-100 to-success-50 rounded-xl p-5 border border-success-200">
                                    <div className="label-md text-success-700 mb-2 flex items-center gap-2">
                                      <Target className="h-4 w-4" />
                                      Why this candidate could be a good match
                                    </div>
                                    <p className="body-md text-success-800">
                                      {candidate.why_good_fit}
                                    </p>
                                  </div>
                                ) : (
                                  <div className="mb-6 bg-gradient-to-r from-navy-50 via-navy-100 to-navy-50 rounded-xl p-5 border border-navy-200">
                                    <div className="label-md text-navy-600 mb-2 flex items-center gap-2">
                                      <Search className="h-4 w-4" />
                                      Why This Candidate Appears
                                    </div>
                                    <p className="body-md text-navy-700">
                                      {candidate.why_good_fit}
                                    </p>
                                  </div>
                                )
                              )}

                              {/* Professional Summary */}
                              <div className="mb-6">
                                <h4 className="label-md mb-2 flex items-center gap-2">
                                  <FileCheck className="h-4 w-4 text-gold-600" />
                                  Professional Summary
                                </h4>
                                <div className="space-y-3">
                                  {candidate.rich_bio.split(/(?<=[.!?])\s+(?=[A-Z])/).map((paragraph, i) => (
                                    <p key={i} className="body-md">
                                      {paragraph.trim()}
                                    </p>
                                  ))}
                                </div>
                              </div>

                              {/* Skills & Qualities Section */}
                              <div className="space-y-6 mb-6">
                                {/* Professional Qualities - Full Width */}
                                {candidate.employee_qualities?.length > 0 && (
                                  <div className="bg-gradient-to-br from-burgundy-50 to-burgundy-100 rounded-xl border border-burgundy-200 p-5">
                                    <h5 className="label-md text-burgundy-700 mb-4 flex items-center gap-2">
                                      <Heart className="h-5 w-5 text-burgundy-500" />
                                      Professional Qualities
                                    </h5>
                                    <div className="flex flex-wrap gap-2">
                                      {candidate.employee_qualities.slice(0, 8).map((quality, i) => (
                                        <span
                                          key={i}
                                          className="inline-flex items-center gap-2 rounded-lg bg-white px-3 py-2 text-sm font-medium text-burgundy-700 border border-burgundy-200 shadow-xs"
                                        >
                                          <CheckCircle className="h-4 w-4 text-burgundy-500" />
                                          {quality}
                                        </span>
                                      ))}
                                    </div>
                                  </div>
                                )}

                                {/* Longevity & Stability Assessment */}
                                {candidate.longevity_assessment && (
                                  <div className="bg-gradient-to-br from-navy-50 to-navy-100 rounded-xl border border-navy-200 p-5">
                                    <h5 className="label-md text-navy-700 mb-3 flex items-center gap-2">
                                      <Calendar className="h-5 w-5 text-navy-500" />
                                      Career Stability
                                    </h5>
                                    <p className="body-md text-navy-800">
                                      {candidate.longevity_assessment}
                                    </p>
                                  </div>
                                )}

                                {/* Qualifications & Core Competencies - Two Columns on larger screens */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                  {/* Qualifications & Certifications */}
                                  {candidate.qualifications?.length > 0 && (
                                    <div className="bg-gradient-to-br from-gold-50 to-gold-100 rounded-xl border border-gold-200 p-5">
                                      <h5 className="label-md text-gold-700 mb-4 flex items-center gap-2">
                                        <GraduationCap className="h-5 w-5 text-gold-600" />
                                        Qualifications & Training
                                      </h5>
                                      <div className="flex flex-wrap gap-2">
                                        {candidate.qualifications.slice(0, 6).map((qual, i) => (
                                          <span
                                            key={i}
                                            className="inline-flex items-center rounded-lg bg-white px-3 py-2 text-sm font-medium text-gold-800 border border-gold-200 shadow-xs"
                                          >
                                            <Award className="h-4 w-4 mr-2 text-gold-600" />
                                            {qual}
                                          </span>
                                        ))}
                                      </div>
                                    </div>
                                  )}

                                  {/* Key Strengths */}
                                  {candidate.key_strengths?.length > 0 && (
                                    <div className="bg-surface-cream rounded-xl border border-gray-200 p-5">
                                      <h5 className="label-md mb-4 flex items-center gap-2">
                                        <Sparkles className="h-5 w-5 text-gold-600" />
                                        Core Competencies
                                      </h5>
                                      <div className="flex flex-wrap gap-2">
                                        {candidate.key_strengths.slice(0, 6).map((strength, i) => (
                                          <span
                                            key={i}
                                            className="inline-flex items-center rounded-full bg-navy-100 px-4 py-2 text-sm font-medium text-navy-700"
                                          >
                                            {strength}
                                          </span>
                                        ))}
                                      </div>
                                    </div>
                                  )}
                                </div>

                                {/* Career Highlights & Previous Employment - Two Columns when both exist */}
                                {(candidate.career_highlights?.length > 0 || (candidate.work_history?.length ?? 0) > 0 || candidate.notable_employers?.length > 0) && (
                                <div className={`grid grid-cols-1 gap-6 ${
                                  candidate.career_highlights?.length > 0 && ((candidate.work_history?.length ?? 0) > 0 || candidate.notable_employers?.length > 0)
                                    ? 'md:grid-cols-2'
                                    : ''
                                }`}>
                                  {/* Career Highlights */}
                                  {candidate.career_highlights?.length > 0 && (
                                    <div className="bg-surface-cream rounded-xl border border-gray-200 p-5">
                                      <h5 className="label-md mb-4 flex items-center gap-2">
                                        <Star className="h-5 w-5 text-gold-500" />
                                        Career Achievements
                                      </h5>
                                      <ul className="space-y-3">
                                        {candidate.career_highlights.slice(0, 5).map((highlight, i) => (
                                          <li
                                            key={i}
                                            className="flex items-start gap-3 body-sm text-navy-700"
                                          >
                                            <CheckCircle className="h-5 w-5 text-success-500 mt-0.5 flex-shrink-0" />
                                            <span>{highlight}</span>
                                          </li>
                                        ))}
                                      </ul>
                                    </div>
                                  )}

                                  {/* Work History */}
                                  {candidate.work_history && candidate.work_history.length > 0 ? (
                                    <div className="bg-surface-cream rounded-xl border border-gray-200 p-5">
                                      <h5 className="label-md mb-4 flex items-center gap-2">
                                        <Briefcase className="h-5 w-5 text-gold-600" />
                                        Work History
                                      </h5>
                                      <div className="space-y-3">
                                        {candidate.work_history.slice(0, 5).map((job, i) => (
                                          <div
                                            key={i}
                                            className="bg-gray-50 rounded-lg px-4 py-3 border-l-4 border-navy-500"
                                          >
                                            <div className="flex justify-between items-start gap-2">
                                              <div className="font-semibold text-gray-900">{job.employer}</div>
                                              {job.duration && (
                                                <span className="text-xs font-medium text-navy-600 bg-navy-50 px-2 py-1 rounded whitespace-nowrap">
                                                  {job.duration}
                                                </span>
                                              )}
                                            </div>
                                            <div className="text-sm text-gray-700 mt-1">{job.position}</div>
                                            <div className="flex flex-wrap gap-x-3 gap-y-1 mt-2 text-xs text-gray-500">
                                              {job.dates && <span>{job.dates}</span>}
                                              {job.details && <span className="text-gray-400">•</span>}
                                              {job.details && <span>{job.details}</span>}
                                            </div>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  ) : candidate.notable_employers?.length > 0 && (
                                    <div className="bg-white rounded-xl border border-gray-200 p-5">
                                      <h5 className="text-sm font-bold text-gray-900 uppercase tracking-wide mb-4 flex items-center gap-2">
                                        <Building2 className="h-5 w-5 text-navy-600" />
                                        Previous Employment
                                      </h5>
                                      <div className="space-y-2">
                                        {candidate.notable_employers.slice(0, 5).map((employer, i) => (
                                          <div
                                            key={i}
                                            className="flex items-center gap-3 text-gray-700 bg-gray-50 rounded-lg px-4 py-3"
                                          >
                                            <div className="h-2.5 w-2.5 rounded-full bg-navy-500" />
                                            {employer}
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  )}
                                </div>
                                )}
                              </div>

                              {/* Bottom Stats Bar - Design System */}
                              <div className="bg-surface-ivory rounded-xl border border-gray-200 p-5 mb-6">
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
                                  <div>
                                    <div className="stat-number text-3xl text-gradient-gold">{candidate.experience_years}+</div>
                                    <div className="label-sm">Years Experience</div>
                                  </div>
                                  <div>
                                    <div className="stat-number text-3xl text-gradient-gold">{candidate.languages.length}</div>
                                    <div className="label-sm">Languages</div>
                                  </div>
                                  <div>
                                    <div className="stat-number text-3xl text-gradient-gold">{candidate.qualifications?.length || 0}+</div>
                                    <div className="label-sm">Certifications</div>
                                  </div>
                                  <div>
                                    <div className="flex items-center justify-center gap-2">
                                      <Users className="h-6 w-6 text-success-500" />
                                      <span className="stat-number text-3xl text-success-500">✓</span>
                                    </div>
                                    <div className="label-sm">References Available</div>
                                  </div>
                                </div>
                              </div>

                              {/* CTA Footer - Design System */}
                              <div className="flex items-center justify-between pt-5 border-t border-gray-200">
                                <p className="body-sm text-gray-500 italic">
                                  Full CV, references, and contact details available upon request
                                </p>
                                <button
                                  onClick={() => setShowEmailCapture(true)}
                                  className="btn-primary group"
                                >
                                  <span>Request Full Profile</span>
                                  <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-0.5 transition-transform" />
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Bottom CTA - Design System */}
                      <div className="mt-10 rounded-2xl gradient-navy p-8 text-center relative overflow-hidden">
                        {/* Decorative gold accent */}
                        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-gold-500/10 via-transparent to-transparent" />
                        <div className="relative">
                          <h3 className="font-cormorant text-2xl sm:text-3xl font-medium text-white mb-3">
                            Ready to Connect With These Candidates?
                          </h3>
                          <p className="font-inter text-base sm:text-lg text-gray-300 mb-6 max-w-2xl mx-auto">
                            Enter your email and a dedicated consultant will send you detailed profiles
                            with CVs, references, and contact options within 24 hours.
                          </p>
                          <button
                            onClick={() => setShowEmailCapture(true)}
                            className="btn-primary min-w-[250px] shadow-gold"
                          >
                            Get Full Candidate Profiles
                            <ArrowRight className="ml-2 h-5 w-5" />
                          </button>
                        </div>
                      </div>
                    </>
                  ) : (
                    /* No Results - Design System */
                    <div className="card p-16 text-center">
                      <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-gold-50">
                        <Search className="h-10 w-10 text-gold-400" />
                      </div>
                      <h3 className="heading-h3 mb-3">
                        No Exact Matches Found
                      </h3>
                      <p className="body-md mb-8 max-w-md mx-auto">
                        We couldn&apos;t find an exact match for your criteria, but our team specializes
                        in finding exceptional candidates for unique requirements.
                      </p>
                      <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                        <button onClick={() => setShowEmailCapture(true)} className="btn-primary">
                          Speak to a Consultant
                          <ArrowRight className="ml-2 h-4 w-4" />
                        </button>
                        <button onClick={() => setShowFilters(true)} className="btn-secondary">
                          <RefreshCw className="mr-2 h-4 w-4" />
                          Adjust Criteria
                        </button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Lead Capture Modal */}
      {showEmailCapture && (
        <LeadCaptureForm
          initialQuery={formData.query}
          matchedCount={candidates.length}
          onClose={() => setShowEmailCapture(false)}
          variant="modal"
        />
      )}

      <PublicFooter />
    </div>
  );
}

export default function MatchPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-gold-500" />
        </div>
      }
    >
      <MatchPageContent />
    </Suspense>
  );
}
