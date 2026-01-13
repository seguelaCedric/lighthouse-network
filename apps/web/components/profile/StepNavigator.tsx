"use client";

import * as React from "react";
import { User, Briefcase, Award, Heart, CheckCircle2, Circle } from "lucide-react";
import { cn } from "@/lib/utils";
import { type ProfileStep, type CandidateType } from "./constants";

interface ProfileFormData {
  // Personal Information
  firstName?: string;
  lastName?: string;
  dateOfBirth?: string;
  gender?: string;
  nationality?: string;
  secondNationality?: string;
  phone?: string;
  whatsapp?: string;
  email?: string;
  currentLocation?: string;

  // Professional Details
  primaryPosition?: string;
  secondaryPositions?: string[];
  highestLicense?: string;
  secondaryLicense?: string;
  yachtTypesWorked?: string[];
  candidateType?: CandidateType;
  otherRoleDetails?: string;

  // Certifications & Visas
  hasSTCW?: boolean;
  stcwExpiryDate?: string;
  hasENG1?: boolean;
  eng1ExpiryDate?: string;
  hasSchengen?: boolean;
  hasB1B2?: boolean;
  certifications?: Array<{
    type: string;
    expiryDate?: string;
  }>;

  // Personal Details
  smoker?: boolean | null;
  hasTattoos?: boolean | null;
  maritalStatus?: string;
  isCouple?: boolean | null;
  partnerName?: string;
  partnerPosition?: string;
}

interface StepNavigatorProps {
  steps: ProfileStep[];
  currentStep: ProfileStep;
  formData: ProfileFormData;
  onStepClick: (step: ProfileStep) => void;
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
  const generateStepSummary = (step: ProfileStep): StepSummary | null => {
    switch (step) {
      case "personal":
        if (!formData.firstName && !formData.lastName) return null;
        const name = [formData.firstName, formData.lastName].filter(Boolean).join(" ");
        return {
          primary: name || "Personal Info",
          secondary: formData.email || formData.phone,
          icon: User,
          color: "navy",
        };

      case "professional":
        if (!formData.primaryPosition) return null;
        let profSecondary = "";
        if (formData.highestLicense) {
          profSecondary = formData.highestLicense;
        } else if (formData.secondaryPositions && formData.secondaryPositions.length > 0) {
          profSecondary = `+${formData.secondaryPositions.length} secondary`;
        }

        return {
          primary: formData.primaryPosition,
          secondary: profSecondary,
          icon: Briefcase,
          color: "navy",
        };

      case "certifications":
        const certCount = formData.certifications?.length || 0;
        const visaCount =
          (formData.hasSTCW ? 1 : 0) +
          (formData.hasENG1 ? 1 : 0) +
          (formData.hasSchengen ? 1 : 0) +
          (formData.hasB1B2 ? 1 : 0);

        if (certCount === 0 && visaCount === 0) return null;

        if (formData.candidateType && formData.candidateType !== "yacht_crew" && formData.candidateType !== "both") {
          return {
            primary: visaCount > 0 ? `${visaCount} visa${visaCount > 1 ? "s" : ""}` : "Visas",
            secondary: undefined,
            icon: Award,
            color: "gold",
          };
        }

        return {
          primary: certCount > 0 ? `${certCount} certification${certCount > 1 ? "s" : ""}` : "Certifications",
          secondary: visaCount > 0 ? `${visaCount} visa${visaCount > 1 ? "s" : ""}` : undefined,
          icon: Award,
          color: "gold",
        };

      case "details":
        const detailsCount =
          (formData.smoker !== null && formData.smoker !== undefined ? 1 : 0) +
          (formData.hasTattoos !== null && formData.hasTattoos !== undefined ? 1 : 0) +
          (formData.maritalStatus ? 1 : 0) +
          (formData.isCouple !== null && formData.isCouple !== undefined ? 1 : 0);

        if (detailsCount === 0) return null;

        return {
          primary: formData.isCouple ? "Couple placement" : "Individual placement",
          secondary: formData.partnerName ? `with ${formData.partnerName}` : undefined,
          icon: Heart,
          color: formData.isCouple ? "error" : "navy",
        };

      default:
        return null;
    }
  };

