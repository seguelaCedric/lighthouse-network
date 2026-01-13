"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Ship,
  Home,
  Check,
  ChevronLeft,
  ChevronRight,
  Heart,
  Save,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  RefreshCw,
  DollarSign,
  Calendar,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { updateJobPreferences, markPreferencesComplete, loadJobMatches, type JobPreferencesData } from "./actions";
import {
  IndustrySelector,
  YachtPreferencesForm,
  HouseholdPreferencesForm,
  CoupleSection,
  StepNavigator,
  JobMatchCard,
} from "@/components/preferences";
import { yachtPositionLabels, householdPositionLabels, regionLabels } from "@/components/preferences/constants";
import type { JobMatchResult } from "@lighthouse/ai/matcher";

interface PreferencesClientProps {
  candidateId: string;
  initialData: {
    industryPreference: "yacht" | "household" | "both" | null;
    yachtPrimaryPosition: string | null;
    yachtSecondaryPositions: string[];
    yachtSizeMin: number | null;
    yachtSizeMax: number | null;
    yachtTypes: string[];
    contractTypes: string[];
    regions: string[];
    leavePackage: string | null;
    salaryCurrency: string;
    salaryMin: number | null;
    salaryMax: number | null;
    availabilityStatus: "available" | "looking" | "employed" | "unavailable";
    availableFrom: string | null;
    householdPrimaryPosition: string | null;
    householdSecondaryPositions: string[];
    householdLocations: string[];
    livingArrangement: "live_in" | "live_out" | "flexible" | null;
    isCouple: boolean;
    partnerName: string | null;
    partnerPosition: string | null;
    preferencesCompletedAt: string | null;
  };
}

type Step = "industry" | "yacht" | "household" | "couple" | "complete";

// Profile status from job matches API
interface ProfileStatus {
  completeness: number;
  canQuickApply: boolean;
  missingFields: string[];
  hasCV: boolean;
  candidateId: string;
}

