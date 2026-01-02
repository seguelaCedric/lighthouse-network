"use client";

import * as React from "react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  Ship,
  Home,
  Loader2,
  CheckCircle2,
  Users,
  Calendar,
  MapPin,
  Briefcase,
  FileText,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// Position options
const YACHT_POSITIONS = [
  "Captain",
  "Chief Officer",
  "Second Officer",
  "Third Officer",
  "Bosun",
  "Deckhand",
  "Chief Engineer",
  "Second Engineer",
  "Third Engineer",
  "ETO",
  "Chief Stewardess",
  "Second Stewardess",
  "Third Stewardess",
  "Junior Stewardess",
  "Head Chef",
  "Sous Chef",
  "Crew Chef",
  "Purser",
  "Villa Manager",
  "Nanny",
  "Security",
] as const;

const HOUSEHOLD_POSITIONS = [
  "Estate Manager",
  "House Manager",
  "Butler",
  "Housekeeper",
  "Head Housekeeper",
  "Private Chef",
  "Personal Chef",
  "Sous Chef",
  "Nanny",
  "Governess",
  "Tutor",
  "Personal Assistant",
  "Driver",
  "Chauffeur",
  "Security",
  "Groundskeeper",
  "Gardener",
  "Laundress",
  "Caretaker",
] as const;

const VESSEL_TYPES = [
  "Motor Yacht",
  "Sailing Yacht",
  "Explorer Yacht",
  "Catamaran",
  "Sport Fishing",
  "Classic/Vintage",
  "Charter Yacht",
  "Private Yacht",
] as const;

const PROPERTY_TYPES = [
  "Private Residence",
  "Estate",
  "Villa",
  "Penthouse",
  "Townhouse",
  "Ski Chalet",
  "Beach House",
  "Multiple Properties",
] as const;

const TIMELINE_OPTIONS = [
  { value: "immediate", label: "Immediately", description: "Within 1-2 weeks" },
  { value: "1_month", label: "Within 1 month", description: "Flexible on exact start date" },
  { value: "3_months", label: "1-3 months", description: "Planning ahead" },
  { value: "exploring", label: "Just exploring", description: "Building a talent pipeline" },
] as const;

interface FormData {
  // Step 1: Type
  hiring_for: "yacht" | "household" | "both" | "";
  // Step 2: Details
  title: string;
  vessel_name: string;
  vessel_type: string;
  vessel_size: string;
  property_type: string;
  property_location: string;
  // Step 3: Positions
  positions_needed: string[];
  // Step 4: Requirements
  experience_years: string;
  certifications: string[];
  languages: string[];
  additional_requirements: string;
  // Step 5: Timeline
  timeline: string;
  start_date: string;
  contract_type: "permanent" | "rotational" | "seasonal" | "temporary" | "";
  notes: string;
}

