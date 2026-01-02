"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Search,
  MapPin,
  Sparkles,
} from "lucide-react";

// Staff role options for private households
const STAFF_ROLES = [
  { value: "butler", label: "Butler" },
  { value: "estate-manager", label: "Estate Manager" },
  { value: "house-manager", label: "House Manager" },
  { value: "personal-assistant", label: "Personal Assistant" },
  { value: "housekeeper", label: "Housekeeper" },
  { value: "nanny", label: "Nanny" },
  { value: "governess", label: "Governess" },
  { value: "chef", label: "Private Chef" },
  { value: "chauffeur", label: "Chauffeur" },
  { value: "security", label: "Security / Close Protection" },
  { value: "laundress", label: "Laundress" },
  { value: "valet", label: "Valet" },
  { value: "caretaker", label: "Property Caretaker" },
  { value: "couple", label: "Household Couple" },
];

const TIMELINE_OPTIONS = [
  { value: "asap", label: "As soon as possible" },
  { value: "1-month", label: "Within 1 month" },
  { value: "3-months", label: "Within 3 months" },
  { value: "flexible", label: "Flexible / Just exploring" },
];

interface BriefMatcherProps {
  variant?: "inline" | "modal";
  onClose?: () => void;
}

export function BriefMatcher({ variant = "inline", onClose }: BriefMatcherProps) {
  const router = useRouter();
  const [formData, setFormData] = useState({
    role: "",
    location: "",
    timeline: "",
    requirements: "",
  });
  const [error, setError] = useState<string | null>(null);

  const handleSearch = () => {
    if (!formData.role) {
      setError("Please select a role");
      return;
    }

    setError(null);

    // Build URL params
    const params = new URLSearchParams();
    if (formData.role) params.set("role", formData.role);
    if (formData.location) params.set("location", formData.location);
    if (formData.timeline) params.set("timeline", formData.timeline);
    if (formData.requirements) params.set("requirements", formData.requirements);

    // Close modal if open
    if (onClose) {
      onClose();
    }

    // Navigate to dedicated match page
    router.push(`/match?${params.toString()}`);
  };

  const containerClasses = variant === "modal"
    ? "fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
    : "relative";

  const contentClasses = variant === "modal"
    ? "bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
    : "bg-white rounded-2xl border border-gray-200 shadow-xl";

  return (
    <div className={containerClasses}>
      <div className={contentClasses}>
        {/* Header */}
        <div className="border-b border-gray-100 bg-gradient-to-r from-navy-900 to-navy-800 p-6 rounded-t-2xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gold-500/20">
                <Sparkles className="h-5 w-5 text-gold-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white">
                  AI Candidate Matcher
                </h3>
                <p className="text-sm text-gray-300">
                  See matching candidates instantly
                </p>
              </div>
            </div>
            {variant === "modal" && onClose && (
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        </div>

        {/* Form */}
        <div className="p-6 space-y-5">
          {/* Role Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              What role are you hiring for? *
            </label>
            <select
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value })}
              className="w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900 focus:border-gold-500 focus:ring-2 focus:ring-gold-500/20 transition-colors"
            >
              <option value="">Select a role...</option>
              {STAFF_ROLES.map((role) => (
                <option key={role.value} value={role.value}>
                  {role.label}
                </option>
              ))}
            </select>
          </div>

          {/* Location */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Where is the position based?
            </label>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                placeholder="e.g., London, Monaco, New York..."
                className="w-full rounded-lg border border-gray-300 pl-10 pr-4 py-3 text-gray-900 focus:border-gold-500 focus:ring-2 focus:ring-gold-500/20 transition-colors"
              />
            </div>
          </div>

          {/* Timeline */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              When do you need someone?
            </label>
            <div className="grid grid-cols-2 gap-2">
              {TIMELINE_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  onClick={() => setFormData({ ...formData, timeline: option.value })}
                  className={`rounded-lg border px-4 py-2.5 text-sm font-medium transition-all ${
                    formData.timeline === option.value
                      ? "border-gold-500 bg-gold-50 text-gold-700"
                      : "border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50"
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          {/* Requirements */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Any specific requirements? (optional)
            </label>
            <textarea
              value={formData.requirements}
              onChange={(e) => setFormData({ ...formData, requirements: e.target.value })}
              placeholder="e.g., Must speak French, experience with UHNW families, trained at Buckingham Palace..."
              rows={3}
              className="w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900 focus:border-gold-500 focus:ring-2 focus:ring-gold-500/20 transition-colors resize-none"
            />
          </div>

          {error && (
            <p className="text-sm text-red-600">{error}</p>
          )}

          <Button
            onClick={handleSearch}
            className="w-full"
            size="lg"
          >
            <Search className="mr-2 h-5 w-5" />
            Find Matching Candidates
          </Button>

          <p className="text-center text-xs text-gray-500">
            Results are anonymized. No commitment required.
          </p>
        </div>
      </div>
    </div>
  );
}
