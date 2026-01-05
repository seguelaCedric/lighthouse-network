"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import {
  IdCard,
  Award,
  FileText,
  MoreHorizontal,
  Filter,
  ArrowUpDown,
  Check
} from "lucide-react";

export type DocumentCategory = "all" | "identity" | "certifications" | "professional" | "other";
export type DocumentStatus = "all" | "pending" | "approved" | "rejected";
export type SortOption = "newest" | "oldest" | "name_asc" | "expiry";

interface DocumentCategoryTabsProps {
  activeCategory: DocumentCategory;
  onCategoryChange: (category: DocumentCategory) => void;
  activeStatus: DocumentStatus;
  onStatusChange: (status: DocumentStatus) => void;
  sortBy: SortOption;
  onSortChange: (sort: SortOption) => void;
  counts: {
    all: number;
    identity: number;
    certifications: number;
    professional: number;
    other: number;
  };
}

const CATEGORIES: { id: DocumentCategory; label: string; icon: React.ElementType }[] = [
  { id: "all", label: "All Documents", icon: FileText },
  { id: "identity", label: "Identity", icon: IdCard },
  { id: "certifications", label: "Certifications", icon: Award },
  { id: "professional", label: "Professional", icon: FileText },
  { id: "other", label: "Other", icon: MoreHorizontal },
];

const STATUS_OPTIONS: { id: DocumentStatus; label: string }[] = [
  { id: "all", label: "All Status" },
  { id: "pending", label: "Pending" },
  { id: "approved", label: "Approved" },
  { id: "rejected", label: "Rejected" },
];

const SORT_OPTIONS: { id: SortOption; label: string }[] = [
  { id: "newest", label: "Newest First" },
  { id: "oldest", label: "Oldest First" },
  { id: "name_asc", label: "Name A-Z" },
  { id: "expiry", label: "Expiry Date" },
];

