"use client";

import Link from "next/link";
import { Ship, Home, Sparkles, ChevronRight, AlertCircle, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { yachtPositionLabels, householdPositionLabels, regionLabels } from "./constants";

interface PreferencesSummaryCardProps {
  preferences: {
    industryPreference: "yacht" | "household" | "both" | null;
    yachtPrimaryPosition: string | null;
    householdPrimaryPosition: string | null;
    regions: string[];
    householdLocations: string[];
    availabilityStatus: string | null;
    preferencesCompletedAt: string | null;
  };
}

export function PreferencesSummaryCard({ preferences }: PreferencesSummaryCardProps) {
  const isComplete = preferences.preferencesCompletedAt !== null;
  const hasStarted = preferences.industryPreference !== null;

  // Get display values
  const yachtPositionLabel = preferences.yachtPrimaryPosition
    ? yachtPositionLabels[preferences.yachtPrimaryPosition] || preferences.yachtPrimaryPosition
    : null;

  const householdPositionLabel = preferences.householdPrimaryPosition
    ? householdPositionLabels[preferences.householdPrimaryPosition] ||
      preferences.householdPrimaryPosition
    : null;

  const regionLabelsDisplay = preferences.regions
    .slice(0, 2)
    .map((r) => regionLabels[r] || r);

  const locationLabelsDisplay = preferences.householdLocations.slice(0, 2);

  // Determine the icon and color based on industry preference
  const getIndustryDisplay = () => {
    switch (preferences.industryPreference) {
      case "yacht":
        return { icon: Ship, label: "Yacht Crew", color: "navy" };
      case "household":
        return { icon: Home, label: "Private Household", color: "gold" };
      case "both":
        return { icon: Sparkles, label: "Yacht & Household", color: "success" };
      default:
        return null;
    }
  };

  const industryDisplay = getIndustryDisplay();

  if (!hasStarted) {
    return (
      <Link
        href="/crew/preferences"
        className="group block rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 p-6 transition-all hover:border-gold-400 hover:bg-gold-50"
      >
        <div className="flex items-start gap-4">
          <div className="flex size-12 shrink-0 items-center justify-center rounded-full bg-gray-200 group-hover:bg-gold-100">
            <AlertCircle className="size-6 text-gray-500 group-hover:text-gold-600" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-navy-900">Set Your Job Preferences</h3>
            <p className="mt-1 text-sm text-gray-600">
              Tell us what you&apos;re looking for so we can match you with the right
              opportunities.
            </p>
            <div className="mt-3 inline-flex items-center text-sm font-medium text-gold-600 group-hover:text-gold-700">
              Get started
              <ChevronRight className="ml-1 size-4 transition-transform group-hover:translate-x-1" />
            </div>
          </div>
        </div>
      </Link>
    );
  }

  return (
    <Link
      href="/crew/preferences"
      className="group block rounded-2xl border border-gray-200 bg-white p-6 shadow-sm transition-all hover:border-gold-300 hover:shadow-md"
    >
      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <h3 className="font-serif text-xl font-medium text-navy-900">
          Job Preferences
        </h3>
        <div className="flex items-center gap-3">
          {isComplete && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-success-100 px-2.5 py-1 text-xs font-medium text-success-700">
              <CheckCircle2 className="size-3" />
              Complete
            </span>
          )}
          <ChevronRight className="size-5 shrink-0 text-gray-400 transition-transform group-hover:translate-x-1 group-hover:text-gold-600" />
        </div>
      </div>

      {/* Industry Label */}
      {industryDisplay && (
        <p className="mb-5 text-sm text-gray-500">{industryDisplay.label}</p>
      )}

      {/* Content */}
      <div className="space-y-4">
        {/* Yacht position and regions */}
        {(preferences.industryPreference === "yacht" ||
          preferences.industryPreference === "both") &&
          yachtPositionLabel && (
            <div className="flex items-start gap-3">
              {industryDisplay && (
                <div
                  className={cn(
                    "flex size-12 shrink-0 items-center justify-center rounded-xl",
                    industryDisplay.color === "navy"
                      ? "bg-navy-50"
                      : industryDisplay.color === "gold"
                        ? "bg-gold-50"
                        : "bg-success-50"
                  )}
                >
                  <Ship
                    className={cn(
                      "size-5",
                      industryDisplay.color === "navy"
                        ? "text-navy-600"
                        : industryDisplay.color === "gold"
                          ? "text-gold-600"
                          : "text-success-600"
                    )}
                  />
                </div>
              )}
              <div className="flex-1 pt-1">
                <p className="font-medium text-navy-900">{yachtPositionLabel}</p>
                {regionLabelsDisplay.length > 0 && (
                  <p className="mt-0.5 text-sm text-gray-500">
                    {regionLabelsDisplay.join(", ")}
                    {preferences.regions.length > 2 &&
                      ` · +${preferences.regions.length - 2} more`}
                  </p>
                )}
              </div>
            </div>
          )}

        {/* Household position and locations */}
        {(preferences.industryPreference === "household" ||
          preferences.industryPreference === "both") &&
          householdPositionLabel && (
            <div className="flex items-start gap-3">
              {industryDisplay && (
                <div
                  className={cn(
                    "flex size-12 shrink-0 items-center justify-center rounded-xl",
                    industryDisplay.color === "navy"
                      ? "bg-navy-50"
                      : industryDisplay.color === "gold"
                        ? "bg-gold-50"
                        : "bg-success-50"
                  )}
                >
                  <Home
                    className={cn(
                      "size-5",
                      industryDisplay.color === "navy"
                        ? "text-navy-600"
                        : industryDisplay.color === "gold"
                          ? "text-gold-600"
                          : "text-success-600"
                    )}
                  />
                </div>
              )}
              <div className="flex-1 pt-1">
                <p className="font-medium text-navy-900">{householdPositionLabel}</p>
                {locationLabelsDisplay.length > 0 && (
                  <p className="mt-0.5 text-sm text-gray-500">
                    {locationLabelsDisplay.join(", ")}
                    {preferences.householdLocations.length > 2 &&
                      ` · +${preferences.householdLocations.length - 2} more`}
                  </p>
                )}
              </div>
            </div>
          )}

        {/* Availability Status Badge */}
        {preferences.availabilityStatus && (
          <div className="pt-2">
            <span
              className={cn(
                "inline-flex items-center rounded-full px-3 py-1.5 text-xs font-medium",
                preferences.availabilityStatus === "available"
                  ? "bg-success-50 text-success-700"
                  : preferences.availabilityStatus === "looking"
                    ? "bg-amber-50 text-amber-700"
                    : preferences.availabilityStatus === "employed"
                      ? "bg-navy-50 text-navy-700"
                      : "bg-gray-50 text-gray-600"
              )}
            >
              {preferences.availabilityStatus === "available"
                ? "Available Now"
                : preferences.availabilityStatus === "looking"
                  ? "Actively Looking"
                  : preferences.availabilityStatus === "employed"
                    ? "Currently Employed"
                    : "Not Looking"}
            </span>
          </div>
        )}
      </div>
    </Link>
  );
}
