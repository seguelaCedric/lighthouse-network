"use client";

import { Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";

type Severity = "debug" | "info" | "warning" | "error" | "critical";
type Method = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

interface ErrorLogFiltersProps {
  selectedSeverity: Severity | "";
  onSeverityChange: (severity: Severity | "") => void;
  selectedMethod: Method | "";
  onMethodChange: (method: Method | "") => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  pathFilter: string;
  onPathFilterChange: (path: string) => void;
  dateFrom: string;
  dateTo: string;
  onDateFromChange: (date: string) => void;
  onDateToChange: (date: string) => void;
  onClearFilters: () => void;
}

const severityOptions: { value: Severity | ""; label: string }[] = [
  { value: "", label: "All Severities" },
  { value: "critical", label: "Critical" },
  { value: "error", label: "Error" },
  { value: "warning", label: "Warning" },
  { value: "info", label: "Info" },
  { value: "debug", label: "Debug" },
];

const methodOptions: { value: Method | ""; label: string }[] = [
  { value: "", label: "All Methods" },
  { value: "GET", label: "GET" },
  { value: "POST", label: "POST" },
  { value: "PUT", label: "PUT" },
  { value: "PATCH", label: "PATCH" },
  { value: "DELETE", label: "DELETE" },
];

export function ErrorLogFilters({
  selectedSeverity,
  onSeverityChange,
  selectedMethod,
  onMethodChange,
  searchQuery,
  onSearchChange,
  pathFilter,
  onPathFilterChange,
  dateFrom,
  dateTo,
  onDateFromChange,
  onDateToChange,
  onClearFilters,
}: ErrorLogFiltersProps) {
  const hasFilters =
    selectedSeverity ||
    selectedMethod ||
    searchQuery ||
    pathFilter ||
    dateFrom ||
    dateTo;

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          placeholder="Search error messages..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full rounded-lg border border-gray-200 bg-white py-2 pl-10 pr-4 text-sm focus:border-navy-500 focus:outline-none focus:ring-1 focus:ring-navy-500"
        />
      </div>

      {/* Filter Row */}
      <div className="flex flex-wrap gap-3">
        {/* Severity */}
        <select
          value={selectedSeverity}
          onChange={(e) => onSeverityChange(e.target.value as Severity | "")}
          className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:border-navy-500 focus:outline-none focus:ring-1 focus:ring-navy-500"
        >
          {severityOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>

        {/* Method */}
        <select
          value={selectedMethod}
          onChange={(e) => onMethodChange(e.target.value as Method | "")}
          className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:border-navy-500 focus:outline-none focus:ring-1 focus:ring-navy-500"
        >
          {methodOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>

        {/* Path Filter */}
        <input
          type="text"
          placeholder="Filter by path..."
          value={pathFilter}
          onChange={(e) => onPathFilterChange(e.target.value)}
          className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:border-navy-500 focus:outline-none focus:ring-1 focus:ring-navy-500"
        />

        {/* Date From */}
        <input
          type="date"
          value={dateFrom}
          onChange={(e) => onDateFromChange(e.target.value)}
          className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:border-navy-500 focus:outline-none focus:ring-1 focus:ring-navy-500"
          placeholder="From date"
        />

        {/* Date To */}
        <input
          type="date"
          value={dateTo}
          onChange={(e) => onDateToChange(e.target.value)}
          className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:border-navy-500 focus:outline-none focus:ring-1 focus:ring-navy-500"
          placeholder="To date"
        />

        {/* Clear Filters */}
        {hasFilters && (
          <Button
            variant="secondary"
            size="sm"
            onClick={onClearFilters}
            className="flex items-center gap-1"
          >
            <X className="size-3" />
            Clear filters
          </Button>
        )}
      </div>
    </div>
  );
}