export default function NewBriefPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState<FormData>({
    hiring_for: "",
    title: "",
    vessel_name: "",
    vessel_type: "",
    vessel_size: "",
    property_type: "",
    property_location: "",
    positions_needed: [],
    experience_years: "",
    certifications: [],
    languages: [],
    additional_requirements: "",
    timeline: "",
    start_date: "",
    contract_type: "",
    notes: "",
  });

  const updateFormData = (updates: Partial<FormData>) => {
    setFormData((prev) => ({ ...prev, ...updates }));
  };

  const togglePosition = (position: string) => {
    setFormData((prev) => ({
      ...prev,
      positions_needed: prev.positions_needed.includes(position)
        ? prev.positions_needed.filter((p) => p !== position)
        : [...prev.positions_needed, position],
    }));
  };

  const handleSubmit = async () => {
    setError(null);
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/employer/briefs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        router.push(`/employer/portal/briefs/${data.brief.id}?success=true`);
      } else {
        setError(data.error || "Something went wrong. Please try again.");
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const canProceed = () => {
    switch (step) {
      case 0:
        return !!formData.hiring_for;
      case 1:
        if (formData.hiring_for === "yacht") {
          return !!formData.vessel_name && !!formData.vessel_type;
        }
        if (formData.hiring_for === "household") {
          return !!formData.property_type && !!formData.property_location;
        }
        return true;
      case 2:
        return formData.positions_needed.length > 0;
      case 3:
        return true; // Optional step
      case 4:
        return !!formData.timeline;
      default:
        return true;
    }
  };

  const steps = [
    { title: "Type", icon: Briefcase },
    { title: "Details", icon: formData.hiring_for === "yacht" ? Ship : Home },
    { title: "Positions", icon: Users },
    { title: "Requirements", icon: FileText },
    { title: "Timeline", icon: Calendar },
  ];

  return (
    <div className="min-h-full bg-gray-50">
      {/* Header */}
      <div className="border-b border-gray-200 bg-white">
        <div className="mx-auto max-w-3xl px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <Link
              href="/employer/portal/briefs"
              className="flex items-center gap-2 text-gray-500 hover:text-navy-900"
            >
              <ArrowLeft className="size-4" />
              <span className="hidden sm:inline">Back to Briefs</span>
            </Link>
            <div className="text-sm text-gray-500">
              Step {step + 1} of {steps.length}
            </div>
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="border-b border-gray-200 bg-white">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2 py-4 sm:gap-4">
            {steps.map((s, index) => {
              const Icon = s.icon;
              const isActive = index === step;
              const isComplete = index < step;

              return (
                <React.Fragment key={s.title}>
                  {index > 0 && (
                    <div
                      className={cn(
                        "h-0.5 flex-1",
                        isComplete ? "bg-gold-500" : "bg-gray-200"
                      )}
                    />
                  )}
                  <div className="flex flex-col items-center gap-1">
                    <div
                      className={cn(
                        "flex size-8 items-center justify-center rounded-full sm:size-10",
                        isActive
                          ? "bg-gold-500 text-white"
                          : isComplete
                            ? "bg-gold-100 text-gold-600"
                            : "bg-gray-100 text-gray-400"
                      )}
                    >
                      {isComplete ? (
                        <CheckCircle2 className="size-4 sm:size-5" />
                      ) : (
                        <Icon className="size-4 sm:size-5" />
                      )}
                    </div>
                    <span
                      className={cn(
                        "hidden text-xs sm:block",
                        isActive
                          ? "font-medium text-navy-900"
                          : "text-gray-500"
                      )}
                    >
                      {s.title}
                    </span>
                  </div>
                </React.Fragment>
              );
            })}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8">
          {/* Step 0: Type */}
          {step === 0 && (
            <div>
              <h2 className="font-serif text-xl font-semibold text-navy-900">
                What are you hiring for?
              </h2>
              <p className="mt-2 text-gray-500">
                Tell us the type of position you're looking to fill.
              </p>

              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                <button
                  onClick={() => updateFormData({ hiring_for: "yacht", property_type: "", property_location: "" })}
                  className={cn(
                    "flex flex-col items-center gap-3 rounded-xl border-2 p-6 transition-all",
                    formData.hiring_for === "yacht"
                      ? "border-gold-500 bg-gold-50"
                      : "border-gray-200 hover:border-gold-200 hover:bg-gray-50"
                  )}
                >
                  <Ship className={cn("size-10", formData.hiring_for === "yacht" ? "text-gold-600" : "text-gray-400")} />
                  <div className="text-center">
                    <h3 className="font-medium text-navy-900">Yacht Crew</h3>
                    <p className="mt-1 text-sm text-gray-500">
                      Captains, engineers, stewardesses & more
                    </p>
                  </div>
                </button>

                <button
                  onClick={() => updateFormData({ hiring_for: "household", vessel_name: "", vessel_type: "", vessel_size: "" })}
                  className={cn(
                    "flex flex-col items-center gap-3 rounded-xl border-2 p-6 transition-all",
                    formData.hiring_for === "household"
                      ? "border-gold-500 bg-gold-50"
                      : "border-gray-200 hover:border-gold-200 hover:bg-gray-50"
                  )}
                >
                  <Home className={cn("size-10", formData.hiring_for === "household" ? "text-gold-600" : "text-gray-400")} />
                  <div className="text-center">
                    <h3 className="font-medium text-navy-900">Private Staff</h3>
                    <p className="mt-1 text-sm text-gray-500">
                      Housekeepers, chefs, estate managers & more
                    </p>
                  </div>
                </button>
              </div>

              <button
                onClick={() => updateFormData({ hiring_for: "both" })}
                className={cn(
                  "mt-4 w-full rounded-xl border-2 p-4 text-center transition-all",
                  formData.hiring_for === "both"
                    ? "border-gold-500 bg-gold-50"
                    : "border-gray-200 hover:border-gold-200 hover:bg-gray-50"
                )}
              >
                <span className="font-medium text-navy-900">I need both yacht crew and private staff</span>
              </button>
            </div>
          )}

          {/* Step 1: Details */}
          {step === 1 && (
            <div>
              <h2 className="font-serif text-xl font-semibold text-navy-900">
                Tell us about your {formData.hiring_for === "yacht" ? "vessel" : formData.hiring_for === "household" ? "property" : "requirements"}
              </h2>
              <p className="mt-2 text-gray-500">
                This helps us match you with experienced candidates.
              </p>

              <div className="mt-6 space-y-6">
                {/* Brief Title */}
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700">
                    Brief Title <span className="text-gray-400">(optional)</span>
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => updateFormData({ title: e.target.value })}
                    placeholder="e.g., Chief Stew for Med Season 2025"
                    className="h-11 w-full rounded-lg border border-gray-300 px-4 focus:border-gold-500 focus:outline-none focus:ring-2 focus:ring-gold-500/20"
                  />
                </div>

                {/* Yacht Details */}
                {(formData.hiring_for === "yacht" || formData.hiring_for === "both") && (
                  <>
                    <div>
                      <label className="mb-1.5 block text-sm font-medium text-gray-700">
                        Vessel Name
                      </label>
                      <input
                        type="text"
                        value={formData.vessel_name}
                        onChange={(e) => updateFormData({ vessel_name: e.target.value })}
                        placeholder="M/Y Example"
                        className="h-11 w-full rounded-lg border border-gray-300 px-4 focus:border-gold-500 focus:outline-none focus:ring-2 focus:ring-gold-500/20"
                      />
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <label className="mb-1.5 block text-sm font-medium text-gray-700">
                          Vessel Type
                        </label>
                        <select
                          value={formData.vessel_type}
                          onChange={(e) => updateFormData({ vessel_type: e.target.value })}
                          className="h-11 w-full rounded-lg border border-gray-300 px-4 focus:border-gold-500 focus:outline-none focus:ring-2 focus:ring-gold-500/20"
                        >
                          <option value="">Select type...</option>
                          {VESSEL_TYPES.map((type) => (
                            <option key={type} value={type}>{type}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="mb-1.5 block text-sm font-medium text-gray-700">
                          Vessel Size (meters)
                        </label>
                        <input
                          type="number"
                          value={formData.vessel_size}
                          onChange={(e) => updateFormData({ vessel_size: e.target.value })}
                          placeholder="e.g., 55"
                          className="h-11 w-full rounded-lg border border-gray-300 px-4 focus:border-gold-500 focus:outline-none focus:ring-2 focus:ring-gold-500/20"
                        />
                      </div>
                    </div>
                  </>
                )}

                {/* Household Details */}
                {(formData.hiring_for === "household" || formData.hiring_for === "both") && (
                  <>
                    <div>
                      <label className="mb-1.5 block text-sm font-medium text-gray-700">
                        Property Type
                      </label>
                      <select
                        value={formData.property_type}
                        onChange={(e) => updateFormData({ property_type: e.target.value })}
                        className="h-11 w-full rounded-lg border border-gray-300 px-4 focus:border-gold-500 focus:outline-none focus:ring-2 focus:ring-gold-500/20"
                      >
                        <option value="">Select type...</option>
                        {PROPERTY_TYPES.map((type) => (
                          <option key={type} value={type}>{type}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="mb-1.5 block text-sm font-medium text-gray-700">
                        Property Location
                      </label>
                      <input
                        type="text"
                        value={formData.property_location}
                        onChange={(e) => updateFormData({ property_location: e.target.value })}
                        placeholder="e.g., London, UK"
                        className="h-11 w-full rounded-lg border border-gray-300 px-4 focus:border-gold-500 focus:outline-none focus:ring-2 focus:ring-gold-500/20"
                      />
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          {/* Step 2: Positions */}
          {step === 2 && (
            <div>
              <h2 className="font-serif text-xl font-semibold text-navy-900">
                What positions are you hiring for?
              </h2>
              <p className="mt-2 text-gray-500">
                Select all positions you need to fill. You can select multiple.
              </p>

              <div className="mt-6 space-y-6">
                {/* Yacht Positions */}
                {(formData.hiring_for === "yacht" || formData.hiring_for === "both") && (
                  <div>
                    <h3 className="mb-3 flex items-center gap-2 text-sm font-medium text-navy-900">
                      <Ship className="size-4" />
                      Yacht Positions
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {YACHT_POSITIONS.map((position) => (
                        <button
                          key={position}
                          onClick={() => togglePosition(position)}
                          className={cn(
                            "rounded-full border px-4 py-2 text-sm transition-all",
                            formData.positions_needed.includes(position)
                              ? "border-gold-500 bg-gold-50 text-gold-700"
                              : "border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50"
                          )}
                        >
                          {position}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Household Positions */}
                {(formData.hiring_for === "household" || formData.hiring_for === "both") && (
                  <div>
                    <h3 className="mb-3 flex items-center gap-2 text-sm font-medium text-navy-900">
                      <Home className="size-4" />
                      Private Staff Positions
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {HOUSEHOLD_POSITIONS.map((position) => (
                        <button
                          key={position}
                          onClick={() => togglePosition(position)}
                          className={cn(
                            "rounded-full border px-4 py-2 text-sm transition-all",
                            formData.positions_needed.includes(position)
                              ? "border-gold-500 bg-gold-50 text-gold-700"
                              : "border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50"
                          )}
                        >
                          {position}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Selected Summary */}
                {formData.positions_needed.length > 0 && (
                  <div className="rounded-lg bg-navy-50 p-4">
                    <p className="text-sm text-navy-700">
                      <span className="font-medium">{formData.positions_needed.length}</span> position(s) selected:{" "}
                      {formData.positions_needed.join(", ")}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Step 3: Requirements */}
          {step === 3 && (
            <div>
              <h2 className="font-serif text-xl font-semibold text-navy-900">
                Any specific requirements?
              </h2>
              <p className="mt-2 text-gray-500">
                Help us find the best match. All fields are optional.
              </p>

              <div className="mt-6 space-y-6">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700">
                    Minimum Years of Experience
                  </label>
                  <select
                    value={formData.experience_years}
                    onChange={(e) => updateFormData({ experience_years: e.target.value })}
                    className="h-11 w-full rounded-lg border border-gray-300 px-4 focus:border-gold-500 focus:outline-none focus:ring-2 focus:ring-gold-500/20"
                  >
                    <option value="">No minimum</option>
                    <option value="1">1+ years</option>
                    <option value="2">2+ years</option>
                    <option value="3">3+ years</option>
                    <option value="5">5+ years</option>
                    <option value="10">10+ years</option>
                  </select>
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700">
                    Additional Requirements
                  </label>
                  <textarea
                    value={formData.additional_requirements}
                    onChange={(e) => updateFormData({ additional_requirements: e.target.value })}
                    rows={4}
                    placeholder="e.g., Must have STCW certifications, experience with charter guests, fluent in French..."
                    className="w-full rounded-lg border border-gray-300 p-4 focus:border-gold-500 focus:outline-none focus:ring-2 focus:ring-gold-500/20"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 4: Timeline */}
          {step === 4 && (
            <div>
              <h2 className="font-serif text-xl font-semibold text-navy-900">
                When do you need to hire?
              </h2>
              <p className="mt-2 text-gray-500">
                This helps us prioritize your brief appropriately.
              </p>

              <div className="mt-6 space-y-6">
                <div className="space-y-3">
                  {TIMELINE_OPTIONS.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => updateFormData({ timeline: option.value })}
                      className={cn(
                        "flex w-full items-center gap-4 rounded-xl border-2 p-4 text-left transition-all",
                        formData.timeline === option.value
                          ? "border-gold-500 bg-gold-50"
                          : "border-gray-200 hover:border-gold-200 hover:bg-gray-50"
                      )}
                    >
                      <div className={cn(
                        "flex size-10 items-center justify-center rounded-full",
                        formData.timeline === option.value ? "bg-gold-100" : "bg-gray-100"
                      )}>
                        <Calendar className={cn(
                          "size-5",
                          formData.timeline === option.value ? "text-gold-600" : "text-gray-400"
                        )} />
                      </div>
                      <div>
                        <h3 className="font-medium text-navy-900">{option.label}</h3>
                        <p className="text-sm text-gray-500">{option.description}</p>
                      </div>
                    </button>
                  ))}
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700">
                    Contract Type
                  </label>
                  <select
                    value={formData.contract_type}
                    onChange={(e) => updateFormData({ contract_type: e.target.value as FormData["contract_type"] })}
                    className="h-11 w-full rounded-lg border border-gray-300 px-4 focus:border-gold-500 focus:outline-none focus:ring-2 focus:ring-gold-500/20"
                  >
                    <option value="">Select type...</option>
                    <option value="permanent">Permanent</option>
                    <option value="rotational">Rotational</option>
                    <option value="seasonal">Seasonal</option>
                    <option value="temporary">Temporary/Relief</option>
                  </select>
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700">
                    Anything else we should know?
                  </label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => updateFormData({ notes: e.target.value })}
                    rows={3}
                    placeholder="Any additional context about the role or your ideal candidate..."
                    className="w-full rounded-lg border border-gray-300 p-4 focus:border-gold-500 focus:outline-none focus:ring-2 focus:ring-gold-500/20"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="mt-4 rounded-lg bg-error-50 p-4 text-sm text-error-600">
              {error}
            </div>
          )}

          {/* Navigation */}
          <div className="mt-8 flex items-center justify-between border-t border-gray-200 pt-6">
            <Button
              variant="ghost"
              onClick={() => setStep((s) => s - 1)}
              disabled={step === 0}
              className={step === 0 ? "invisible" : ""}
            >
              <ArrowLeft className="mr-2 size-4" />
              Back
            </Button>

            {step < steps.length - 1 ? (
              <Button
                variant="primary"
                onClick={() => setStep((s) => s + 1)}
                disabled={!canProceed()}
              >
                Continue
                <ArrowRight className="ml-2 size-4" />
              </Button>
            ) : (
              <Button
                variant="primary"
                onClick={handleSubmit}
                disabled={!canProceed() || isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 size-4 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    Submit Brief
                    <CheckCircle2 className="ml-2 size-4" />
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
