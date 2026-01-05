"use client";

import * as React from "react";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  Loader2,
  CheckCircle2,
  Ship,
  Home,
  Users,
  Mail,
  Phone,
  User,
  Building2,
  Clock,
  MapPin,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/ui/Logo";
import { cn } from "@/lib/utils";

// Step indicator component
function StepIndicator({ currentStep, totalSteps }: { currentStep: number; totalSteps: number }) {
  return (
    <div className="flex items-center justify-center gap-2">
      {Array.from({ length: totalSteps }).map((_, index) => (
        <div
          key={index}
          className={cn(
            "h-2 rounded-full transition-all",
            index === currentStep
              ? "w-8 bg-gold-500"
              : index < currentStep
                ? "w-2 bg-gold-400"
                : "w-2 bg-gray-200"
          )}
        />
      ))}
    </div>
  );
}

// Yacht positions
const yachtPositions = [
  "Captain",
  "Chief Officer",
  "2nd Officer",
  "Bosun",
  "Deckhand",
  "Chief Engineer",
  "2nd Engineer",
  "ETO",
  "Chief Stewardess",
  "2nd Stewardess",
  "3rd Stewardess",
  "Head Chef",
  "Sous Chef",
  "Crew Chef",
];

// Household positions
const householdPositions = [
  "House Manager",
  "Estate Manager",
  "Butler",
  "Housekeeper",
  "Private Chef",
  "Nanny",
  "Personal Assistant",
  "Chauffeur",
  "Security",
  "Gardener",
  "Laundress",
];

// Form data type
interface FormData {
  // Step 1: Contact
  contactName: string;
  email: string;
  phone: string;
  companyName: string;
  // Step 2: Hiring type
  hiringFor: "yacht" | "household" | "both" | "";
  // Yacht fields
  vesselName: string;
  vesselType: string;
  vesselSize: string;
  // Household fields
  propertyType: string;
  propertyLocation: string;
  // Step 3: Requirements
  positionsNeeded: string[];
  timeline: string;
  additionalNotes: string;
}

