"use client";

import * as React from "react";
import { Search, X, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export interface SearchInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "type"> {
  onClear?: () => void;
  loading?: boolean;
}

const SearchInput = React.forwardRef<HTMLInputElement, SearchInputProps>(
  ({ className, onClear, loading, value, ...props }, ref) => {
    const hasValue = value !== undefined && value !== "";

    return (
      <div className="relative w-full">
        <div className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2">
          {loading ? (
            <Loader2 className="size-4 animate-spin text-gray-400" />
          ) : (
            <Search className="size-4 text-gray-400" />
          )}
        </div>
        <input
          type="search"
          value={value}
          className={cn(
            "flex h-11 w-full rounded-md border border-gray-300 bg-white pl-10 pr-10 py-3 text-sm text-gray-800 placeholder:text-gray-400 transition-all duration-200",
            "focus:outline-none focus:border-2 focus:border-gold-500 focus:shadow-[0px_0px_0px_3px_rgba(180,154,94,0.2)]",
            "hover:border-gray-400",
            "disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-400",
            "[&::-webkit-search-cancel-button]:hidden",
            className
          )}
          ref={ref}
          {...props}
        />
        {hasValue && onClear && (
          <button
            type="button"
            onClick={onClear}
            className="absolute right-3 top-1/2 -translate-y-1/2 rounded-sm p-0.5 text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-gold-500"
          >
            <X className="size-4" />
          </button>
        )}
      </div>
    );
  }
);
SearchInput.displayName = "SearchInput";

export { SearchInput };
