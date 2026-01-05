"use client";

import * as React from "react";
import { Heart, Users, User } from "lucide-react";
import { cn } from "@/lib/utils";

// Combined list of positions for partner selection
const allPositions = [
  // Yacht positions
  { value: "captain", label: "Captain", category: "yacht" },
  { value: "first_officer", label: "First Officer", category: "yacht" },
  { value: "second_officer", label: "Second Officer", category: "yacht" },
  { value: "bosun", label: "Bosun", category: "yacht" },
  { value: "lead_deckhand", label: "Lead Deckhand", category: "yacht" },
  { value: "deckhand", label: "Deckhand", category: "yacht" },
  { value: "chief_engineer", label: "Chief Engineer", category: "yacht" },
  { value: "second_engineer", label: "2nd Engineer", category: "yacht" },
  { value: "third_engineer", label: "3rd Engineer", category: "yacht" },
  { value: "eto", label: "ETO", category: "yacht" },
  { value: "chief_stewardess", label: "Chief Stewardess", category: "yacht" },
  { value: "second_stewardess", label: "2nd Stewardess", category: "yacht" },
  { value: "third_stewardess", label: "3rd Stewardess", category: "yacht" },
  { value: "stewardess", label: "Stewardess", category: "yacht" },
  { value: "purser", label: "Purser", category: "yacht" },
  { value: "head_chef", label: "Head Chef", category: "yacht" },
  { value: "sous_chef", label: "Sous Chef", category: "yacht" },
  { value: "chef", label: "Chef", category: "yacht" },
  // Household positions
  { value: "estate_manager", label: "Estate Manager", category: "household" },
  { value: "house_manager", label: "House Manager", category: "household" },
  { value: "butler", label: "Butler", category: "household" },
  { value: "head_housekeeper", label: "Head Housekeeper", category: "household" },
  { value: "housekeeper", label: "Housekeeper", category: "household" },
  { value: "personal_assistant", label: "Personal Assistant", category: "household" },
  { value: "nanny", label: "Nanny", category: "household" },
  { value: "governess", label: "Governess", category: "household" },
  { value: "private_chef", label: "Private Chef", category: "household" },
  { value: "chauffeur", label: "Chauffeur", category: "household" },
  { value: "security", label: "Security / Close Protection", category: "household" },
  { value: "gardener", label: "Gardener / Groundskeeper", category: "household" },
  { value: "maintenance", label: "Maintenance / Handyman", category: "household" },
  { value: "laundress", label: "Laundress", category: "household" },
];

interface CoupleSectionProps {
  isCouple: boolean;
  partnerName: string | null;
  partnerPosition: string | null;
  onChange: (field: string, value: unknown) => void;
}

export function CoupleSection({
  isCouple,
  partnerName,
  partnerPosition,
  onChange,
}: CoupleSectionProps) {
  return (
    <div className="space-y-8">
      <div className="text-center">
        <div className="mx-auto mb-3 flex size-12 items-center justify-center rounded-full bg-error-100">
          <Heart className="size-6 text-error-500" />
        </div>
        <h2 className="text-xl font-semibold text-navy-900">Couple Placement</h2>
        <p className="mt-1 text-gray-600">
          Are you looking for positions as a couple?
        </p>
      </div>

      {/* Single or Couple Selection */}
      <div className="grid gap-4 sm:grid-cols-2">
        <button
          type="button"
          onClick={() => onChange("isCouple", false)}
          className={cn(
            "group relative flex flex-col items-center rounded-xl border-2 p-6 text-center transition-all",
            "hover:border-navy-300 hover:bg-navy-50/50",
            !isCouple
              ? "border-navy-600 bg-navy-50"
              : "border-gray-200 bg-white"
          )}
        >
          {!isCouple && (
            <div className="absolute right-3 top-3 flex size-6 items-center justify-center rounded-full bg-navy-600">
              <svg
                className="size-4 text-white"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={3}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
          )}
          <div
            className={cn(
              "mb-4 flex size-14 items-center justify-center rounded-full transition-colors",
              !isCouple ? "bg-navy-100" : "bg-gray-100 group-hover:bg-navy-100"
            )}
          >
            <User
              className={cn(
                "size-7",
                !isCouple ? "text-navy-600" : "text-gray-400 group-hover:text-navy-500"
              )}
            />
          </div>
          <h3 className={cn("mb-1 font-semibold", !isCouple ? "text-navy-900" : "text-gray-700")}>
            Individual
          </h3>
          <p className="text-sm text-gray-500">I&apos;m looking for a position on my own</p>
        </button>

        <button
          type="button"
          onClick={() => onChange("isCouple", true)}
          className={cn(
            "group relative flex flex-col items-center rounded-xl border-2 p-6 text-center transition-all",
            "hover:border-error-300 hover:bg-error-50/50",
            isCouple
              ? "border-error-500 bg-error-50"
              : "border-gray-200 bg-white"
          )}
        >
          {isCouple && (
            <div className="absolute right-3 top-3 flex size-6 items-center justify-center rounded-full bg-error-500">
              <svg
                className="size-4 text-white"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={3}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
          )}
          <div
            className={cn(
              "mb-4 flex size-14 items-center justify-center rounded-full transition-colors",
              isCouple ? "bg-error-100" : "bg-gray-100 group-hover:bg-error-100"
            )}
          >
            <Users
              className={cn(
                "size-7",
                isCouple ? "text-error-500" : "text-gray-400 group-hover:text-error-400"
              )}
            />
          </div>
          <h3 className={cn("mb-1 font-semibold", isCouple ? "text-navy-900" : "text-gray-700")}>
            Couple
          </h3>
          <p className="text-sm text-gray-500">We&apos;re looking for positions together</p>
        </button>
      </div>

      {/* Partner Details (shown when couple is selected) */}
      {isCouple && (
        <div className="space-y-4 rounded-lg border border-error-200 bg-error-50/50 p-4">
          <h3 className="font-medium text-navy-900">Partner Details</h3>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Partner&apos;s Name
            </label>
            <input
              type="text"
              value={partnerName || ""}
              onChange={(e) => onChange("partnerName", e.target.value || null)}
              placeholder="Enter your partner's name"
              className="h-10 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm focus:border-error-500 focus:outline-none focus:ring-2 focus:ring-error-500/20"
            />
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Partner&apos;s Position
            </label>
            <select
              value={partnerPosition || ""}
              onChange={(e) => onChange("partnerPosition", e.target.value || null)}
              className="h-10 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm focus:border-error-500 focus:outline-none focus:ring-2 focus:ring-error-500/20"
            >
              <option value="">Select partner&apos;s position...</option>
              <optgroup label="Yacht Crew">
                {allPositions
                  .filter((p) => p.category === "yacht")
                  .map((pos) => (
                    <option key={pos.value} value={pos.value}>
                      {pos.label}
                    </option>
                  ))}
              </optgroup>
              <optgroup label="Household Staff">
                {allPositions
                  .filter((p) => p.category === "household")
                  .map((pos) => (
                    <option key={pos.value} value={pos.value}>
                      {pos.label}
                    </option>
                  ))}
              </optgroup>
            </select>
          </div>

          <p className="text-xs text-gray-500">
            Couple placements are highly sought after. We&apos;ll match you with opportunities
            that can accommodate both positions.
          </p>
        </div>
      )}
    </div>
  );
}
