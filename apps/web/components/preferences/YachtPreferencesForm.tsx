"use client";

import * as React from "react";
import { Ship, DollarSign, Calendar, MapPin, Anchor } from "lucide-react";
import { cn } from "@/lib/utils";

// Yacht crew positions
const yachtPositions = [
  // Deck
  { value: "captain", label: "Captain" },
  { value: "first_officer", label: "First Officer" },
  { value: "second_officer", label: "Second Officer" },
  { value: "bosun", label: "Bosun" },
  { value: "lead_deckhand", label: "Lead Deckhand" },
  { value: "deckhand", label: "Deckhand" },
  // Engineering
  { value: "chief_engineer", label: "Chief Engineer" },
  { value: "second_engineer", label: "2nd Engineer" },
  { value: "third_engineer", label: "3rd Engineer" },
  { value: "eto", label: "ETO" },
  // Interior
  { value: "chief_stewardess", label: "Chief Stewardess" },
  { value: "second_stewardess", label: "2nd Stewardess" },
  { value: "third_stewardess", label: "3rd Stewardess" },
  { value: "stewardess", label: "Stewardess" },
  { value: "purser", label: "Purser" },
  // Culinary
  { value: "head_chef", label: "Head Chef" },
  { value: "sous_chef", label: "Sous Chef" },
  { value: "chef", label: "Chef" },
];

const contractTypes = [
  { value: "permanent", label: "Permanent" },
  { value: "rotational", label: "Rotational" },
  { value: "seasonal", label: "Seasonal" },
  { value: "temporary", label: "Temporary" },
];

const regions = [
  { value: "mediterranean", label: "Mediterranean" },
  { value: "caribbean", label: "Caribbean" },
  { value: "bahamas", label: "Bahamas" },
  { value: "florida", label: "Florida" },
  { value: "new_england", label: "New England" },
  { value: "alaska", label: "Alaska" },
  { value: "south_pacific", label: "South Pacific" },
  { value: "australia", label: "Australia / NZ" },
  { value: "middle_east", label: "Middle East" },
  { value: "asia", label: "Asia" },
  { value: "worldwide", label: "Worldwide" },
];

const currencies = [
  { value: "EUR", label: "EUR (€)", symbol: "€" },
  { value: "USD", label: "USD ($)", symbol: "$" },
  { value: "GBP", label: "GBP (£)", symbol: "£" },
];

const availabilityOptions = [
  { value: "available", label: "Available Immediately" },
  { value: "looking", label: "Actively Looking" },
  { value: "employed", label: "Currently Employed" },
  { value: "unavailable", label: "Not Looking" },
];

interface YachtPreferencesFormProps {
  data: {
    primaryPosition: string | null;
    secondaryPositions: string[];
    yachtSizeMin: number | null;
    yachtSizeMax: number | null;
    contractTypes: string[];
    regions: string[];
    leavePackage: string | null;
    salaryCurrency: string;
    salaryMin: number | null;
    salaryMax: number | null;
    availabilityStatus: "available" | "looking" | "employed" | "unavailable";
    availableFrom: string | null;
  };
  onChange: (field: string, value: unknown) => void;
}

