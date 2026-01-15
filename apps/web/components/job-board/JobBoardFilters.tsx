"use client";

import { useState, useMemo, useEffect } from "react";
import {
  Filter,
  Briefcase,
  DollarSign,
  Calendar,
  Home,
  ChevronDown,
  X,
  RotateCcw,
  Users,
} from "lucide-react";
import {
  YACHT_DEPARTMENTS,
  HOUSEHOLD_DEPARTMENTS,
} from "@/lib/vincere/constants";

export interface JobFilters {
  position: string;
  department: string;
  jobType: string;
  contractType: string;
  minSalary: string;
  maxSalary: string;
}

interface FilterOptions {
  positions: string[];
  contractTypes: string[];
}

interface JobBoardFiltersProps {
  filters: JobFilters;
  filterOptions: FilterOptions;
  onFiltersChange: (filters: JobFilters) => void;
  onReset: () => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

// Format position category for display
function formatPositionCategory(category: string): string {
  return category
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

// Format contract type for display
function formatContractType(type: string): string {
  return type.charAt(0).toUpperCase() + type.slice(1);
}

export function JobBoardFilters({
  filters,
  filterOptions,
  onFiltersChange,
  onReset,
  isCollapsed = false,
  onToggleCollapse,
}: JobBoardFiltersProps) {
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Get available departments based on selected job type
  const availableDepartments = useMemo(() => {
    if (filters.jobType === "yacht") {
      return Object.entries(YACHT_DEPARTMENTS).map(([key, label]) => ({
        key,
        label,
      }));
    }
    if (filters.jobType === "household") {
      return Object.entries(HOUSEHOLD_DEPARTMENTS).map(([key, label]) => ({
        key,
        label,
      }));
    }
    // All jobs - combine both, avoiding duplicate labels
    const combinedDepts = new Map<string, { key: string; label: string }>();

    // Add yacht departments first
    Object.entries(YACHT_DEPARTMENTS).forEach(([key, label]) => {
      combinedDepts.set(label, { key, label });
    });

    // Add household departments (will override yacht if same label like "Childcare")
    Object.entries(HOUSEHOLD_DEPARTMENTS).forEach(([key, label]) => {
      // For household-specific departments, prefix with "Household - "
      if (key.startsWith("villa_")) {
        combinedDepts.set(`Household - ${label}`, { key, label: `Household - ${label}` });
      } else if (!combinedDepts.has(label)) {
        combinedDepts.set(label, { key, label });
      }
    });

    return Array.from(combinedDepts.values()).sort((a, b) =>
      a.label.localeCompare(b.label)
    );
  }, [filters.jobType]);

  // Clear department if it's no longer valid when job type changes
  useEffect(() => {
    if (filters.department) {
      const isValidDepartment = availableDepartments.some(
        (d) => d.key === filters.department
      );
      if (!isValidDepartment) {
        onFiltersChange({ ...filters, department: "" });
      }
    }
  }, [filters.jobType, filters.department, availableDepartments, onFiltersChange, filters]);

  const handleFilterChange = (key: keyof JobFilters, value: string) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  const hasActiveFilters = Object.values(filters).some((v) => v !== "");

  const activeFilterCount = Object.values(filters).filter((v) => v !== "").length;

  return (
    <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden ring-1 ring-black/5">
      {/* Header */}
      <div className="relative bg-gradient-to-r from-navy-900 via-navy-800 to-navy-900 px-6 py-5">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-gold-500/10 via-transparent to-transparent" />
        <div className="relative flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gold-500/20 ring-1 ring-gold-500/30">
              <Filter className="h-4 w-4 text-gold-400" />
            </div>
            Filter Jobs
            {activeFilterCount > 0 && (
              <span className="ml-2 inline-flex h-6 w-6 items-center justify-center rounded-full bg-gold-500 text-xs font-bold text-white">
                {activeFilterCount}
              </span>
            )}
          </h2>
          {onToggleCollapse && (
            <button
              onClick={onToggleCollapse}
              className="lg:hidden text-gray-300 hover:text-white text-sm flex items-center gap-1"
            >
              <ChevronDown
                className={`h-4 w-4 transition-transform ${
                  isCollapsed ? "" : "rotate-180"
                }`}
              />
              {isCollapsed ? "Show" : "Hide"}
            </button>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className={`p-6 space-y-5 ${isCollapsed ? "hidden lg:block" : ""}`}>
        {/* Position Category */}
        <div>
          <label className="block text-sm font-semibold text-navy-900 mb-2">
            <Briefcase className="inline-block h-4 w-4 mr-2 text-gold-500" />
            Position
          </label>
          <select
            value={filters.position}
            onChange={(e) => handleFilterChange("position", e.target.value)}
            className="w-full rounded-xl border border-gray-200 px-4 py-3.5 text-gray-900 bg-gray-50/50 focus:bg-white focus:border-gold-500 focus:ring-2 focus:ring-gold-500/20 transition-all text-sm font-medium"
          >
            <option value="">All Positions</option>
            {filterOptions.positions.map((pos) => (
              <option key={pos} value={pos}>
                {formatPositionCategory(pos)}
              </option>
            ))}
          </select>
        </div>

        {/* Job Type */}
        <div>
          <label className="block text-sm font-semibold text-navy-900 mb-2">
            <Home className="inline-block h-4 w-4 mr-2 text-gold-500" />
            Job Type
          </label>
          <select
            value={filters.jobType}
            onChange={(e) => handleFilterChange("jobType", e.target.value)}
            className="w-full rounded-xl border border-gray-200 px-4 py-3.5 text-gray-900 bg-gray-50/50 focus:bg-white focus:border-gold-500 focus:ring-2 focus:ring-gold-500/20 transition-all text-sm font-medium"
          >
            <option value="">All Jobs</option>
            <option value="yacht">Yacht Jobs</option>
            <option value="household">Household Jobs</option>
          </select>
        </div>

        {/* Department */}
        <div>
          <label className="block text-sm font-semibold text-navy-900 mb-2">
            <Users className="inline-block h-4 w-4 mr-2 text-gold-500" />
            Department
          </label>
          <select
            value={filters.department}
            onChange={(e) => handleFilterChange("department", e.target.value)}
            className="w-full rounded-xl border border-gray-200 px-4 py-3.5 text-gray-900 bg-gray-50/50 focus:bg-white focus:border-gold-500 focus:ring-2 focus:ring-gold-500/20 transition-all text-sm font-medium"
          >
            <option value="">All Departments</option>
            {availableDepartments.map((dept) => (
              <option key={dept.key} value={dept.key}>
                {dept.label}
              </option>
            ))}
          </select>
        </div>

        {/* Contract Type */}
        <div>
          <label className="block text-sm font-semibold text-navy-900 mb-2">
            <Calendar className="inline-block h-4 w-4 mr-2 text-gold-500" />
            Contract Type
          </label>
          <select
            value={filters.contractType}
            onChange={(e) => handleFilterChange("contractType", e.target.value)}
            className="w-full rounded-xl border border-gray-200 px-4 py-3.5 text-gray-900 bg-gray-50/50 focus:bg-white focus:border-gold-500 focus:ring-2 focus:ring-gold-500/20 transition-all text-sm font-medium"
          >
            <option value="">All Contract Types</option>
            {filterOptions.contractTypes.map((type) => (
              <option key={type} value={type}>
                {formatContractType(type)}
              </option>
            ))}
          </select>
        </div>

        {/* Advanced Filters Toggle */}
        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="w-full text-sm font-medium text-gold-600 hover:text-gold-700 flex items-center justify-center gap-2 py-2"
        >
          <DollarSign className="h-4 w-4" />
          {showAdvanced ? "Hide" : "Show"} Salary Filter
          <ChevronDown
            className={`h-4 w-4 transition-transform ${
              showAdvanced ? "rotate-180" : ""
            }`}
          />
        </button>

        {/* Salary Range - Advanced */}
        {showAdvanced && (
          <div className="space-y-4 pt-2 border-t border-gray-100">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Min Salary
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">
                    &euro;
                  </span>
                  <input
                    type="number"
                    value={filters.minSalary}
                    onChange={(e) =>
                      handleFilterChange("minSalary", e.target.value)
                    }
                    placeholder="0"
                    className="w-full rounded-lg border border-gray-200 pl-7 pr-3 py-2.5 text-sm text-gray-900 bg-gray-50/50 focus:bg-white focus:border-gold-500 focus:ring-2 focus:ring-gold-500/20 transition-all"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Max Salary
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">
                    &euro;
                  </span>
                  <input
                    type="number"
                    value={filters.maxSalary}
                    onChange={(e) =>
                      handleFilterChange("maxSalary", e.target.value)
                    }
                    placeholder="Any"
                    className="w-full rounded-lg border border-gray-200 pl-7 pr-3 py-2.5 text-sm text-gray-900 bg-gray-50/50 focus:bg-white focus:border-gold-500 focus:ring-2 focus:ring-gold-500/20 transition-all"
                  />
                </div>
              </div>
            </div>
            <p className="text-xs text-gray-500 text-center">
              Monthly salary in EUR
            </p>
          </div>
        )}

        {/* Active Filters Pills */}
        {hasActiveFilters && (
          <div className="pt-4 border-t border-gray-100">
            <div className="flex flex-wrap gap-2">
              {filters.position && (
                <FilterPill
                  label={formatPositionCategory(filters.position)}
                  onRemove={() => handleFilterChange("position", "")}
                />
              )}
              {filters.jobType && (
                <FilterPill
                  label={filters.jobType === "yacht" ? "Yacht Jobs" : "Household Jobs"}
                  onRemove={() => handleFilterChange("jobType", "")}
                />
              )}
              {filters.department && (
                <FilterPill
                  label={
                    availableDepartments.find((d) => d.key === filters.department)
                      ?.label || filters.department
                  }
                  onRemove={() => handleFilterChange("department", "")}
                />
              )}
              {filters.contractType && (
                <FilterPill
                  label={formatContractType(filters.contractType)}
                  onRemove={() => handleFilterChange("contractType", "")}
                />
              )}
              {(filters.minSalary || filters.maxSalary) && (
                <FilterPill
                  label={`${filters.minSalary || "0"}-${filters.maxSalary || "Any"}`}
                  onRemove={() => {
                    handleFilterChange("minSalary", "");
                    handleFilterChange("maxSalary", "");
                  }}
                />
              )}
            </div>
          </div>
        )}

        {/* Reset Button */}
        {hasActiveFilters && (
          <button
            onClick={onReset}
            className="w-full flex items-center justify-center gap-2 rounded-xl border border-gray-200 px-4 py-3 text-sm font-medium text-gray-600 hover:bg-gray-50 hover:text-navy-800 transition-colors"
          >
            <RotateCcw className="h-4 w-4" />
            Reset All Filters
          </button>
        )}

        {/* Help Card */}
        <div className="bg-gradient-to-br from-navy-50 to-navy-100 rounded-xl p-4 border border-navy-200">
          <p className="text-sm text-navy-700 font-medium mb-1">
            Can&apos;t find what you&apos;re looking for?
          </p>
          <p className="text-xs text-navy-600">
            Contact our recruitment team for personalized job matching.
          </p>
        </div>
      </div>
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
    <span className="inline-flex items-center gap-1 rounded-full bg-gold-100 px-3 py-1 text-xs font-medium text-gold-700">
      {label}
      <button
        onClick={onRemove}
        className="hover:text-gold-900 transition-colors"
      >
        <X className="h-3 w-3" />
      </button>
    </span>
  );
}
