"use client";

import { useState } from "react";
import {
  Search,
  SlidersHorizontal,
  X,
  MapPin,
  Ship,
  Briefcase,
  ChevronDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface FilterOptions {
  positions: string[];
  regions: string[];
  vesselTypes: string[];
  contractTypes: string[];
}

interface JobFiltersProps {
  filters: FilterOptions;
  currentFilters: {
    search: string;
    position: string;
    region: string;
    contractType: string;
    vesselType: string;
    sortBy: string;
  };
  onFilterChange: (key: string, value: string) => void;
  onClearFilters: () => void;
  totalResults: number;
}

const POSITION_LABELS: Record<string, string> = {
  captain: "Captain",
  deck: "Deck",
  interior: "Interior",
  galley: "Galley",
  engineering: "Engineering",
  medical: "Medical",
  administrative: "Administrative",
  other: "Other",
};

const SORT_OPTIONS = [
  { value: "newest", label: "Newest First" },
  { value: "oldest", label: "Oldest First" },
  { value: "salary_high", label: "Highest Salary" },
  { value: "salary_low", label: "Lowest Salary" },
];

export function JobFilters({
  filters,
  currentFilters,
  onFilterChange,
  onClearFilters,
  totalResults,
}: JobFiltersProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const activeFilterCount = [
    currentFilters.position,
    currentFilters.region,
    currentFilters.contractType,
    currentFilters.vesselType,
  ].filter(Boolean).length;

  const hasActiveFilters = activeFilterCount > 0 || currentFilters.search;

  return (
    <div className="space-y-4">
      {/* Search Bar */}
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search job titles, descriptions..."
            value={currentFilters.search}
            onChange={(e) => onFilterChange("search", e.target.value)}
            className="h-12 w-full rounded-xl border border-gray-200 bg-white pl-12 pr-4 text-sm text-navy-800 placeholder:text-gray-400 focus:border-gold-500 focus:outline-none focus:ring-2 focus:ring-gold-500/20"
          />
          {currentFilters.search && (
            <button
              onClick={() => onFilterChange("search", "")}
              className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
            >
              <X className="size-4" />
            </button>
          )}
        </div>

        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className={cn(
            "flex h-12 items-center justify-center gap-2 rounded-xl border px-5 text-sm font-medium transition-colors",
            isExpanded || activeFilterCount > 0
              ? "border-gold-500 bg-gold-50 text-gold-700"
              : "border-gray-200 bg-white text-navy-600 hover:border-gray-300"
          )}
        >
          <SlidersHorizontal className="size-5" />
          <span>Filters</span>
          {activeFilterCount > 0 && (
            <span className="flex size-5 items-center justify-center rounded-full bg-gold-500 text-xs font-semibold text-white">
              {activeFilterCount}
            </span>
          )}
        </button>
      </div>

      {/* Expanded Filters */}
      {isExpanded && (
        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm sm:p-6">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {/* Position Category */}
            <div>
              <label className="mb-2 flex items-center gap-1.5 text-sm font-medium text-gray-700">
                <Briefcase className="size-4" />
                Position
              </label>
              <div className="relative">
                <select
                  value={currentFilters.position}
                  onChange={(e) => onFilterChange("position", e.target.value)}
                  className="h-10 w-full appearance-none rounded-lg border border-gray-200 bg-white px-3 pr-10 text-sm text-navy-800 focus:border-gold-500 focus:outline-none focus:ring-2 focus:ring-gold-500/20"
                >
                  <option value="">All Positions</option>
                  {filters.positions.map((pos) => (
                    <option key={pos} value={pos}>
                      {POSITION_LABELS[pos] || pos}
                    </option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-gray-400" />
              </div>
            </div>

            {/* Region */}
            <div>
              <label className="mb-2 flex items-center gap-1.5 text-sm font-medium text-gray-700">
                <MapPin className="size-4" />
                Region
              </label>
              <div className="relative">
                <select
                  value={currentFilters.region}
                  onChange={(e) => onFilterChange("region", e.target.value)}
                  className="h-10 w-full appearance-none rounded-lg border border-gray-200 bg-white px-3 pr-10 text-sm text-navy-800 focus:border-gold-500 focus:outline-none focus:ring-2 focus:ring-gold-500/20"
                >
                  <option value="">All Regions</option>
                  {filters.regions.map((region) => (
                    <option key={region} value={region}>
                      {region}
                    </option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-gray-400" />
              </div>
            </div>

            {/* Vessel Type */}
            <div>
              <label className="mb-2 flex items-center gap-1.5 text-sm font-medium text-gray-700">
                <Ship className="size-4" />
                Vessel Type
              </label>
              <div className="relative">
                <select
                  value={currentFilters.vesselType}
                  onChange={(e) => onFilterChange("vesselType", e.target.value)}
                  className="h-10 w-full appearance-none rounded-lg border border-gray-200 bg-white px-3 pr-10 text-sm text-navy-800 focus:border-gold-500 focus:outline-none focus:ring-2 focus:ring-gold-500/20"
                >
                  <option value="">All Vessel Types</option>
                  {filters.vesselTypes.map((type) => (
                    <option key={type} value={type}>
                      {type.charAt(0).toUpperCase() + type.slice(1)}
                    </option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-gray-400" />
              </div>
            </div>

            {/* Contract Type */}
            <div>
              <label className="mb-2 flex items-center gap-1.5 text-sm font-medium text-gray-700">
                Contract Type
              </label>
              <div className="relative">
                <select
                  value={currentFilters.contractType}
                  onChange={(e) =>
                    onFilterChange("contractType", e.target.value)
                  }
                  className="h-10 w-full appearance-none rounded-lg border border-gray-200 bg-white px-3 pr-10 text-sm text-navy-800 focus:border-gold-500 focus:outline-none focus:ring-2 focus:ring-gold-500/20"
                >
                  <option value="">All Contract Types</option>
                  {filters.contractTypes.map((type) => (
                    <option key={type} value={type}>
                      {type.charAt(0).toUpperCase() + type.slice(1)}
                    </option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-gray-400" />
              </div>
            </div>
          </div>

          {/* Actions */}
          {hasActiveFilters && (
            <div className="mt-4 flex items-center justify-end border-t border-gray-100 pt-4">
              <button
                onClick={onClearFilters}
                className="text-sm font-medium text-gold-600 hover:text-gold-700"
              >
                Clear all filters
              </button>
            </div>
          )}
        </div>
      )}

      {/* Results Count & Sort */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-600">
          {totalResults === 0 ? (
            "No jobs found"
          ) : totalResults === 1 ? (
            <span>
              <strong className="text-navy-800">1</strong> job found
            </span>
          ) : (
            <span>
              <strong className="text-navy-800">{totalResults}</strong> jobs
              found
            </span>
          )}
        </p>

        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-500">Sort by:</span>
          <div className="relative">
            <select
              value={currentFilters.sortBy}
              onChange={(e) => onFilterChange("sortBy", e.target.value)}
              className="h-9 appearance-none rounded-lg border border-gray-200 bg-white px-3 pr-8 text-sm font-medium text-navy-800 focus:border-gold-500 focus:outline-none"
            >
              {SORT_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-2 top-1/2 size-4 -translate-y-1/2 text-gray-400" />
          </div>
        </div>
      </div>

      {/* Active Filter Pills */}
      {hasActiveFilters && (
        <div className="flex flex-wrap gap-2">
          {currentFilters.search && (
            <FilterPill
              label={`"${currentFilters.search}"`}
              onRemove={() => onFilterChange("search", "")}
            />
          )}
          {currentFilters.position && (
            <FilterPill
              label={POSITION_LABELS[currentFilters.position] || currentFilters.position}
              onRemove={() => onFilterChange("position", "")}
            />
          )}
          {currentFilters.region && (
            <FilterPill
              label={currentFilters.region}
              onRemove={() => onFilterChange("region", "")}
            />
          )}
          {currentFilters.contractType && (
            <FilterPill
              label={currentFilters.contractType}
              onRemove={() => onFilterChange("contractType", "")}
            />
          )}
          {currentFilters.vesselType && (
            <FilterPill
              label={currentFilters.vesselType}
              onRemove={() => onFilterChange("vesselType", "")}
            />
          )}
        </div>
      )}
    </div>
  );
}

function FilterPill({
  label,
  onRemove,
}: {
  label: string;
  onRemove: () => void;
}) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-navy-100 py-1 pl-3 pr-2 text-sm font-medium text-navy-700">
      {label}
      <button
        onClick={onRemove}
        className="rounded-full p-0.5 hover:bg-navy-200"
      >
        <X className="size-3.5" />
      </button>
    </span>
  );
}
