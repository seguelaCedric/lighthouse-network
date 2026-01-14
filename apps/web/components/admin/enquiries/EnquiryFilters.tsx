"use client"

import { useState } from "react"
import { cn } from "@/lib/utils"
import { Filter, Search, X, Calendar } from "lucide-react"
import { type EnquiryType } from "@/lib/validations/enquiries"

interface EnquiryFiltersProps {
  selectedType: EnquiryType | "all"
  onTypeChange: (type: EnquiryType | "all") => void
  selectedStatus: string
  onStatusChange: (status: string) => void
  searchQuery: string
  onSearchChange: (query: string) => void
  dateFrom: string
  dateTo: string
  onDateFromChange: (date: string) => void
  onDateToChange: (date: string) => void
  onClearFilters: () => void
}

const typeOptions: { value: EnquiryType | "all"; label: string }[] = [
  { value: "all", label: "All" },
  { value: "contact", label: "Contact" },
  { value: "brief_match", label: "Brief Match" },
  { value: "match_funnel", label: "Match Funnel" },
  { value: "salary_guide", label: "Salary Guide" },
  { value: "employer_referral", label: "Employer Referral" },
]

const statusOptionsByType: Record<string, { value: string; label: string }[]> = {
  all: [
    { value: "", label: "All statuses" },
    { value: "new", label: "New" },
    { value: "contacted", label: "Contacted" },
    { value: "qualified", label: "Qualified" },
    { value: "converted", label: "Converted" },
    { value: "closed", label: "Closed" },
    { value: "pending", label: "Pending" },
    { value: "sent", label: "Sent" },
    { value: "submitted", label: "Submitted" },
    { value: "under_review", label: "Under Review" },
    { value: "verified", label: "Verified" },
    { value: "invalid", label: "Invalid" },
    { value: "duplicate", label: "Duplicate" },
  ],
  contact: [
    { value: "", label: "All statuses" },
    { value: "new", label: "New" },
    { value: "contacted", label: "Contacted" },
    { value: "qualified", label: "Qualified" },
    { value: "converted", label: "Converted" },
    { value: "closed", label: "Closed" },
  ],
  brief_match: [
    { value: "", label: "All statuses" },
    { value: "new", label: "New" },
    { value: "contacted", label: "Contacted" },
    { value: "qualified", label: "Qualified" },
    { value: "converted", label: "Converted" },
    { value: "closed", label: "Closed" },
  ],
  match_funnel: [
    { value: "", label: "All statuses" },
    { value: "new", label: "New" },
    { value: "contacted", label: "Contacted" },
    { value: "qualified", label: "Qualified" },
    { value: "converted", label: "Converted" },
    { value: "closed", label: "Closed" },
  ],
  salary_guide: [
    { value: "", label: "All statuses" },
    { value: "pending", label: "Pending" },
    { value: "sent", label: "Sent" },
  ],
  employer_referral: [
    { value: "", label: "All statuses" },
    { value: "submitted", label: "Submitted" },
    { value: "under_review", label: "Under Review" },
    { value: "verified", label: "Verified" },
    { value: "invalid", label: "Invalid" },
    { value: "duplicate", label: "Duplicate" },
  ],
}

export function EnquiryFilters({
  selectedType,
  onTypeChange,
  selectedStatus,
  onStatusChange,
  searchQuery,
  onSearchChange,
  dateFrom,
  dateTo,
  onDateFromChange,
  onDateToChange,
  onClearFilters,
}: EnquiryFiltersProps) {
  const [showDateFilters, setShowDateFilters] = useState(false)

  const statusOptions = statusOptionsByType[selectedType] || statusOptionsByType.all

  const hasActiveFilters =
    selectedType !== "all" ||
    selectedStatus !== "" ||
    searchQuery !== "" ||
    dateFrom !== "" ||
    dateTo !== ""

  return (
    <div className="space-y-4">
      {/* Type Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-gray-200 pb-4">
        {typeOptions.map((option) => (
          <button
            key={option.value}
            onClick={() => {
              onTypeChange(option.value)
              // Reset status when type changes
              onStatusChange("")
            }}
            className={cn(
              "rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
              selectedType === option.value
                ? "bg-navy-900 text-white"
                : "text-gray-600 hover:bg-gray-100"
            )}
          >
            {option.label}
          </button>
        ))}
      </div>

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search name, email..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full rounded-lg border border-gray-200 py-2 pl-9 pr-3 text-sm placeholder:text-gray-400 focus:border-navy-500 focus:outline-none focus:ring-1 focus:ring-navy-500"
          />
          {searchQuery && (
            <button
              onClick={() => onSearchChange("")}
              className="absolute right-3 top-1/2 -translate-y-1/2"
            >
              <X className="size-4 text-gray-400 hover:text-gray-600" />
            </button>
          )}
        </div>

        {/* Status Filter */}
        <div className="flex items-center gap-2">
          <Filter className="size-4 text-gray-400" />
          <select
            value={selectedStatus}
            onChange={(e) => onStatusChange(e.target.value)}
            className="rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-navy-500 focus:outline-none focus:ring-1 focus:ring-navy-500"
          >
            {statusOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        {/* Date Filter Toggle */}
        <button
          onClick={() => setShowDateFilters(!showDateFilters)}
          className={cn(
            "flex items-center gap-2 rounded-lg border px-3 py-2 text-sm transition-colors",
            showDateFilters || dateFrom || dateTo
              ? "border-navy-500 bg-navy-50 text-navy-700"
              : "border-gray-200 text-gray-600 hover:bg-gray-50"
          )}
        >
          <Calendar className="size-4" />
          Date
          {(dateFrom || dateTo) && (
            <span className="rounded bg-navy-100 px-1.5 py-0.5 text-xs">
              Active
            </span>
          )}
        </button>

        {/* Clear Filters */}
        {hasActiveFilters && (
          <button
            onClick={onClearFilters}
            className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
          >
            <X className="size-4" />
            Clear
          </button>
        )}
      </div>

      {/* Date Range Inputs */}
      {showDateFilters && (
        <div className="flex flex-wrap items-center gap-3 rounded-lg border border-gray-200 bg-gray-50 p-3">
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-600">From:</label>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => onDateFromChange(e.target.value)}
              className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm focus:border-navy-500 focus:outline-none focus:ring-1 focus:ring-navy-500"
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-600">To:</label>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => onDateToChange(e.target.value)}
              className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm focus:border-navy-500 focus:outline-none focus:ring-1 focus:ring-navy-500"
            />
          </div>
          {(dateFrom || dateTo) && (
            <button
              onClick={() => {
                onDateFromChange("")
                onDateToChange("")
              }}
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              Clear dates
            </button>
          )}
        </div>
      )}
    </div>
  )
}
