"use client";

import { CheckCircle } from "lucide-react";

type FunnelStep = "requirements" | "contact" | "preview";

interface FunnelStepIndicatorProps {
  currentStep: FunnelStep;
}

const STEPS = [
  { id: "requirements" as const, label: "Requirements" },
  { id: "contact" as const, label: "Contact Details" },
];

export function FunnelStepIndicator({ currentStep }: FunnelStepIndicatorProps) {
  const getStepStatus = (stepId: FunnelStep) => {
    const stepOrder: FunnelStep[] = ["requirements", "contact", "preview"];
    const currentIndex = stepOrder.indexOf(currentStep);
    const stepIndex = stepOrder.indexOf(stepId);

    if (stepIndex < currentIndex) return "completed";
    if (stepIndex === currentIndex) return "current";
    return "upcoming";
  };

  // Don't show indicator on preview step (it's a result, not a step)
  if (currentStep === "preview") {
    return null;
  }

  return (
    <div className="mb-8">
      {/* Desktop: Horizontal */}
      <div className="hidden sm:flex items-center justify-center">
        {STEPS.map((step, index) => {
          const status = getStepStatus(step.id);
          return (
            <div key={step.id} className="flex items-center">
              {/* Step Circle + Label */}
              <div className="flex items-center gap-2">
                <div
                  className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold transition-colors ${
                    status === "completed"
                      ? "bg-gold-500 text-white"
                      : status === "current"
                        ? "bg-gold-500 text-white ring-4 ring-gold-100"
                        : "bg-gray-200 text-gray-500"
                  }`}
                >
                  {status === "completed" ? (
                    <CheckCircle className="h-5 w-5" />
                  ) : (
                    index + 1
                  )}
                </div>
                <span
                  className={`text-sm font-medium ${
                    status === "completed" || status === "current"
                      ? "text-navy-900"
                      : "text-gray-500"
                  }`}
                >
                  {step.label}
                </span>
              </div>

              {/* Connector Line */}
              {index < STEPS.length - 1 && (
                <div
                  className={`mx-4 h-0.5 w-16 ${
                    getStepStatus(STEPS[index + 1].id) !== "upcoming"
                      ? "bg-gold-500"
                      : "bg-gray-200"
                  }`}
                />
              )}
            </div>
          );
        })}
      </div>

      {/* Mobile: Compact */}
      <div className="sm:hidden flex items-center justify-center gap-2">
        <span className="text-sm font-medium text-navy-900">
          Step {currentStep === "requirements" ? 1 : 2} of 2
        </span>
        <span className="text-gray-400">•</span>
        <span className="text-sm text-gray-600">
          {currentStep === "requirements" ? "Requirements" : "Contact Details"}
        </span>
      </div>

      {/* Progress Bar (Mobile) */}
      <div className="sm:hidden mt-3">
        <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-gold-500 transition-all duration-300"
            style={{
              width: currentStep === "requirements" ? "50%" : "100%",
            }}
          />
        </div>
      </div>
    </div>
  );
}
