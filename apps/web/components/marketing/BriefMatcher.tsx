"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Search,
  Sparkles,
} from "lucide-react";

interface BriefMatcherProps {
  variant?: "inline" | "modal";
  onClose?: () => void;
}

export function BriefMatcher({ variant = "inline", onClose }: BriefMatcherProps) {
  const router = useRouter();
  const [formData, setFormData] = useState({
    query: "",
  });
  const [error, setError] = useState<string | null>(null);

  const handleSearch = () => {
    if (!formData.query.trim()) {
      setError("Please describe what you're looking for");
      return;
    }

    setError(null);

    // Build URL params with single query
    const params = new URLSearchParams();
    params.set("query", formData.query);

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
          {/* Single Query Field */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Describe what you&apos;re looking for <span className="text-gold-600">*</span>
            </label>
            <textarea
              value={formData.query}
              onChange={(e) => setFormData({ query: e.target.value })}
              placeholder="e.g., Butler, London, ASAP, must speak French and have experience with UHNW families"
              rows={8}
              className="w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900 bg-gray-50/50 focus:bg-white focus:border-gold-500 focus:ring-2 focus:ring-gold-500/20 transition-all resize-none text-sm placeholder:text-gray-400"
            />
            <p className="mt-2 text-xs text-gray-500">
              Include role, location, timeline, requirements, skills, or any other details
            </p>
          </div>

          {error && (
            <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>
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