export function YachtPreferencesForm({ data, onChange }: YachtPreferencesFormProps) {
  const toggleSecondaryPosition = (value: string) => {
    const current = data.secondaryPositions || [];
    if (current.includes(value)) {
      onChange(
        "secondaryPositions",
        current.filter((p) => p !== value)
      );
    } else {
      onChange("secondaryPositions", [...current, value]);
    }
  };

  const toggleContractType = (value: string) => {
    const current = data.contractTypes || [];
    if (current.includes(value)) {
      onChange(
        "contractTypes",
        current.filter((p) => p !== value)
      );
    } else {
      onChange("contractTypes", [...current, value]);
    }
  };

  const toggleRegion = (value: string) => {
    const current = data.regions || [];
    if (current.includes(value)) {
      onChange(
        "regions",
        current.filter((p) => p !== value)
      );
    } else {
      onChange("regions", [...current, value]);
    }
  };

  const selectedCurrency = currencies.find((c) => c.value === data.salaryCurrency) || currencies[0];

  return (
    <div className="space-y-8">
      <div className="text-center">
        <div className="mx-auto mb-3 flex size-12 items-center justify-center rounded-full bg-navy-100">
          <Ship className="size-6 text-navy-600" />
        </div>
        <h2 className="text-xl font-semibold text-navy-900">Yacht Crew Preferences</h2>
        <p className="mt-1 text-gray-600">Tell us about your ideal yacht position</p>
      </div>

      {/* Primary Position */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">
          Primary Position <span className="text-error-500">*</span>
        </label>
        <select
          value={data.primaryPosition || ""}
          onChange={(e) => onChange("primaryPosition", e.target.value || null)}
          className="h-10 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm focus:border-navy-500 focus:outline-none focus:ring-2 focus:ring-navy-500/20"
        >
          <option value="">Select your primary position...</option>
          {yachtPositions.map((pos) => (
            <option key={pos.value} value={pos.value}>
              {pos.label}
            </option>
          ))}
        </select>
      </div>

      {/* Secondary Positions */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">
          Secondary Positions
          <span className="ml-1 text-xs font-normal text-gray-500">(other roles you&apos;d consider)</span>
        </label>
        <div className="flex flex-wrap gap-2">
          {yachtPositions
            .filter((pos) => pos.value !== data.primaryPosition)
            .map((pos) => {
              const isSelected = data.secondaryPositions?.includes(pos.value);
              return (
                <button
                  key={pos.value}
                  type="button"
                  onClick={() => toggleSecondaryPosition(pos.value)}
                  className={cn(
                    "rounded-full px-3 py-1.5 text-sm transition-colors",
                    isSelected
                      ? "bg-navy-100 text-navy-700 ring-1 ring-navy-300"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  )}
                >
                  {pos.label}
                </button>
              );
            })}
        </div>
      </div>

      {/* Yacht Size */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">
          <Anchor className="mr-1 inline size-4" />
          Preferred Yacht Size (meters)
        </label>
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <input
              type="number"
              placeholder="Min"
              value={data.yachtSizeMin || ""}
              onChange={(e) =>
                onChange("yachtSizeMin", e.target.value ? Number(e.target.value) : null)
              }
              className="h-10 w-full rounded-lg border border-gray-300 px-3 text-sm focus:border-navy-500 focus:outline-none focus:ring-2 focus:ring-navy-500/20"
            />
          </div>
          <span className="text-gray-400">to</span>
          <div className="flex-1">
            <input
              type="number"
              placeholder="Max"
              value={data.yachtSizeMax || ""}
              onChange={(e) =>
                onChange("yachtSizeMax", e.target.value ? Number(e.target.value) : null)
              }
              className="h-10 w-full rounded-lg border border-gray-300 px-3 text-sm focus:border-navy-500 focus:outline-none focus:ring-2 focus:ring-navy-500/20"
            />
          </div>
        </div>
        <p className="text-xs text-gray-500">Leave blank if you&apos;re open to any size</p>
      </div>

      {/* Contract Types */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">Contract Types</label>
        <div className="flex flex-wrap gap-2">
          {contractTypes.map((type) => {
            const isSelected = data.contractTypes?.includes(type.value);
            return (
              <button
                key={type.value}
                type="button"
                onClick={() => toggleContractType(type.value)}
                className={cn(
                  "rounded-full px-4 py-2 text-sm transition-colors",
                  isSelected
                    ? "bg-navy-100 text-navy-700 ring-1 ring-navy-300"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                )}
              >
                {type.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Regions */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">
          <MapPin className="mr-1 inline size-4" />
          Preferred Cruising Grounds
        </label>
        <div className="flex flex-wrap gap-2">
          {regions.map((region) => {
            const isSelected = data.regions?.includes(region.value);
            return (
              <button
                key={region.value}
                type="button"
                onClick={() => toggleRegion(region.value)}
                className={cn(
                  "rounded-full px-3 py-1.5 text-sm transition-colors",
                  isSelected
                    ? "bg-navy-100 text-navy-700 ring-1 ring-navy-300"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                )}
              >
                {region.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Leave Package */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">
          Preferred Leave Package
        </label>
        <input
          type="text"
          placeholder='e.g., "2:1 rotation" or "6 weeks annually"'
          value={data.leavePackage || ""}
          onChange={(e) => onChange("leavePackage", e.target.value || null)}
          className="h-10 w-full rounded-lg border border-gray-300 px-3 text-sm focus:border-navy-500 focus:outline-none focus:ring-2 focus:ring-navy-500/20"
        />
      </div>

      {/* Salary */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">
          <DollarSign className="mr-1 inline size-4" />
          Desired Salary (Monthly)
        </label>
        <div className="flex items-center gap-3">
          <select
            value={data.salaryCurrency}
            onChange={(e) => onChange("salaryCurrency", e.target.value)}
            className="h-10 rounded-lg border border-gray-300 bg-white px-3 text-sm focus:border-navy-500 focus:outline-none focus:ring-2 focus:ring-navy-500/20"
          >
            {currencies.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>
          <div className="relative flex-1">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
              {selectedCurrency.symbol}
            </span>
            <input
              type="number"
              placeholder="Min"
              value={data.salaryMin || ""}
              onChange={(e) =>
                onChange("salaryMin", e.target.value ? Number(e.target.value) : null)
              }
              className="h-10 w-full rounded-lg border border-gray-300 pl-7 pr-3 text-sm focus:border-navy-500 focus:outline-none focus:ring-2 focus:ring-navy-500/20"
            />
          </div>
          <span className="text-gray-400">-</span>
          <div className="relative flex-1">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
              {selectedCurrency.symbol}
            </span>
            <input
              type="number"
              placeholder="Max"
              value={data.salaryMax || ""}
              onChange={(e) =>
                onChange("salaryMax", e.target.value ? Number(e.target.value) : null)
              }
              className="h-10 w-full rounded-lg border border-gray-300 pl-7 pr-3 text-sm focus:border-navy-500 focus:outline-none focus:ring-2 focus:ring-navy-500/20"
            />
          </div>
        </div>
      </div>

      {/* Availability */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">
          <Calendar className="mr-1 inline size-4" />
          Availability
        </label>
        <div className="grid gap-2 sm:grid-cols-2">
          {availabilityOptions.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => onChange("availabilityStatus", option.value)}
              className={cn(
                "rounded-lg border px-4 py-3 text-left text-sm transition-colors",
                data.availabilityStatus === option.value
                  ? "border-navy-500 bg-navy-50 text-navy-700"
                  : "border-gray-200 hover:bg-gray-50"
              )}
            >
              {option.label}
            </button>
          ))}
        </div>

        {data.availabilityStatus !== "available" && data.availabilityStatus !== "unavailable" && (
          <div className="mt-3">
            <label className="mb-1 block text-xs text-gray-500">Available from</label>
            <input
              type="date"
              value={data.availableFrom || ""}
              onChange={(e) => onChange("availableFrom", e.target.value || null)}
              className="h-10 w-full rounded-lg border border-gray-300 px-3 text-sm focus:border-navy-500 focus:outline-none focus:ring-2 focus:ring-navy-500/20 sm:w-48"
            />
          </div>
        )}
      </div>
    </div>
  );
}