export default function EmployerRegisterPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const [formData, setFormData] = useState<FormData>({
    contactName: "",
    email: "",
    phone: "",
    companyName: "",
    hiringFor: "",
    vesselName: "",
    vesselType: "",
    vesselSize: "",
    propertyType: "",
    propertyLocation: "",
    positionsNeeded: [],
    timeline: "",
    additionalNotes: "",
  });

  const updateField = (field: keyof FormData, value: string | string[]) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const togglePosition = (position: string) => {
    setFormData((prev) => ({
      ...prev,
      positionsNeeded: prev.positionsNeeded.includes(position)
        ? prev.positionsNeeded.filter((p) => p !== position)
        : [...prev.positionsNeeded, position],
    }));
  };

  const canProceed = () => {
    switch (step) {
      case 0:
        return formData.contactName && formData.email;
      case 1:
        return formData.hiringFor !== "";
      case 2:
        return formData.positionsNeeded.length > 0;
      default:
        return true;
    }
  };

  const handleSubmit = async () => {
    setError(null);
    setIsLoading(true);

    try {
      const response = await fetch("/api/employer/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contact_name: formData.contactName,
          email: formData.email,
          phone: formData.phone || null,
          company_name: formData.companyName || null,
          hiring_for: formData.hiringFor,
          vessel_name: formData.vesselName || null,
          vessel_type: formData.vesselType || null,
          vessel_size_meters: formData.vesselSize ? parseInt(formData.vesselSize) : null,
          property_type: formData.propertyType || null,
          property_location: formData.propertyLocation || null,
          positions_needed: formData.positionsNeeded,
          timeline: formData.timeline || null,
          additional_notes: formData.additionalNotes || null,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess(true);
      } else {
        setError(data.error || "Something went wrong. Please try again.");
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // Success state
  if (success) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-navy-900 via-navy-800 to-navy-900 px-4">
        <div className="w-full max-w-md">
          {/* Logo */}
          <div className="mb-8 flex justify-center">
            <Link href="/">
              <Logo size="xl" />
            </Link>
          </div>

          {/* Success Card */}
          <div className="rounded-2xl bg-white p-8 shadow-xl">
            <div className="text-center">
              <div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-full bg-success-100">
                <CheckCircle2 className="size-8 text-success-600" />
              </div>
              <h1 className="mb-2 font-serif text-2xl font-semibold text-navy-900">
                Welcome to Lighthouse!
              </h1>
              <p className="mb-6 text-gray-600">
                Your account has been created. Check your email for a magic link to
                access your portal.
              </p>

              <div className="rounded-lg bg-navy-50 p-4 text-left">
                <h3 className="mb-2 font-medium text-navy-900">What happens next?</h3>
                <ol className="space-y-2 text-sm text-navy-700">
                  <li className="flex items-start gap-2">
                    <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-navy-200 text-xs font-semibold">
                      1
                    </span>
                    Check your email for the login link
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-navy-200 text-xs font-semibold">
                      2
                    </span>
                    Access your employer portal
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-navy-200 text-xs font-semibold">
                      3
                    </span>
                    Our team will reach out to discuss your needs
                  </li>
                </ol>
              </div>

              <Button
                variant="primary"
                className="mt-6 w-full"
                onClick={() => router.push("/")}
              >
                Return to Homepage
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto flex h-16 max-w-3xl items-center justify-between px-4">
          <Link href="/">
            <Logo size="md" />
          </Link>

          <Link
            href="/employer/login"
            className="text-sm font-medium text-gray-600 hover:text-navy-800"
          >
            Already registered? Sign in
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-xl px-4 py-12">
        {/* Progress */}
        <div className="mb-8">
          <StepIndicator currentStep={step} totalSteps={4} />
          <p className="mt-4 text-center text-sm text-gray-500">
            Step {step + 1} of 4
          </p>
        </div>

        {/* Form Card */}
        <div className="rounded-2xl bg-white p-8 shadow-lg">
          {/* Step 0: Contact Information */}
          {step === 0 && (
            <div className="space-y-6">
              <div className="text-center">
                <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-full bg-gold-100">
                  <User className="size-7 text-gold-600" />
                </div>
                <h1 className="font-serif text-2xl font-semibold text-navy-900">
                  Tell us about yourself
                </h1>
                <p className="mt-2 text-gray-600">
                  We'll use this to set up your employer account
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700">
                    Full Name *
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 size-5 -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      value={formData.contactName}
                      onChange={(e) => updateField("contactName", e.target.value)}
                      placeholder="John Smith"
                      className="h-12 w-full rounded-lg border border-gray-300 bg-white pl-10 pr-4 text-navy-900 placeholder:text-gray-400 focus:border-gold-500 focus:outline-none focus:ring-2 focus:ring-gold-500/20"
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700">
                    Email Address *
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 size-5 -translate-y-1/2 text-gray-400" />
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => updateField("email", e.target.value)}
                      placeholder="john@company.com"
                      className="h-12 w-full rounded-lg border border-gray-300 bg-white pl-10 pr-4 text-navy-900 placeholder:text-gray-400 focus:border-gold-500 focus:outline-none focus:ring-2 focus:ring-gold-500/20"
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700">
                    Phone Number
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 size-5 -translate-y-1/2 text-gray-400" />
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => updateField("phone", e.target.value)}
                      placeholder="+33 6 12 34 56 78"
                      className="h-12 w-full rounded-lg border border-gray-300 bg-white pl-10 pr-4 text-navy-900 placeholder:text-gray-400 focus:border-gold-500 focus:outline-none focus:ring-2 focus:ring-gold-500/20"
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700">
                    Company / Vessel Name
                  </label>
                  <div className="relative">
                    <Building2 className="absolute left-3 top-1/2 size-5 -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      value={formData.companyName}
                      onChange={(e) => updateField("companyName", e.target.value)}
                      placeholder="M/Y Serenity or Company Name"
                      className="h-12 w-full rounded-lg border border-gray-300 bg-white pl-10 pr-4 text-navy-900 placeholder:text-gray-400 focus:border-gold-500 focus:outline-none focus:ring-2 focus:ring-gold-500/20"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 1: What are you hiring for? */}
          {step === 1 && (
            <div className="space-y-6">
              <div className="text-center">
                <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-full bg-navy-100">
                  <Users className="size-7 text-navy-600" />
                </div>
                <h1 className="font-serif text-2xl font-semibold text-navy-900">
                  What are you hiring for?
                </h1>
                <p className="mt-2 text-gray-600">
                  This helps us show you the right candidates
                </p>
              </div>

              <div className="space-y-3">
                <button
                  type="button"
                  onClick={() => updateField("hiringFor", "yacht")}
                  className={cn(
                    "flex w-full items-start gap-4 rounded-xl border-2 p-4 text-left transition-all",
                    formData.hiringFor === "yacht"
                      ? "border-gold-500 bg-gold-50"
                      : "border-gray-200 hover:border-gray-300"
                  )}
                >
                  <div className={cn(
                    "flex size-12 shrink-0 items-center justify-center rounded-lg",
                    formData.hiringFor === "yacht" ? "bg-gold-100" : "bg-gray-100"
                  )}>
                    <Ship className={cn(
                      "size-6",
                      formData.hiringFor === "yacht" ? "text-gold-600" : "text-gray-500"
                    )} />
                  </div>
                  <div>
                    <h3 className="font-medium text-navy-900">Yacht Crew</h3>
                    <p className="text-sm text-gray-500">
                      Captains, engineers, stewardesses, deckhands & more
                    </p>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => updateField("hiringFor", "household")}
                  className={cn(
                    "flex w-full items-start gap-4 rounded-xl border-2 p-4 text-left transition-all",
                    formData.hiringFor === "household"
                      ? "border-gold-500 bg-gold-50"
                      : "border-gray-200 hover:border-gray-300"
                  )}
                >
                  <div className={cn(
                    "flex size-12 shrink-0 items-center justify-center rounded-lg",
                    formData.hiringFor === "household" ? "bg-gold-100" : "bg-gray-100"
                  )}>
                    <Home className={cn(
                      "size-6",
                      formData.hiringFor === "household" ? "text-gold-600" : "text-gray-500"
                    )} />
                  </div>
                  <div>
                    <h3 className="font-medium text-navy-900">Private Staff</h3>
                    <p className="text-sm text-gray-500">
                      House managers, chefs, butlers, nannies & more
                    </p>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => updateField("hiringFor", "both")}
                  className={cn(
                    "flex w-full items-start gap-4 rounded-xl border-2 p-4 text-left transition-all",
                    formData.hiringFor === "both"
                      ? "border-gold-500 bg-gold-50"
                      : "border-gray-200 hover:border-gray-300"
                  )}
                >
                  <div className={cn(
                    "flex size-12 shrink-0 items-center justify-center rounded-lg",
                    formData.hiringFor === "both" ? "bg-gold-100" : "bg-gray-100"
                  )}>
                    <Users className={cn(
                      "size-6",
                      formData.hiringFor === "both" ? "text-gold-600" : "text-gray-500"
                    )} />
                  </div>
                  <div>
                    <h3 className="font-medium text-navy-900">Both</h3>
                    <p className="text-sm text-gray-500">
                      I need yacht crew and private household staff
                    </p>
                  </div>
                </button>
              </div>

              {/* Conditional fields based on hiring type */}
              {(formData.hiringFor === "yacht" || formData.hiringFor === "both") && (
                <div className="space-y-4 border-t border-gray-100 pt-6">
                  <h3 className="font-medium text-navy-900">Vessel Details</h3>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className="mb-1.5 block text-sm font-medium text-gray-700">
                        Vessel Name
                      </label>
                      <input
                        type="text"
                        value={formData.vesselName}
                        onChange={(e) => updateField("vesselName", e.target.value)}
                        placeholder="M/Y Serenity"
                        className="h-10 w-full rounded-lg border border-gray-300 px-3 text-navy-900 placeholder:text-gray-400 focus:border-gold-500 focus:outline-none focus:ring-2 focus:ring-gold-500/20"
                      />
                    </div>
                    <div>
                      <label className="mb-1.5 block text-sm font-medium text-gray-700">
                        Vessel Type
                      </label>
                      <select
                        value={formData.vesselType}
                        onChange={(e) => updateField("vesselType", e.target.value)}
                        className="h-10 w-full rounded-lg border border-gray-300 px-3 text-navy-900 focus:border-gold-500 focus:outline-none focus:ring-2 focus:ring-gold-500/20"
                      >
                        <option value="">Select type</option>
                        <option value="motor">Motor Yacht</option>
                        <option value="sail">Sailing Yacht</option>
                        <option value="explorer">Explorer</option>
                        <option value="catamaran">Catamaran</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                    <div>
                      <label className="mb-1.5 block text-sm font-medium text-gray-700">
                        Size (meters)
                      </label>
                      <input
                        type="number"
                        value={formData.vesselSize}
                        onChange={(e) => updateField("vesselSize", e.target.value)}
                        placeholder="45"
                        className="h-10 w-full rounded-lg border border-gray-300 px-3 text-navy-900 placeholder:text-gray-400 focus:border-gold-500 focus:outline-none focus:ring-2 focus:ring-gold-500/20"
                      />
                    </div>
                  </div>
                </div>
              )}

              {(formData.hiringFor === "household" || formData.hiringFor === "both") && (
                <div className="space-y-4 border-t border-gray-100 pt-6">
                  <h3 className="font-medium text-navy-900">Property Details</h3>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className="mb-1.5 block text-sm font-medium text-gray-700">
                        Property Type
                      </label>
                      <select
                        value={formData.propertyType}
                        onChange={(e) => updateField("propertyType", e.target.value)}
                        className="h-10 w-full rounded-lg border border-gray-300 px-3 text-navy-900 focus:border-gold-500 focus:outline-none focus:ring-2 focus:ring-gold-500/20"
                      >
                        <option value="">Select type</option>
                        <option value="estate">Estate</option>
                        <option value="villa">Villa</option>
                        <option value="apartment">Apartment</option>
                        <option value="townhouse">Townhouse</option>
                        <option value="chalet">Chalet</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                    <div>
                      <label className="mb-1.5 block text-sm font-medium text-gray-700">
                        Location
                      </label>
                      <div className="relative">
                        <MapPin className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-gray-400" />
                        <input
                          type="text"
                          value={formData.propertyLocation}
                          onChange={(e) => updateField("propertyLocation", e.target.value)}
                          placeholder="Monaco, London, etc."
                          className="h-10 w-full rounded-lg border border-gray-300 pl-9 pr-3 text-navy-900 placeholder:text-gray-400 focus:border-gold-500 focus:outline-none focus:ring-2 focus:ring-gold-500/20"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Step 2: Positions needed */}
          {step === 2 && (
            <div className="space-y-6">
              <div className="text-center">
                <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-full bg-gold-100">
                  <Users className="size-7 text-gold-600" />
                </div>
                <h1 className="font-serif text-2xl font-semibold text-navy-900">
                  What positions do you need?
                </h1>
                <p className="mt-2 text-gray-600">
                  Select all that apply
                </p>
              </div>

              {/* Yacht positions */}
              {(formData.hiringFor === "yacht" || formData.hiringFor === "both") && (
                <div>
                  <h3 className="mb-3 flex items-center gap-2 font-medium text-navy-900">
                    <Ship className="size-4" />
                    Yacht Crew
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {yachtPositions.map((position) => (
                      <button
                        key={position}
                        type="button"
                        onClick={() => togglePosition(position)}
                        className={cn(
                          "rounded-full border px-3 py-1.5 text-sm transition-all",
                          formData.positionsNeeded.includes(position)
                            ? "border-gold-500 bg-gold-50 text-gold-700"
                            : "border-gray-200 text-gray-600 hover:border-gray-300"
                        )}
                      >
                        {position}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Household positions */}
              {(formData.hiringFor === "household" || formData.hiringFor === "both") && (
                <div>
                  <h3 className="mb-3 flex items-center gap-2 font-medium text-navy-900">
                    <Home className="size-4" />
                    Private Staff
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {householdPositions.map((position) => (
                      <button
                        key={position}
                        type="button"
                        onClick={() => togglePosition(position)}
                        className={cn(
                          "rounded-full border px-3 py-1.5 text-sm transition-all",
                          formData.positionsNeeded.includes(position)
                            ? "border-gold-500 bg-gold-50 text-gold-700"
                            : "border-gray-200 text-gray-600 hover:border-gray-300"
                        )}
                      >
                        {position}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {formData.positionsNeeded.length > 0 && (
                <div className="rounded-lg bg-gold-50 p-3">
                  <p className="text-sm text-gold-800">
                    <strong>Selected:</strong> {formData.positionsNeeded.join(", ")}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Step 3: Timeline & Notes */}
          {step === 3 && (
            <div className="space-y-6">
              <div className="text-center">
                <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-full bg-navy-100">
                  <Clock className="size-7 text-navy-600" />
                </div>
                <h1 className="font-serif text-2xl font-semibold text-navy-900">
                  When do you need crew?
                </h1>
                <p className="mt-2 text-gray-600">
                  This helps us prioritize your request
                </p>
              </div>

              <div className="space-y-3">
                {[
                  { value: "immediate", label: "Immediately", desc: "As soon as possible" },
                  { value: "1-2_weeks", label: "1-2 Weeks", desc: "Within the next fortnight" },
                  { value: "1_month", label: "Within a Month", desc: "No immediate rush" },
                  { value: "exploring", label: "Just Exploring", desc: "Building my network" },
                ].map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => updateField("timeline", option.value)}
                    className={cn(
                      "flex w-full items-center justify-between rounded-xl border-2 p-4 text-left transition-all",
                      formData.timeline === option.value
                        ? "border-gold-500 bg-gold-50"
                        : "border-gray-200 hover:border-gray-300"
                    )}
                  >
                    <div>
                      <h3 className="font-medium text-navy-900">{option.label}</h3>
                      <p className="text-sm text-gray-500">{option.desc}</p>
                    </div>
                    <div className={cn(
                      "size-5 rounded-full border-2",
                      formData.timeline === option.value
                        ? "border-gold-500 bg-gold-500"
                        : "border-gray-300"
                    )}>
                      {formData.timeline === option.value && (
                        <CheckCircle2 className="size-full text-white" />
                      )}
                    </div>
                  </button>
                ))}
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">
                  Additional Notes (optional)
                </label>
                <textarea
                  value={formData.additionalNotes}
                  onChange={(e) => updateField("additionalNotes", e.target.value)}
                  placeholder="Tell us more about your requirements..."
                  rows={4}
                  className="w-full rounded-lg border border-gray-300 p-3 text-navy-900 placeholder:text-gray-400 focus:border-gold-500 focus:outline-none focus:ring-2 focus:ring-gold-500/20"
                />
              </div>

              {error && (
                <div className="rounded-lg bg-error-50 p-3 text-sm text-error-700">
                  {error}
                </div>
              )}
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="mt-8 flex items-center justify-between">
            {step > 0 ? (
              <Button
                type="button"
                variant="ghost"
                onClick={() => setStep(step - 1)}
              >
                <ArrowLeft className="mr-2 size-4" />
                Back
              </Button>
            ) : (
              <div />
            )}

            {step < 3 ? (
              <Button
                type="button"
                variant="primary"
                onClick={() => setStep(step + 1)}
                disabled={!canProceed()}
              >
                Continue
                <ArrowRight className="ml-2 size-4" />
              </Button>
            ) : (
              <Button
                type="button"
                variant="primary"
                onClick={handleSubmit}
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 size-4 animate-spin" />
                    Creating Account...
                  </>
                ) : (
                  <>
                    Create Account
                    <ArrowRight className="ml-2 size-4" />
                  </>
                )}
              </Button>
            )}
          </div>
        </div>

        {/* Crew signup link */}
        <p className="mt-6 text-center text-sm text-gray-500">
          Looking for work?{" "}
          <Link
            href="/auth/register"
            className="font-medium text-navy-600 hover:text-navy-700"
          >
            Register as crew
          </Link>
        </p>
      </main>
    </div>
  );
}
