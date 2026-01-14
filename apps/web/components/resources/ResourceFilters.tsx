"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";
import { TargetAudience } from "@/lib/resources/resource-helpers";

const FILTER_OPTIONS = [
  { value: "all", label: "All Resources" },
  { value: "employer", label: "For Employers" },
  { value: "candidate", label: "For Candidates" },
] as const;

interface ResourceFiltersProps {
  currentFilter: TargetAudience | "all";
}

export function ResourceFilters({ currentFilter }: ResourceFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleFilterChange = (value: string) => {
    const params = new URLSearchParams(searchParams.toString());

    if (value === "all") {
      params.delete("audience");
    } else {
      params.set("audience", value);
    }

    const queryString = params.toString();
    router.push(queryString ? `/resources?${queryString}` : "/resources", {
      scroll: false,
    });
  };

  return (
    <div className="flex flex-wrap items-center justify-center gap-2">
      {FILTER_OPTIONS.map((option) => (
        <button
          key={option.value}
          onClick={() => handleFilterChange(option.value)}
          className={cn(
            "rounded-full px-4 py-2 text-sm font-medium transition-colors",
            currentFilter === option.value
              ? "bg-navy-900 text-white"
              : "bg-gray-100 text-gray-600 hover:bg-gray-200 hover:text-gray-900"
          )}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