export function DocumentCategoryTabs({
  activeCategory,
  onCategoryChange,
  activeStatus,
  onStatusChange,
  sortBy,
  onSortChange,
  counts,
}: DocumentCategoryTabsProps) {
  const [showStatusDropdown, setShowStatusDropdown] = React.useState(false);
  const [showSortDropdown, setShowSortDropdown] = React.useState(false);
  const statusRef = React.useRef<HTMLDivElement>(null);
  const sortRef = React.useRef<HTMLDivElement>(null);

  // Close dropdowns when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (statusRef.current && !statusRef.current.contains(event.target as Node)) {
        setShowStatusDropdown(false);
      }
      if (sortRef.current && !sortRef.current.contains(event.target as Node)) {
        setShowSortDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const activeStatusLabel = STATUS_OPTIONS.find(s => s.id === activeStatus)?.label || "All Status";
  const activeSortLabel = SORT_OPTIONS.find(s => s.id === sortBy)?.label || "Newest First";

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-[0px_2px_4px_rgba(26,24,22,0.06)]">
      {/* Category Tabs */}
      <div className="flex items-center gap-1 p-1.5 overflow-x-auto border-b border-gray-100">
        {CATEGORIES.map((category) => {
          const Icon = category.icon;
          const isActive = activeCategory === category.id;
          const count = counts[category.id];

          return (
            <button
              key={category.id}
              onClick={() => onCategoryChange(category.id)}
              className={cn(
                "flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium whitespace-nowrap transition-all",
                isActive
                  ? "bg-gold-100 text-gold-700 border-b-2 border-gold-500"
                  : "text-gray-600 hover:text-navy-800 hover:bg-gray-50"
              )}
            >
              <Icon className={cn("w-4 h-4", isActive ? "text-gold-600" : "text-gray-400")} />
              <span>{category.label}</span>
              <span
                className={cn(
                  "px-2 py-0.5 rounded-full text-xs font-medium",
                  isActive
                    ? "bg-gold-200 text-gold-800"
                    : "bg-gray-100 text-gray-500"
                )}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Filter & Sort Bar */}
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-3">
          {/* Status Filter */}
          <div ref={statusRef} className="relative">
            <button
              onClick={() => {
                setShowStatusDropdown(!showStatusDropdown);
                setShowSortDropdown(false);
              }}
              className={cn(
                "flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors",
                activeStatus !== "all"
                  ? "border-gold-300 bg-gold-50 text-gold-700"
                  : "border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50"
              )}
            >
              <Filter className="w-4 h-4" />
              {activeStatusLabel}
            </button>

            {showStatusDropdown && (
              <div className="absolute top-full left-0 mt-1 w-40 bg-white rounded-lg border border-gray-200 shadow-lg py-1 z-20">
                {STATUS_OPTIONS.map((option) => (
                  <button
                    key={option.id}
                    onClick={() => {
                      onStatusChange(option.id);
                      setShowStatusDropdown(false);
                    }}
                    className={cn(
                      "w-full flex items-center justify-between px-3 py-2 text-sm text-left hover:bg-gray-50 transition-colors",
                      activeStatus === option.id
                        ? "text-gold-700 font-medium"
                        : "text-gray-700"
                    )}
                  >
                    {option.label}
                    {activeStatus === option.id && (
                      <Check className="w-4 h-4 text-gold-600" />
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Sort Dropdown */}
        <div ref={sortRef} className="relative">
          <button
            onClick={() => {
              setShowSortDropdown(!showSortDropdown);
              setShowStatusDropdown(false);
            }}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium text-gray-600 border border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-colors"
          >
            <ArrowUpDown className="w-4 h-4" />
            {activeSortLabel}
          </button>

          {showSortDropdown && (
            <div className="absolute top-full right-0 mt-1 w-40 bg-white rounded-lg border border-gray-200 shadow-lg py-1 z-20">
              {SORT_OPTIONS.map((option) => (
                <button
                  key={option.id}
                  onClick={() => {
                    onSortChange(option.id);
                    setShowSortDropdown(false);
                  }}
                  className={cn(
                    "w-full flex items-center justify-between px-3 py-2 text-sm text-left hover:bg-gray-50 transition-colors",
                    sortBy === option.id
                      ? "text-gold-700 font-medium"
                      : "text-gray-700"
                  )}
                >
                  {option.label}
                  {sortBy === option.id && (
                    <Check className="w-4 h-4 text-gold-600" />
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Helper function to categorize documents by type
export function categorizeDocumentType(documentType: string): DocumentCategory {
  switch (documentType) {
    case "passport":
    case "visa":
      return "identity";
    case "certification":
    case "medical":
      return "certifications";
    case "cv":
    case "reference":
    case "contract":
      return "professional";
    default:
      return "other";
  }
}

// Helper function to filter and sort documents
export function filterAndSortDocuments<T extends {
  documentType: string;
  status: "pending" | "approved" | "rejected";
  uploadedAt: string;
  name: string;
  expiryDate?: string | null;
}>(
  documents: T[],
  category: DocumentCategory,
  status: DocumentStatus,
  sortBy: SortOption
): T[] {
  let filtered = [...documents];

  // Filter by category
  if (category !== "all") {
    filtered = filtered.filter(doc => categorizeDocumentType(doc.documentType) === category);
  }

  // Filter by status
  if (status !== "all") {
    filtered = filtered.filter(doc => doc.status === status);
  }

  // Sort
  switch (sortBy) {
    case "newest":
      filtered.sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime());
      break;
    case "oldest":
      filtered.sort((a, b) => new Date(a.uploadedAt).getTime() - new Date(b.uploadedAt).getTime());
      break;
    case "name_asc":
      filtered.sort((a, b) => a.name.localeCompare(b.name));
      break;
    case "expiry":
      filtered.sort((a, b) => {
        if (!a.expiryDate && !b.expiryDate) return 0;
        if (!a.expiryDate) return 1;
        if (!b.expiryDate) return -1;
        return new Date(a.expiryDate).getTime() - new Date(b.expiryDate).getTime();
      });
      break;
  }

  return filtered;
}

// Helper function to count documents by category
export function countDocumentsByCategory<T extends { documentType: string }>(
  documents: T[]
): { all: number; identity: number; certifications: number; professional: number; other: number } {
  const counts = {
    all: documents.length,
    identity: 0,
    certifications: 0,
    professional: 0,
    other: 0,
  };

  documents.forEach(doc => {
    const category = categorizeDocumentType(doc.documentType);
    counts[category]++;
  });

  return counts;
}
