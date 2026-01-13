"use client";

import * as React from "react";
import { Ship, Home, Sparkles, Users, User, CheckCircle2, Circle, Briefcase } from "lucide-react";
import { cn } from "@/lib/utils";
import { type JobPreferencesData } from "@/app/crew/preferences/actions";
import { yachtPositionLabels, householdPositionLabels, regionLabels } from "./constants";

type Step = "industry" | "yacht" | "household" | "couple" | "complete";

interface StepNavigatorProps {
  steps: Step[];
  currentStep: Step;
  formData: JobPreferencesData;
  onStepClick: (step: Step) => void;
  variant?: "sidebar" | "horizontal";
}

interface StepSummary {
  primary: string;
  secondary?: string;
  icon: React.ElementType;
  color: "navy" | "gold" | "success" | "error";
}

export function StepNavigator({
  steps,
  currentStep,
  formData,
  onStepClick,
  variant = "sidebar",
}: StepNavigatorProps) {
  // Generate step summary
  const generateStepSummary = (step: Step): StepSummary | null => {
    switch (step) {
      case "industry":
        if (!formData.industryPreference) return null;
        return {
          primary:
            formData.industryPreference === "yacht"
              ? "Yacht Crew"
              : formData.industryPreference === "household"
                ? "Private Household"
                : "Open to Both",
          icon:
            formData.industryPreference === "yacht"
              ? Ship
              : formData.industryPreference === "household"
                ? Home
                : Sparkles,
          color:
            formData.industryPreference === "yacht"
              ? "navy"
              : formData.industryPreference === "household"
                ? "gold"
                : "success",
        };

      case "yacht":
        if (!formData.yachtPrimaryPosition) return null;
        const yachtPosition =
          yachtPositionLabels[formData.yachtPrimaryPosition] || formData.yachtPrimaryPosition;

        let yachtSecondary = "";
        if (formData.yachtSizeMin || formData.yachtSizeMax) {
          yachtSecondary =
            formData.yachtSizeMin && formData.yachtSizeMax
              ? `${formData.yachtSizeMin}-${formData.yachtSizeMax}m`
              : formData.yachtSizeMin
                ? `${formData.yachtSizeMin}m+`
                : `Up to ${formData.yachtSizeMax}m`;
        } else if (formData.regions.length > 0) {
          const regionNames = formData.regions
            .slice(0, 2)
            .map((r) => regionLabels[r] || r);
          yachtSecondary = regionNames.join(", ");
          if (formData.regions.length > 2) yachtSecondary += ` +${formData.regions.length - 2}`;
        } else if (formData.contractTypes.length > 0) {
          yachtSecondary = formData.contractTypes.slice(0, 2).join(", ");
        }

        return {
          primary: yachtPosition,
          secondary: yachtSecondary,
          icon: Ship,
          color: "navy",
        };

      case "household":
        if (!formData.householdPrimaryPosition) return null;
        const householdPosition =
          householdPositionLabels[formData.householdPrimaryPosition] ||
          formData.householdPrimaryPosition;

        let householdSecondary = "";
        if (formData.livingArrangement) {
          householdSecondary =
            formData.livingArrangement === "live_in"
              ? "Live-in"
              : formData.livingArrangement === "live_out"
                ? "Live-out"
                : "Flexible";
        } else if (formData.householdLocations.length > 0) {
          householdSecondary = `${formData.householdLocations.length} location${formData.householdLocations.length > 1 ? "s" : ""}`;
        }

        return {
          primary: householdPosition,
          secondary: householdSecondary,
          icon: Home,
          color: "gold",
        };

      case "couple":
        const isCouple = formData.isCouple;
        return {
          primary: isCouple ? "Couple placement" : "Individual placement",
          secondary: isCouple && formData.partnerName ? `with ${formData.partnerName}` : undefined,
          icon: isCouple ? Users : User,
          color: isCouple ? "error" : "navy",
        };

      default:
        return null;
    }
  };

  // Check if step is complete
  const isStepComplete = (step: Step): boolean => {
    switch (step) {
      case "industry":
        return !!formData.industryPreference;
      case "yacht":
        return !!formData.yachtPrimaryPosition;
      case "household":
        return !!formData.householdPrimaryPosition;
      case "couple":
        return formData.isCouple !== null;
      default:
        return false;
    }
  };

  // Get step title
  const getStepTitle = (step: Step): string => {
    switch (step) {
      case "industry":
        return "Industry Selection";
      case "yacht":
        return "Yacht Preferences";
      case "household":
        return "Household Preferences";
      case "couple":
        return "Couple Placement";
      default:
        return "";
    }
  };

  // Get step icon
  const getStepIcon = (step: Step): React.ElementType => {
    switch (step) {
      case "industry":
        return Briefcase;
      case "yacht":
        return Ship;
      case "household":
        return Home;
      case "couple":
        return Users;
      default:
        return Circle;
    }
  };

  // Get step helper text
  const getStepHelper = (step: Step): string => {
    switch (step) {
      case "industry":
        return "Choose your career path";
      case "yacht":
        return "Position, size & contract preferences";
      case "household":
        return "Role, location & living arrangement";
      case "couple":
        return "Partner placement information";
      case "complete":
        return "Review & submit";
      default:
        return "";
    }
  };

  // Memoize summaries
  const stepSummaries = React.useMemo(() => {
    return steps.reduce(
      (acc, step) => {
        acc[step] = generateStepSummary(step);
        return acc;
      },
      {} as Record<Step, StepSummary | null>
    );
  }, [steps, formData]);

  // Memoize completion status
  const stepCompletion = React.useMemo(() => {
    return steps.reduce(
      (acc, step) => {
        acc[step] = isStepComplete(step);
        return acc;
      },
      {} as Record<Step, boolean>
    );
  }, [steps, formData]);

  if (variant === "horizontal") {
    return (
      <div className="rounded-lg border border-gray-200 bg-white p-3 shadow-sm sm:p-4">
        <div className="flex items-center justify-center gap-2 overflow-x-auto px-2 pt-1 pb-1 sm:gap-4 sm:px-3 sm:pt-2">
          {steps.map((step, index) => {
            const isCurrent = step === currentStep;
            const isComplete = stepCompletion[step];
            const summary = stepSummaries[step];
            const StepIcon = summary?.icon || getStepIcon(step);

            return (
              <React.Fragment key={step}>
                <button
                  onClick={() => onStepClick(step)}
                  className={cn(
                    "flex flex-shrink-0 flex-col items-center gap-1.5 rounded-lg p-2.5 transition-all sm:gap-2 sm:p-3",
                    isCurrent
                      ? "bg-gold-50 ring-2 ring-gold-500"
                      : isComplete
                        ? "hover:bg-gray-50"
                        : "opacity-50"
                  )}
                  aria-label={`${getStepTitle(step)}, ${
                    isComplete ? "completed" : isCurrent ? "current" : "not started"
                  }`}
                  aria-current={isCurrent ? "step" : undefined}
                >
                  <div
                    className={cn(
                      "flex size-9 items-center justify-center rounded-full sm:size-10",
                      isCurrent
                        ? "bg-gold-500"
                        : isComplete
                          ? "bg-success-500"
                          : "bg-gray-200"
                    )}
                  >
                    {isComplete && !isCurrent ? (
                      <CheckCircle2 className="size-4.5 text-white sm:size-5" />
                    ) : (
                      <StepIcon
                        className={cn(
                          "size-4.5 sm:size-5",
                          isCurrent || isComplete ? "text-white" : "text-gray-400"
                        )}
                      />
                    )}
                  </div>
                  <div className="text-center">
                    <div
                      className={cn(
                        "text-[11px] font-medium leading-tight sm:text-xs",
                        isCurrent ? "text-gold-900" : "text-gray-600"
                      )}
                    >
                      {index + 1}. {getStepTitle(step).split(" ")[0]}
                    </div>
                  </div>
                </button>
                {index < steps.length - 1 && (
                  <div
                    className={cn(
                      "hidden h-0.5 w-6 flex-shrink-0 sm:block sm:w-8",
                      stepCompletion[steps[index + 1]] ? "bg-success-300" : "bg-gray-200"
                    )}
                  />
                )}
              </React.Fragment>
            );
          })}
        </div>
        {/* Show current step summary below */}
        {stepSummaries[currentStep] && (
          <div className="mt-2 border-t border-gray-100 pt-2 sm:mt-3 sm:pt-3">
            <div className="text-xs font-medium text-gray-900 sm:text-sm">
              {stepSummaries[currentStep]?.primary}
            </div>
            {stepSummaries[currentStep]?.secondary && (
              <div className="text-[10px] text-gray-500 sm:text-xs">{stepSummaries[currentStep]?.secondary}</div>
            )}
          </div>
        )}
      </div>
    );
  }

  // Sidebar variant (default)
  return (
    <nav
      aria-label="Job preferences steps"
      className="sticky top-8 rounded-xl border border-gray-200 bg-white p-5 shadow-sm"
    >
      <h3 className="mb-4 text-sm font-semibold text-gray-900">Your Progress</h3>
      <ol className="space-y-2">
        {steps.map((step) => {
          const isCurrent = step === currentStep;
          const isComplete = stepCompletion[step];
          const summary = stepSummaries[step];
          const StepIcon = summary?.icon || getStepIcon(step);

          return (
            <li key={step}>
              <button
                onClick={() => onStepClick(step)}
                disabled={!isComplete && !isCurrent}
                className={cn(
                  "w-full rounded-lg p-3 text-left transition-all",
                  isCurrent && "border-l-3 border-gold-500 bg-gold-50 pl-3",
                  isComplete && !isCurrent && "hover:bg-gray-50",
                  !isComplete && !isCurrent && "cursor-default opacity-60"
                )}
                aria-label={`${getStepTitle(step)} step, ${
                  isComplete ? "completed" : isCurrent ? "current" : "not started"
                }`}
                aria-current={isCurrent ? "step" : undefined}
              >
                <div className="flex items-start gap-3">
                  {/* Icon */}
                  <div
                    className={cn(
                      "flex size-8 shrink-0 items-center justify-center rounded-full",
                      isCurrent && "bg-gold-500",
                      isComplete && !isCurrent && "bg-success-100",
                      !isComplete && !isCurrent && "bg-gray-100"
                    )}
                  >
                    {isComplete && !isCurrent ? (
                      <CheckCircle2 className="size-4 text-success-600" />
                    ) : (
                      <StepIcon
                        className={cn(
                          "size-4",
                          isCurrent && "text-white",
                          isComplete && !isCurrent && summary?.color === "navy" && "text-navy-600",
                          isComplete && !isCurrent && summary?.color === "gold" && "text-gold-600",
                          isComplete &&
                            !isCurrent &&
                            summary?.color === "success" &&
                            "text-success-600",
                          isComplete && !isCurrent && summary?.color === "error" && "text-error-500",
                          !isComplete && !isCurrent && "text-gray-400"
                        )}
                      />
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div
                      className={cn(
                        "text-sm font-semibold",
                        isCurrent && "text-navy-900",
                        isComplete && !isCurrent && "text-navy-800",
                        !isComplete && !isCurrent && "text-gray-500"
                      )}
                    >
                      {getStepTitle(step)}
                    </div>
                    <div
                      className={cn(
                        "text-xs mt-0.5",
                        isCurrent && "text-navy-600",
                        !isCurrent && "text-gray-400"
                      )}
                    >
                      {getStepHelper(step)}
                    </div>
                  </div>
                </div>
              </button>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
