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
import type { JobMatchResult } from "@lighthouse/ai/matcher";

interface PreferencesClientProps {
  candidateId: string;
  initialData: {
    industryPreference: "yacht" | "household" | "both" | null;
    yachtPrimaryPosition: string | null;
    yachtSecondaryPositions: string[];
    yachtSizeMin: number | null;
    yachtSizeMax: number | null;
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
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/db21c2cf-b379-416a-8679-3c252c39767b',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'preferences-client.tsx:161',message:'loadMatchedJobs entry',data:{candidateId,industryPreference:formData.industryPreference},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
    // #endregion
    setLoadingMatches(true);
    try {
      // Determine industry for filtering
      const industry = formData.industryPreference || "both";

      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/db21c2cf-b379-416a-8679-3c252c39767b',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'preferences-client.tsx:168',message:'calling loadJobMatches',data:{candidateId,industry,limit:10,minScore:30},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
      // #endregion

      // Use server action directly - bypasses cookie issues with API routes
      const result = await loadJobMatches(candidateId, {
        industry,
        limit: 10,
        minScore: 30,
        includeAISummary: true,
      });

      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/db21c2cf-b379-416a-8679-3c252c39767b',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'preferences-client.tsx:175',message:'loadJobMatches result',data:{success:result.success,error:result.error,hasMatches:!!result.matches,matchesCount:result.matches?.length,hasProfile:!!result.profile},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
      // #endregion

      if (!result.success) {
        console.error("Failed to load job matches:", result.error);
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/db21c2cf-b379-416a-8679-3c252c39767b',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'preferences-client.tsx:176',message:'loadJobMatches failed',data:{error:result.error},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'F'})}).catch(()=>{});
        // #endregion
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

    const completedSteps = steps.reduce((count, step) => {
      switch (step) {
        case "industry":
          return count + (formData.industryPreference ? 1 : 0);
        case "yacht":
          return count + (formData.yachtPrimaryPosition ? 1 : 0);
        case "household":
          return count + (formData.householdPrimaryPosition ? 1 : 0);
        case "couple":
          return count + (formData.isCouple !== null ? 1 : 0);
        default:
          return count;
      }
    }, 0);

    return Math.round((completedSteps / steps.length) * 100);
  };

  if (currentStep === "complete") {
    return (
      <div className="mx-auto min-h-[calc(100vh-200px)] max-w-4xl px-4 py-12">
        <div className="rounded-2xl border border-success-200 bg-success-50 p-8 text-center">
          <div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-full bg-success-100">
            <CheckCircle2 className="size-8 text-success-600" />
          </div>
          <h1 className="mb-2 text-2xl font-bold text-navy-900">Preferences Complete!</h1>
          <p className="mb-6 text-gray-600">
            Your job preferences have been saved. We&apos;ll use these to match you with the perfect
            opportunities.
          </p>
          <div className="flex justify-center gap-4">
            <Button variant="secondary" onClick={() => setCurrentStep("industry")}>
              Edit Preferences
            </Button>
            <Link href="/crew/dashboard">
              <Button>Back to Dashboard</Button>
            </Link>
          </div>
        </div>

        {/* Profile Status Banner - CV Required */}
        {profileStatus && !profileStatus.hasCV && (
          <div className="mt-6 rounded-xl border border-amber-200 bg-amber-50 p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="size-5 text-amber-600 shrink-0 mt-0.5" />
              <div className="flex-1">
                <h3 className="font-semibold text-amber-800">CV Required for Quick Apply</h3>
                <p className="mt-1 text-sm text-amber-700">
                  You need to upload your CV before you can apply to jobs. Click &quot;Upload CV to Apply&quot; on any job card below.
                </p>
                <Link href="/crew/documents" className="mt-3 inline-block">
                  <Button size="sm" variant="secondary">
                    Go to Documents
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* Profile Status Banner - Profile Incomplete */}
        {profileStatus && profileStatus.hasCV && !profileStatus.canQuickApply && profileStatus.completeness < 70 && (
          <div className="mt-6 rounded-xl border border-warning-200 bg-warning-50 p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="size-5 text-warning-600 shrink-0 mt-0.5" />
              <div className="flex-1">
                <h3 className="font-semibold text-warning-800">Complete Your Profile to Quick Apply</h3>
                <p className="mt-1 text-sm text-warning-700">
                  Your profile is {profileStatus.completeness}% complete. You need at least 70% to use Quick Apply.
                </p>
                {profileStatus.missingFields.length > 0 && (
                  <div className="mt-2">
                    <p className="text-xs text-warning-600 font-medium">Missing fields:</p>
                    <div className="mt-1 flex flex-wrap gap-1">
                      {profileStatus.missingFields.map((field) => (
                        <span
                          key={field}
                          className="inline-block rounded bg-warning-100 px-2 py-0.5 text-xs text-warning-700"
                        >
                          {field.replace(/_/g, " ")}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                <Link href="/crew/profile/edit" className="mt-3 inline-block">
                  <Button size="sm" variant="secondary">
                    Complete Profile
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* AI Matched Jobs Section */}
        <div className="mt-8">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div>
                <h2 className="text-xl font-semibold text-navy-900 flex items-center gap-2">
                  <Sparkles className="size-5 text-gold-500" />
                  Your Top Matches
                </h2>
                <p className="text-sm text-gray-600">
                  AI-powered job recommendations based on your complete profile
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={loadMatchedJobs}
                disabled={loadingMatches}
                title="Refresh matches"
              >
                <RefreshCw className={cn("size-4", loadingMatches && "animate-spin")} />
              </Button>
              <Link href="/job-board">
                <Button variant="secondary" size="sm">
                  View All Jobs
                  <ChevronRight className="ml-1 size-4" />
                </Button>
              </Link>
            </div>
          </div>

          {loadingMatches ? (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="relative">
                <Loader2 className="size-10 animate-spin text-gold-500" />
                <Sparkles className="absolute -right-1 -top-1 size-4 text-gold-400 animate-pulse" />
              </div>
              <span className="mt-4 text-gray-600 font-medium">Analyzing your profile...</span>
              <span className="mt-1 text-sm text-gray-500">Finding your perfect matches</span>
            </div>
          ) : matchedJobs.length > 0 ? (
            <div className="space-y-4">
              {matchedJobs.map((match) => (
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
          ) : (
            <div className="rounded-xl border border-gray-200 bg-white p-8 text-center">
              <div className="mx-auto mb-3 flex size-12 items-center justify-center rounded-full bg-gray-100">
                <AlertCircle className="size-6 text-gray-400" />
              </div>
              <h3 className="font-semibold text-navy-800 mb-1">No Matching Jobs Found</h3>
              <p className="text-gray-600 text-sm">
                We couldn&apos;t find jobs matching your preferences right now.
                <br />
                Try adjusting your preferences or check back soon for new opportunities.
              </p>
              <div className="mt-4 flex justify-center gap-3">
                <Button variant="secondary" onClick={() => setCurrentStep("industry")}>
                  Adjust Preferences
                </Button>
                <Link href="/job-board">
                  <Button>Browse All Jobs</Button>
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      {/* Header */}
      <div className="mb-8 border-b border-gray-200 pb-4">
        <Link
          href="/crew/dashboard"
          className="mb-4 inline-flex items-center gap-2 text-sm font-medium text-gold-600 hover:text-gold-700"
        >
          <ChevronLeft className="size-4" />
          Back to dashboard
        </Link>
        <h1 className="flex items-center gap-3 font-serif text-3xl font-semibold text-navy-800">
          <Sparkles className="size-7 text-gold-500" />
          Job Preferences
        </h1>
        <p className="mt-2 text-gray-600">
          Tell us what you&apos;re looking for so we can match you with the right opportunities
        </p>
      </div>

      {/* Progress bar */}
      <div className="mb-8">
        <div className="mb-2 flex items-center justify-between text-sm">
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
      <div className="flex gap-6">
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
        <div className="flex-1">
          {/* Mobile Horizontal Stepper */}
          <div className="mb-6 block md:hidden">
            <StepNavigator
              steps={steps}
              currentStep={currentStep}
              formData={formData}
              onStepClick={handleStepClick}
              variant="horizontal"
            />
          </div>

          {/* Save status indicator */}
          <div className="mb-4 flex items-center justify-end gap-2 text-sm">
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
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
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