  // Check if step is complete
  const isStepComplete = (step: ProfileStep): boolean => {
    switch (step) {
      case "personal":
        return !!(
          formData.firstName &&
          formData.lastName &&
          formData.dateOfBirth &&
          formData.nationality &&
          formData.email &&
          formData.phone
        );
      case "professional":
        if (!formData.primaryPosition || !formData.candidateType) return false;
        if (formData.candidateType === "other") {
          return !!formData.otherRoleDetails;
        }
        return true;
      case "certifications":
        if (formData.candidateType === "household_staff") {
          return formData.hasSchengen !== undefined;
        }
        if (formData.candidateType === "other") {
          return formData.hasSchengen !== undefined && formData.hasB1B2 !== undefined;
        }
        if (formData.candidateType === "yacht_crew" || formData.candidateType === "both") {
          return (
            formData.hasSTCW !== undefined &&
            formData.hasENG1 !== undefined &&
            formData.hasSchengen !== undefined &&
            formData.hasB1B2 !== undefined
          );
        }
        return formData.hasSchengen !== undefined;
      case "details":
        const filledFields =
          (formData.smoker !== null && formData.smoker !== undefined ? 1 : 0) +
          (formData.hasTattoos !== null && formData.hasTattoos !== undefined ? 1 : 0) +
          (formData.maritalStatus ? 1 : 0);
        return filledFields >= 2;
      default:
        return false;
    }
  };

  // Get step title
  const getStepTitle = (step: ProfileStep): string => {
    switch (step) {
      case "personal":
        return "Personal Information";
      case "professional":
        return "Professional Details";
      case "certifications":
        return formData.candidateType === "yacht_crew" || formData.candidateType === "both"
          ? "Certifications & Visas"
          : "Visas";
      case "details":
        return "Personal Details";
      case "complete":
        return "Complete";
      default:
        return "";
    }
  };

  // Get step icon
  const getStepIcon = (step: ProfileStep): React.ElementType => {
    switch (step) {
      case "personal":
        return User;
      case "professional":
        return Briefcase;
      case "certifications":
        return Award;
      case "details":
        return Heart;
      case "complete":
        return CheckCircle2;
      default:
        return Circle;
    }
  };

  // Get step helper text
  const getStepHelper = (step: ProfileStep): string => {
    switch (step) {
      case "personal":
        return "Name, contact & location";
      case "professional":
        return "Role, positions & experience";
      case "certifications":
        return formData.candidateType === "yacht_crew" || formData.candidateType === "both"
          ? "STCW, ENG1 & travel documents"
          : "Travel documents & visas";
      case "details":
        return "Lifestyle & placement preferences";
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
      {} as Record<ProfileStep, StepSummary | null>
    );
  }, [steps, formData]);

  // Memoize completion status
  const stepCompletion = React.useMemo(() => {
    return steps.reduce(
      (acc, step) => {
        acc[step] = isStepComplete(step);
        return acc;
      },
      {} as Record<ProfileStep, boolean>
    );
  }, [steps, formData]);

  if (variant === "horizontal") {
    return (
      <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm overflow-hidden">
        <div className="flex items-center justify-between gap-2 overflow-x-auto pb-2 px-3 -mx-3">
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
                    "flex min-w-[80px] sm:min-w-[100px] flex-col items-center gap-2 rounded-lg p-2 sm:p-3 transition-all flex-shrink-0",
                    isCurrent
                      ? "bg-gold-50 border-2 border-gold-500"
                      : isComplete
                        ? "hover:bg-gray-50 border-2 border-transparent"
                        : "opacity-50 border-2 border-transparent"
                  )}
                  aria-label={`${getStepTitle(step)}, ${
                    isComplete ? "completed" : isCurrent ? "current" : "not started"
                  }`}
                  aria-current={isCurrent ? "step" : undefined}
                >
                  <div
                    className={cn(
                      "flex size-8 sm:size-10 items-center justify-center rounded-full transition-colors",
                      isCurrent
                        ? "bg-gold-500"
                        : isComplete
                          ? "bg-success-500"
                          : "bg-gray-200"
                    )}
                  >
                    {isComplete && !isCurrent ? (
                      <CheckCircle2 className="size-4 sm:size-5 text-white" />
                    ) : (
                      <StepIcon
                        className={cn(
                          "size-4 sm:size-5",
                          isCurrent || isComplete ? "text-white" : "text-gray-400"
                        )}
                      />
                    )}
                  </div>
                  <div className="text-center">
                    <div
                      className={cn(
                        "text-[10px] sm:text-xs font-medium whitespace-nowrap",
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
                      "h-0.5 w-6 sm:w-8 flex-shrink-0",
                      stepCompletion[steps[index + 1]] ? "bg-success-300" : "bg-gray-200"
                    )}
                  />
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>
    );
  }

  // Sidebar variant (default)
  return (
    <nav
      aria-label="Profile edit steps"
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
                className={cn(
                  "w-full rounded-lg p-3 text-left transition-all",
                  isCurrent && "border-l-3 border-gold-500 bg-gold-50 pl-3",
                  !isCurrent && "hover:bg-gray-50"
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