export default function PreferencesClient({ candidateId, initialData }: PreferencesClientProps) {
  const router = useRouter();

  // Form state
  const [formData, setFormData] = React.useState<JobPreferencesData>({
    industryPreference: initialData.industryPreference,
    yachtPrimaryPosition: initialData.yachtPrimaryPosition,
    yachtSecondaryPositions: initialData.yachtSecondaryPositions,
    yachtSizeMin: initialData.yachtSizeMin,
    yachtSizeMax: initialData.yachtSizeMax,
    yachtTypes: initialData.yachtTypes,
    contractTypes: initialData.contractTypes,
    regions: initialData.regions,
    leavePackage: initialData.leavePackage,
    salaryCurrency: initialData.salaryCurrency,
    salaryMin: initialData.salaryMin,
    salaryMax: initialData.salaryMax,
    availabilityStatus: initialData.availabilityStatus,
    availableFrom: initialData.availableFrom,
    householdPrimaryPosition: initialData.householdPrimaryPosition,
    householdSecondaryPositions: initialData.householdSecondaryPositions,
    householdLocations: initialData.householdLocations,
    livingArrangement: initialData.livingArrangement,
    isCouple: initialData.isCouple,
    partnerName: initialData.partnerName,
    partnerPosition: initialData.partnerPosition,
  });

  // AI Matched jobs state
  const [matchedJobs, setMatchedJobs] = React.useState<JobMatchResult[]>([]);
  const [loadingMatches, setLoadingMatches] = React.useState(false);
  const [profileStatus, setProfileStatus] = React.useState<ProfileStatus | null>(null);
  const [applyingJobId, setApplyingJobId] = React.useState<string | null>(null);
  
  // Sort state for job recommendations
  const [sortBy, setSortBy] = React.useState<"match_score" | "date_posted" | "salary_high" | "salary_low" | "urgent_first" | "alphabetical">("match_score");

  // Determine initial step
  const getInitialStep = (): Step => {
    if (!initialData.industryPreference) return "industry";
    if (initialData.preferencesCompletedAt) return "complete";
    return "industry";
  };

  const [currentStep, setCurrentStep] = React.useState<Step>(getInitialStep);
  const [isSaving, setIsSaving] = React.useState(false);
  const [saveStatus, setSaveStatus] = React.useState<"idle" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);

  // Auto-save with debounce
  const saveTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);
  const lastSavedDataRef = React.useRef<string>(JSON.stringify(formData));

  const savePreferences = React.useCallback(
    async (data: Partial<JobPreferencesData>) => {
      setIsSaving(true);
      setSaveStatus("idle");
      setErrorMessage(null);

      const result = await updateJobPreferences(candidateId, data);

      if (result.success) {
        setSaveStatus("success");
        lastSavedDataRef.current = JSON.stringify(formData);
        setTimeout(() => setSaveStatus("idle"), 2000);
      } else {
        setSaveStatus("error");
        setErrorMessage(result.error || "Failed to save");
      }

      setIsSaving(false);
    },
    [candidateId, formData]
  );

  // Debounced auto-save
  React.useEffect(() => {
    const currentDataString = JSON.stringify(formData);
    if (currentDataString === lastSavedDataRef.current) return;

    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = setTimeout(() => {
      savePreferences(formData);
    }, 1500);

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [formData, savePreferences]);

  // Load AI-powered matched jobs using server action (no API route needed)
  const loadMatchedJobs = React.useCallback(async () => {
    setLoadingMatches(true);
    try {
      // Determine industry for filtering
      const industry = formData.industryPreference || "both";

      // Use server action directly - bypasses cookie issues with API routes
      const result = await loadJobMatches(candidateId, {
        industry,
        limit: 10,
        minScore: 30,
        includeAISummary: true,
      });

      if (!result.success) {
        console.error("Failed to load job matches:", result.error);
        setMatchedJobs([]);
        setProfileStatus({
          completeness: 0,
          canQuickApply: false,
          missingFields: ["candidate_profile"],
          hasCV: false,
          candidateId: candidateId,
        });
        setLoadingMatches(false);
        return;
      }

      if (result.matches) {
        setMatchedJobs(result.matches);
      }

      if (result.profile) {
        setProfileStatus(result.profile);
      }
    } catch (error) {
      console.error("Error loading matched jobs:", error);
    } finally {
      setLoadingMatches(false);
    }
  }, [formData.industryPreference, candidateId]);

  // Sort matched jobs based on sortBy
  const sortedMatchedJobs = React.useMemo(() => {
    return [...matchedJobs].sort((a, b) => {
      switch (sortBy) {
        case "match_score": {
          // Sort by match score (highest first)
          if (a.matchScore !== b.matchScore) {
            return b.matchScore - a.matchScore;
          }
          // Secondary: date posted (newest first)
          const dateA = (a.job as any).published_at ? new Date((a.job as any).published_at).getTime() : 0;
          const dateB = (b.job as any).published_at ? new Date((b.job as any).published_at).getTime() : 0;
          return dateB - dateA;
        }
        case "date_posted": {
          // Sort by date posted (newest first)
          const dateA = (a.job as any).published_at ? new Date((a.job as any).published_at).getTime() : 0;
          const dateB = (b.job as any).published_at ? new Date((b.job as any).published_at).getTime() : 0;
          return dateB - dateA;
        }
        case "salary_high": {
          // Sort by salary high to low
          const maxA = a.job.salary_max ?? 0;
          const maxB = b.job.salary_max ?? 0;
          if (maxA !== maxB) return maxB - maxA;
          // Secondary: min salary
          const minA = a.job.salary_min ?? 0;
          const minB = b.job.salary_min ?? 0;
          return minB - minA;
        }
        case "salary_low": {
          // Sort by salary low to high
          const minA = a.job.salary_min ?? Infinity;
          const minB = b.job.salary_min ?? Infinity;
          if (minA !== minB) return minA - minB;
          // Secondary: max salary
          const maxA = a.job.salary_max ?? Infinity;
          const maxB = b.job.salary_max ?? Infinity;
          return maxA - maxB;
        }
        case "urgent_first": {
          // Sort by urgent first, then match score
          const urgentA = (a.job as any).is_urgent ?? false;
          const urgentB = (b.job as any).is_urgent ?? false;
          if (urgentA !== urgentB) {
            return urgentA ? -1 : 1;
          }
          return b.matchScore - a.matchScore;
        }
        case "alphabetical": {
          // Sort by title A-Z
          return a.job.title.localeCompare(b.job.title);
        }
        default:
          return 0;
      }
    });
  }, [matchedJobs, sortBy]);

  // Quick apply handler
  const handleQuickApply = React.useCallback(async (jobId: string) => {
    setApplyingJobId(jobId);
    try {
      const response = await fetch("/api/crew/applications/quick-apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobId }),
        credentials: "include",
      });

      const result = await response.json();

      if (response.ok && result.success) {
        // Update the matched job to show as applied
        setMatchedJobs((prev) =>
          prev.map((match) =>
            match.job.id === jobId
              ? { ...match, hasApplied: true, canQuickApply: false }
              : match
          )
        );
      } else if (result.error === "cv_required") {
        // Update profile status to show CV is missing
        setProfileStatus((prev) => prev ? {
          ...prev,
          hasCV: false,
          canQuickApply: false,
        } : null);
      } else if (result.error === "profile_incomplete") {
        // Update profile status if returned
        if (result.completeness !== undefined) {
          setProfileStatus((prev) => ({
            completeness: result.completeness,
            canQuickApply: false,
            missingFields: result.missingFields || [],
            hasCV: prev?.hasCV ?? true,
            candidateId: prev?.candidateId ?? candidateId,
          }));
        }
      }
      // For already_applied, the UI will update on next refresh
    } catch (error) {
      console.error("Quick apply failed:", error);
    } finally {
      setApplyingJobId(null);
    }
  }, [candidateId]);

  // Handle CV upload success - refresh the hasCV state
  const handleCVUploadSuccess = React.useCallback(() => {
    setProfileStatus((prev) => prev ? {
      ...prev,
      hasCV: true,
      canQuickApply: prev.completeness >= 70,
    } : null);
    // Also update all matched jobs to reflect the new CV status
    setMatchedJobs((prev) =>
      prev.map((match) => ({
        ...match,
        canQuickApply: !match.hasApplied && (profileStatus?.completeness ?? 0) >= 70,
      }))
    );
  }, [profileStatus?.completeness]);

  // View job handler - navigate to job details
  const handleViewJob = React.useCallback((jobId: string) => {
    router.push(`/job-board/${jobId}`);
  }, [router]);

  // Trigger job matching when reaching complete step
  React.useEffect(() => {
    if (currentStep === "complete") {
      loadMatchedJobs();
    }
  }, [currentStep, loadMatchedJobs]);

  // Update form data
  const updateField = <K extends keyof JobPreferencesData>(
    field: K,
    value: JobPreferencesData[K]
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  // Get steps based on industry preference
  const getSteps = (): Step[] => {
    const steps: Step[] = ["industry"];

    if (formData.industryPreference === "yacht" || formData.industryPreference === "both") {
      steps.push("yacht");
    }
    if (formData.industryPreference === "household" || formData.industryPreference === "both") {
      steps.push("household");
    }

    steps.push("couple");

    return steps;
  };

  const steps = getSteps();
  const currentStepIndex = steps.indexOf(currentStep);

  const goToNextStep = async () => {
    // Save current data before moving
    await savePreferences(formData);

    const nextIndex = currentStepIndex + 1;
    if (nextIndex < steps.length) {
      setCurrentStep(steps[nextIndex]);
    } else {
      // Complete preferences
      await markPreferencesComplete(candidateId);
      setCurrentStep("complete");
    }
  };

  const goToPreviousStep = () => {
    const prevIndex = currentStepIndex - 1;
    if (prevIndex >= 0) {
      setCurrentStep(steps[prevIndex]);
    }
  };

  const handleStepClick = async (targetStep: Step) => {
    // 1. Clear debounce timeout
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    // 2. Immediately save current data
    await savePreferences(formData);

    // 3. Navigate to target step
    setCurrentStep(targetStep);

    // 4. Scroll to top on mobile
    if (typeof window !== "undefined" && window.innerWidth < 768) {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const isFirstStep = currentStepIndex === 0;
  const isLastStep = currentStepIndex === steps.length - 1;

  // Progress calculation based on required step completion (optional fields excluded)
  const calculateProgress = (): number => {
    if (steps.length === 0) return 0;

    // Count only steps that are actually required and completed
    const completedSteps = steps.reduce((count, step) => {
      switch (step) {
        case "industry":
          // Industry step is complete if a preference is selected
          return count + (formData.industryPreference ? 1 : 0);
        case "yacht":
          // Yacht step is complete only if industry requires it AND primary position is set
          if (formData.industryPreference === "yacht" || formData.industryPreference === "both") {
            return count + (formData.yachtPrimaryPosition ? 1 : 0);
          }
          // If yacht step is not required, don't count it
          return count;
        case "household":
          // Household step is complete only if industry requires it AND primary position is set
          if (formData.industryPreference === "household" || formData.industryPreference === "both") {
            return count + (formData.householdPrimaryPosition ? 1 : 0);
          }
          // If household step is not required, don't count it
          return count;
        case "couple":
          // Couple step: Since isCouple defaults to false (not null), we can't distinguish "not set" from "set to false"
          // We consider it complete only if:
          // 1. Industry preference is set (required before couple step)
          // 2. AND user has reached couple step or beyond (indicating they've made a choice)
          // OR if partner details are set (which only happens when isCouple is true)
          if (!formData.industryPreference) {
            return count; // Can't complete couple step without industry preference
          }
          const hasReachedCoupleStep = currentStep === "couple" || currentStep === "complete";
          const hasPartnerDetails = formData.partnerName || formData.partnerPosition;
          // Complete if user has reached the step OR has set partner details
          return count + (hasReachedCoupleStep || hasPartnerDetails ? 1 : 0);
        default:
          return count;
      }
    }, 0);

    return Math.round((completedSteps / steps.length) * 100);
  };

  if (currentStep === "complete") {
    return (
      <div className="mx-auto min-h-[calc(100vh-200px)] max-w-4xl px-4 py-6 sm:py-8 md:py-12">
        <div className="rounded-xl border border-success-200 bg-success-50 p-4 text-center sm:rounded-2xl sm:p-6 md:p-8">
          <div className="mx-auto mb-3 flex size-12 items-center justify-center rounded-full bg-success-100 sm:mb-4 sm:size-16">
            <CheckCircle2 className="size-6 text-success-600 sm:size-8" />
          </div>
          <h1 className="mb-2 text-xl font-bold text-navy-900 sm:text-2xl">Preferences Complete!</h1>
          <p className="mb-4 text-sm text-gray-600 sm:mb-6 sm:text-base">
            Your job preferences have been saved. We&apos;ll use these to match you with the perfect
            opportunities.
          </p>
          <div className="flex flex-col gap-2 sm:flex-row sm:justify-center sm:gap-4">
            <Button variant="secondary" onClick={() => setCurrentStep("industry")} className="w-full sm:w-auto">
              Edit Preferences
            </Button>
            <Link href="/crew/dashboard" className="w-full sm:w-auto">
              <Button className="w-full sm:w-auto">Back to Dashboard</Button>
            </Link>
          </div>
        </div>

        {/* Profile Status Banner - CV Required */}
        {profileStatus && !profileStatus.hasCV && (
          <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-3 sm:mt-6 sm:p-4">
            <div className="flex items-start gap-2 sm:gap-3">
              <AlertCircle className="size-4 text-amber-600 shrink-0 mt-0.5 sm:size-5" />
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-semibold text-amber-800 sm:text-base">CV Required for Quick Apply</h3>
                <p className="mt-1 text-xs text-amber-700 sm:text-sm">
                  You need to upload your CV before you can apply to jobs. Click &quot;Upload CV to Apply&quot; on any job card below.
                </p>
                <Link href="/crew/documents" className="mt-2 inline-block sm:mt-3">
                  <Button size="sm" variant="secondary" className="text-xs sm:text-sm">
                    Go to Documents
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* Profile Status Banner - Profile Incomplete */}
        {profileStatus && profileStatus.hasCV && !profileStatus.canQuickApply && profileStatus.completeness < 70 && (
          <div className="mt-4 rounded-xl border border-warning-200 bg-warning-50 p-3 sm:mt-6 sm:p-4">
            <div className="flex items-start gap-2 sm:gap-3">
              <AlertCircle className="size-4 text-warning-600 shrink-0 mt-0.5 sm:size-5" />
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-semibold text-warning-800 sm:text-base">Complete Your Profile to Quick Apply</h3>
                <p className="mt-1 text-xs text-warning-700 sm:text-sm">
                  Your profile is {profileStatus.completeness}% complete. You need at least 70% to use Quick Apply.
                </p>
                {profileStatus.missingFields.length > 0 && (
                  <div className="mt-2">
                    <p className="text-[10px] text-warning-600 font-medium sm:text-xs">Missing fields:</p>
                    <div className="mt-1 flex flex-wrap gap-1">
                      {profileStatus.missingFields.map((field) => (
                        <span
                          key={field}
                          className="inline-block rounded bg-warning-100 px-1.5 py-0.5 text-[10px] text-warning-700 sm:px-2 sm:text-xs"
                        >
                          {field.replace(/_/g, " ")}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                <Link href="/crew/profile/edit" className="mt-2 inline-block sm:mt-3">
                  <Button size="sm" variant="secondary" className="text-xs sm:text-sm">
                    Complete Profile
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* AI Matched Jobs Section */}
        <div className="mt-6 sm:mt-8">
          <div className="mb-4 space-y-3 sm:space-y-0">
            {/* Header with title and description */}
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <Sparkles className="size-4 text-gold-500 shrink-0 sm:size-5" />
                  <h2 className="text-lg font-semibold text-navy-900 sm:text-xl">
                    Your Top Matches
                  </h2>
                </div>
                <p className="text-xs text-gray-600 sm:text-sm">
                  AI-powered job recommendations based on your complete profile
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={loadMatchedJobs}
                disabled={loadingMatches}
                title="Refresh matches"
                className="shrink-0 p-2"
              >
                <RefreshCw className={cn("size-4", loadingMatches && "animate-spin")} />
              </Button>
            </div>
            
            {/* View All Jobs Button - Prominent placement */}
            <div className="flex justify-end sm:justify-start">
              <Link href="/crew/jobs" className="w-full sm:w-auto">
                <Button variant="secondary" size="sm" className="w-full text-xs sm:w-auto sm:text-sm">
                  View All Jobs
                  <ChevronRight className="ml-1.5 size-3.5 sm:size-4" />
                </Button>
              </Link>
            </div>
          </div>

          {loadingMatches ? (
            <div className="flex flex-col items-center justify-center py-8 sm:py-12">
              <div className="relative">
                <Loader2 className="size-8 animate-spin text-gold-500 sm:size-10" />
                <Sparkles className="absolute -right-1 -top-1 size-3 text-gold-400 animate-pulse sm:size-4" />
              </div>
              <span className="mt-3 text-sm text-gray-600 font-medium sm:mt-4 sm:text-base">Analyzing your profile...</span>
              <span className="mt-1 text-xs text-gray-500 sm:text-sm">Finding your perfect matches</span>
            </div>
          ) : matchedJobs.length > 0 ? (
            <>
              {/* Sort Dropdown */}
              <div className="mb-4 flex items-center justify-end gap-2">
                <label htmlFor="sort-select-matches" className="text-xs text-gray-600 sm:text-sm whitespace-nowrap">
                  Sort by:
                </label>
                <select
                  id="sort-select-matches"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
                  className="h-9 rounded-lg border border-gray-300 bg-white px-3 text-sm focus:border-gold-500 focus:outline-none focus:ring-1 focus:ring-gold-500 sm:w-auto min-w-[160px]"
                >
                  <option value="match_score">Best Match</option>
                  <option value="date_posted">Newest First</option>
                  <option value="salary_high">Salary: High to Low</option>
                  <option value="salary_low">Salary: Low to High</option>
                  <option value="urgent_first">Urgent Jobs First</option>
                  <option value="alphabetical">Job Title: A-Z</option>
                </select>
              </div>
              
              <div className="space-y-4">
                {sortedMatchedJobs.map((match) => (
                  <JobMatchCard
                    key={match.job.id}
                    match={match}
                    onQuickApply={handleQuickApply}
                    onViewJob={handleViewJob}
                    hasCV={profileStatus?.hasCV}
                    candidateId={profileStatus?.candidateId ?? candidateId}
                    onCVUploadSuccess={handleCVUploadSuccess}
                  />
                ))}
              </div>
            </>
          ) : (
            <div className="rounded-xl border border-gray-200 bg-white p-6 text-center sm:p-8">
              <div className="mx-auto mb-3 flex size-10 items-center justify-center rounded-full bg-gray-100 sm:size-12">
                <AlertCircle className="size-5 text-gray-400 sm:size-6" />
              </div>
              <h3 className="text-base font-semibold text-navy-800 mb-1 sm:text-lg">No Matching Jobs Found</h3>
              <p className="text-xs text-gray-600 sm:text-sm">
                We couldn&apos;t find jobs matching your preferences right now.
                <br className="hidden sm:block" />
                <span className="sm:hidden"> </span>
                Try adjusting your preferences or check back soon for new opportunities.
              </p>
              <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:justify-center sm:gap-3">
                <Button variant="secondary" onClick={() => setCurrentStep("industry")} className="w-full sm:w-auto">
                  Adjust Preferences
                </Button>
                <Link href="/job-board" className="w-full sm:w-auto">
                  <Button className="w-full sm:w-auto">Browse All Jobs</Button>
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-4 sm:px-6 sm:py-8">
      {/* Header */}
      <div className="mb-6 border-b border-gray-200 pb-4 sm:mb-8">
        <Link
          href="/crew/dashboard"
          className="mb-4 inline-flex items-center gap-2 text-sm font-medium text-gold-600 hover:text-gold-700"
        >
          <ChevronLeft className="size-4" />
          Back to dashboard
        </Link>
        <h1 className="flex flex-wrap items-center gap-2 font-serif text-2xl font-semibold text-navy-800 sm:gap-3 sm:text-3xl">
          <Sparkles className="size-6 text-gold-500 sm:size-7" />
          Job Preferences
        </h1>
        <p className="mt-2 text-sm text-gray-600 sm:text-base">
          Tell us what you&apos;re looking for so we can match you with the right opportunities
        </p>
      </div>

      {/* Progress bar */}
      <div className="mb-6 sm:mb-8">
        <div className="mb-2 flex items-center justify-between text-xs sm:text-sm">
          <span className="text-gray-500">
            Step {currentStepIndex + 1} of {steps.length}
          </span>
          <span className="font-medium text-navy-600">{calculateProgress()}% complete</span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-gray-200">
          <div
            className="h-full bg-gold-500 transition-all duration-300"
            style={{ width: `${calculateProgress()}%` }}
          />
        </div>
      </div>

      {/* Two-column layout with sidebar */}
      <div className="flex flex-col gap-4 md:flex-row md:gap-6">
        {/* Desktop Sidebar Navigator */}
        <div className="hidden md:block md:w-[280px] md:shrink-0">
          <StepNavigator
            steps={steps}
            currentStep={currentStep}
            formData={formData}
            onStepClick={handleStepClick}
          />
        </div>

        {/* Main Content Area */}
        <div className="flex-1 min-w-0">
          {/* Mobile Horizontal Stepper */}
          <div className="mb-4 block md:hidden sm:mb-6">
            <StepNavigator
              steps={steps}
              currentStep={currentStep}
              formData={formData}
              onStepClick={handleStepClick}
              variant="horizontal"
            />
          </div>

          {/* Save status indicator */}
          <div className="mb-4 flex items-center justify-end gap-2 text-xs sm:text-sm">
            {isSaving && (
              <>
                <Loader2 className="size-4 animate-spin text-gray-400" />
                <span className="text-gray-500">Saving...</span>
              </>
            )}
            {saveStatus === "success" && (
              <>
                <Check className="size-4 text-success-500" />
                <span className="text-success-600">Saved</span>
              </>
            )}
            {saveStatus === "error" && (
              <>
                <AlertCircle className="size-4 text-error-500" />
                <span className="text-error-600">{errorMessage || "Error saving"}</span>
              </>
            )}
          </div>

          {/* Form content */}
          <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm sm:p-6">
        {currentStep === "industry" && (
          <IndustrySelector
            value={formData.industryPreference}
            onChange={(value) => updateField("industryPreference", value)}
          />
        )}

        {currentStep === "yacht" && (
          <YachtPreferencesForm
            data={{
              primaryPosition: formData.yachtPrimaryPosition,
              secondaryPositions: formData.yachtSecondaryPositions,
              yachtSizeMin: formData.yachtSizeMin,
              yachtSizeMax: formData.yachtSizeMax,
              yachtTypes: formData.yachtTypes,
              contractTypes: formData.contractTypes,
              regions: formData.regions,
              leavePackage: formData.leavePackage,
              salaryCurrency: formData.salaryCurrency,
              salaryMin: formData.salaryMin,
              salaryMax: formData.salaryMax,
              availabilityStatus: formData.availabilityStatus,
              availableFrom: formData.availableFrom,
            }}
            onChange={(field, value) => {
              if (field === "primaryPosition") updateField("yachtPrimaryPosition", value as string);
              else if (field === "secondaryPositions")
                updateField("yachtSecondaryPositions", value as string[]);
              else if (field === "yachtSizeMin") updateField("yachtSizeMin", value as number | null);
              else if (field === "yachtSizeMax") updateField("yachtSizeMax", value as number | null);
              else if (field === "yachtTypes") updateField("yachtTypes", value as string[]);
              else updateField(field as keyof JobPreferencesData, value as JobPreferencesData[keyof JobPreferencesData]);
            }}
          />
        )}

        {currentStep === "household" && (
          <HouseholdPreferencesForm
            data={{
              primaryPosition: formData.householdPrimaryPosition,
              secondaryPositions: formData.householdSecondaryPositions,
              locations: formData.householdLocations,
              livingArrangement: formData.livingArrangement,
              salaryCurrency: formData.salaryCurrency,
              salaryMin: formData.salaryMin,
              salaryMax: formData.salaryMax,
              availabilityStatus: formData.availabilityStatus,
              availableFrom: formData.availableFrom,
            }}
            onChange={(field, value) => {
              if (field === "primaryPosition")
                updateField("householdPrimaryPosition", value as string);
              else if (field === "secondaryPositions")
                updateField("householdSecondaryPositions", value as string[]);
              else if (field === "locations")
                updateField("householdLocations", value as string[]);
              else if (field === "livingArrangement")
                updateField(
                  "livingArrangement",
                  value as "live_in" | "live_out" | "flexible" | null
                );
              else updateField(field as keyof JobPreferencesData, value as JobPreferencesData[keyof JobPreferencesData]);
            }}
            showSalaryAndAvailability={formData.industryPreference === "household"}
          />
        )}

        {currentStep === "couple" && (
          <CoupleSection
            isCouple={formData.isCouple}
            partnerName={formData.partnerName}
            partnerPosition={formData.partnerPosition}
            onChange={(field, value) => {
              updateField(field as keyof JobPreferencesData, value as JobPreferencesData[keyof JobPreferencesData]);
            }}
          />
        )}
          </div>

          {/* Navigation buttons */}
          <div className="mt-6 flex items-center justify-between">
            <Button
              variant="secondary"
              onClick={goToPreviousStep}
              disabled={isFirstStep}
              className={cn(isFirstStep && "invisible")}
            >
              <ChevronLeft className="mr-1 size-4" />
              Back
            </Button>

            <Button onClick={goToNextStep} disabled={isSaving}>
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" />
                  Saving...
                </>
              ) : isLastStep ? (
                <>
                  Complete
                  <Check className="ml-1 size-4" />
                </>
              ) : (
                <>
                  Continue
                  <ChevronRight className="ml-1 size-4" />
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
