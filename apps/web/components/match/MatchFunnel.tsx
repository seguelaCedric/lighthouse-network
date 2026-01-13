"use client";

import { useState } from "react";
import { RequirementsTextStep } from "./RequirementsTextStep";
import { ContactStep } from "./ContactStep";
import { AIPreviewSection } from "./AIPreviewSection";
import { FunnelStepIndicator } from "./FunnelStepIndicator";

type FunnelStep = "requirements" | "contact" | "preview";

interface ContactData {
  name: string;
  email: string;
  phone: string;
  company: string;
}

interface AnonymizedCandidate {
  id: string;
  display_name: string;
  avatar_url: string | null;
  position: string;
  experience_years: number;
  languages: string[];
  nationality: string;
  match_score: number;
  why_good_fit: string;
}

export function MatchFunnel() {
  // Step state
  const [currentStep, setCurrentStep] = useState<FunnelStep>("requirements");

  // Form state
  const [requirements, setRequirements] = useState("");
  const [requirementsError, setRequirementsError] = useState<string>();
  const [contactData, setContactData] = useState<ContactData>({
    name: "",
    email: "",
    phone: "",
    company: "",
  });

  // Submission state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string>();
  const [inquiryId, setInquiryId] = useState<string>();

  // AI preview state
  const [aiLoading, setAiLoading] = useState(false);
  const [aiCandidates, setAiCandidates] = useState<AnonymizedCandidate[]>([]);
  const [aiError, setAiError] = useState<string>();

  // Handle requirements step continue
  const handleRequirementsContinue = () => {
    if (requirements.trim().length < 10) {
      setRequirementsError("Please provide more detail about what you're looking for");
      return;
    }
    setRequirementsError(undefined);
    setCurrentStep("contact");
  };

  // Handle contact step submission
  const handleContactSubmit = async () => {
    setIsSubmitting(true);
    setSubmitError(undefined);

    try {
      // Get UTM parameters from URL
      const urlParams = new URLSearchParams(window.location.search);
      const utmSource = urlParams.get("utm_source");
      const utmMedium = urlParams.get("utm_medium");
      const utmCampaign = urlParams.get("utm_campaign");

      // Submit inquiry to API - Lead is captured here!
      const response = await fetch("/api/inquiries/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "match_funnel",
          name: contactData.name.trim(),
          email: contactData.email.trim(),
          phone: contactData.phone.trim(),
          company: contactData.company?.trim() || undefined,
          brief: {
            query: requirements.trim(),
          },
          source_url: window.location.href,
          utm_source: utmSource || "match_funnel",
          utm_medium: utmMedium,
          utm_campaign: utmCampaign,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to submit inquiry");
      }

      const data = await response.json();
      setInquiryId(data.id);

      // Store query in sessionStorage for analytics
      sessionStorage.setItem("match_query", requirements);

      // Move to preview step and start AI matching
      setCurrentStep("preview");
      setAiLoading(true);

      // Run AI matching in background (failure is OK - lead is already captured!)
      // Use AbortController for timeout - API can take 30+ seconds due to AI processing
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 45000); // 45 second timeout

      try {
        const matchResponse = await fetch("/api/public/brief-match/", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ query: requirements.trim() }),
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (matchResponse.ok) {
          const matchData = await matchResponse.json();
          console.log("[MatchFunnel] AI results:", matchData.candidates?.length || 0, "candidates");
          setAiCandidates(matchData.candidates || []);
        } else {
          console.error("[MatchFunnel] AI match failed:", matchResponse.status);
          // AI failed, but lead is saved - show fallback
          setAiError("Our team will find matches for you");
        }
      } catch (err) {
        clearTimeout(timeoutId);
        if (err instanceof Error && err.name === "AbortError") {
          console.log("[MatchFunnel] AI match timed out after 45s");
        } else {
          console.error("[MatchFunnel] AI match error:", err);
        }
        // AI failed, but lead is saved - show fallback
        setAiError("Our team will find matches for you");
      } finally {
        setAiLoading(false);
      }
    } catch (error) {
      console.error("Form submission error:", error);
      setSubmitError(
        error instanceof Error
          ? error.message
          : "Something went wrong. Please try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle back navigation
  const handleBack = () => {
    if (currentStep === "contact") {
      setCurrentStep("requirements");
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
      {/* Header */}
      <div className="relative bg-gradient-to-r from-navy-900 via-navy-800 to-navy-900 px-6 py-5">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-gold-500/10 via-transparent to-transparent" />
        <div className="relative text-center">
          <h1 className="text-xl font-semibold text-white">
            {currentStep === "preview"
              ? "Your Inquiry Has Been Submitted"
              : "Find Your Perfect Candidate"}
          </h1>
          {currentStep !== "preview" && (
            <p className="text-sm text-gray-300 mt-1">
              Tell us what you need and we&apos;ll search our network
            </p>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="p-6 sm:p-8">
        {/* Step Indicator */}
        <FunnelStepIndicator currentStep={currentStep} />

        {/* Step Content */}
        {currentStep === "requirements" && (
          <RequirementsTextStep
            value={requirements}
            onChange={setRequirements}
            onContinue={handleRequirementsContinue}
            error={requirementsError}
          />
        )}

        {currentStep === "contact" && (
          <ContactStep
            requirements={requirements}
            contactData={contactData}
            onContactChange={setContactData}
            onSubmit={handleContactSubmit}
            onBack={handleBack}
            isSubmitting={isSubmitting}
            submitError={submitError}
          />
        )}

        {currentStep === "preview" && (
          <AIPreviewSection
            isLoading={aiLoading}
            candidates={aiCandidates}
            error={aiError}
          />
        )}
      </div>
    </div>
  );
}
