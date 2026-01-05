"use client";

import * as React from "react";
import { Home, DollarSign, Calendar, MapPin, Plus, X } from "lucide-react";
import { cn } from "@/lib/utils";

// Household staff positions
const householdPositions = [
  { value: "estate_manager", label: "Estate Manager" },
  { value: "house_manager", label: "House Manager" },
  { value: "butler", label: "Butler" },
  { value: "head_housekeeper", label: "Head Housekeeper" },
  { value: "housekeeper", label: "Housekeeper" },
  { value: "personal_assistant", label: "Personal Assistant" },
  { value: "nanny", label: "Nanny" },
  { value: "governess", label: "Governess" },
  { value: "private_chef", label: "Private Chef" },
  { value: "chauffeur", label: "Chauffeur" },
  { value: "security", label: "Security / Close Protection" },
  { value: "gardener", label: "Gardener / Groundskeeper" },
  { value: "maintenance", label: "Maintenance / Handyman" },
  { value: "laundress", label: "Laundress" },
];

const livingArrangementOptions = [
  { value: "live_in", label: "Live-in", description: "Accommodation provided on-site" },
  { value: "live_out", label: "Live-out", description: "Commute from own residence" },
  { value: "flexible", label: "Flexible", description: "Open to either arrangement" },
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

interface HouseholdPreferencesFormProps {
  data: {
    primaryPosition: string | null;
    secondaryPositions: string[];
    locations: string[];
    livingArrangement: "live_in" | "live_out" | "flexible" | null;
    salaryCurrency: string;
    salaryMin: number | null;
    salaryMax: number | null;
    availabilityStatus: "available" | "looking" | "employed" | "unavailable";
    availableFrom: string | null;
  };
  onChange: (field: string, value: unknown) => void;
  showSalaryAndAvailability?: boolean;
}

export function HouseholdPreferencesForm({
  data,
  onChange,
  showSalaryAndAvailability = true,
}: HouseholdPreferencesFormProps) {
  const [newLocation, setNewLocation] = React.useState("");

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

  const addLocation = () => {
    if (newLocation.trim()) {
      const current = data.locations || [];
      if (!current.includes(newLocation.trim())) {
        onChange("locations", [...current, newLocation.trim()]);
      }
      setNewLocation("");
    }
  };

  const removeLocation = (location: string) => {
    const current = data.locations || [];
    onChange(
      "locations",
      current.filter((l) => l !== location)
    );
  };

  const handleLocationKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addLocation();
    }
  };

  const selectedCurrency = currencies.find((c) => c.value === data.salaryCurrency) || currencies[0];

  return (
    <div className="space-y-8">
      <div className="text-center">
        <div className="mx-auto mb-3 flex size-12 items-center justify-center rounded-full bg-gold-100">
          <Home className="size-6 text-gold-600" />
        </div>
        <h2 className="text-xl font-semibold text-navy-900">Household Staff Preferences</h2>
        <p className="mt-1 text-gray-600">Tell us about your ideal household position</p>
      </div>

      {/* Primary Position */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">
          Primary Position <span className="text-error-500">*</span>
        </label>
        <select
          value={data.primaryPosition || ""}
          onChange={(e) => onChange("primaryPosition", e.target.value || null)}
          className="h-10 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm focus:border-gold-500 focus:outline-none focus:ring-2 focus:ring-gold-500/20"
        >
          <option value="">Select your primary position...</option>
          {householdPositions.map((pos) => (
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
          <span className="ml-1 text-xs font-normal text-gray-500">
            (other roles you&apos;d consider)
          </span>
        </label>
        <div className="flex flex-wrap gap-2">
          {householdPositions
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
                      ? "bg-gold-100 text-gold-700 ring-1 ring-gold-300"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  )}
                >
                  {pos.label}
                </button>
              );
            })}
        </div>
      </div>

      {/* Locations */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">
          <MapPin className="mr-1 inline size-4" />
          Preferred Locations
        </label>
        <p className="text-xs text-gray-500">
          Add cities, regions, or countries where you&apos;d like to work
        </p>

        {/* Location tags */}
        {data.locations && data.locations.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {data.locations.map((location) => (
              <span
                key={location}
                className="inline-flex items-center gap-1 rounded-full bg-gold-100 px-3 py-1 text-sm text-gold-700"
              >
                {location}
                <button
                  type="button"
                  onClick={() => removeLocation(location)}
                  className="ml-1 rounded-full p-0.5 hover:bg-gold-200"
                >
                  <X className="size-3" />
                </button>
              </span>
            ))}
          </div>
        )}

        {/* Add location input */}
        <div className="flex gap-2">
          <input
            type="text"
            value={newLocation}
            onChange={(e) => setNewLocation(e.target.value)}
            onKeyDown={handleLocationKeyDown}
            placeholder="e.g., London, Monaco, New York..."
            className="h-10 flex-1 rounded-lg border border-gray-300 px-3 text-sm focus:border-gold-500 focus:outline-none focus:ring-2 focus:ring-gold-500/20"
          />
          <button
            type="button"
            onClick={addLocation}
            disabled={!newLocation.trim()}
            className="inline-flex h-10 items-center gap-1 rounded-lg bg-gold-500 px-4 text-sm font-medium text-white transition-colors hover:bg-gold-600 disabled:bg-gray-200 disabled:text-gray-500"
          >
            <Plus className="size-4" />
            Add
          </button>
        </div>
      </div>

      {/* Living Arrangement */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">Living Arrangement</label>
        <div className="grid gap-3 sm:grid-cols-3">
          {livingArrangementOptions.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => onChange("livingArrangement", option.value)}
              className={cn(
                "rounded-lg border p-4 text-left transition-colors",
                data.livingArrangement === option.value
                  ? "border-gold-500 bg-gold-50"
                  : "border-gray-200 hover:bg-gray-50"
              )}
            >
              <div className="font-medium text-gray-900">{option.label}</div>
              <div className="mt-0.5 text-xs text-gray-500">{option.description}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Salary & Availability - only show if this is the only industry or explicitly requested */}
      {showSalaryAndAvailability && (
        <>
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
                className="h-10 rounded-lg border border-gray-300 bg-white px-3 text-sm focus:border-gold-500 focus:outline-none focus:ring-2 focus:ring-gold-500/20"
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
                  className="h-10 w-full rounded-lg border border-gray-300 pl-7 pr-3 text-sm focus:border-gold-500 focus:outline-none focus:ring-2 focus:ring-gold-500/20"
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
                  className="h-10 w-full rounded-lg border border-gray-300 pl-7 pr-3 text-sm focus:border-gold-500 focus:outline-none focus:ring-2 focus:ring-gold-500/20"
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
                      ? "border-gold-500 bg-gold-50 text-gold-700"
                      : "border-gray-200 hover:bg-gray-50"
                  )}
                >
                  {option.label}
                </button>
              ))}
            </div>

            {data.availabilityStatus !== "available" &&
              data.availabilityStatus !== "unavailable" && (
                <div className="mt-3">
                  <label className="mb-1 block text-xs text-gray-500">Available from</label>
                  <input
                    type="date"
                    value={data.availableFrom || ""}
                    onChange={(e) => onChange("availableFrom", e.target.value || null)}
                    className="h-10 w-full rounded-lg border border-gray-300 px-3 text-sm focus:border-gold-500 focus:outline-none focus:ring-2 focus:ring-gold-500/20 sm:w-48"
                  />
                </div>
              )}
          </div>
        </>
      )}
    </div>
  );
}
