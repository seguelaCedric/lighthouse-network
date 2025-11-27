"use client";

import * as React from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface SelectProps
  extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, "children"> {
  label?: string;
  helperText?: string;
  error?: string;
  options: SelectOption[];
  placeholder?: string;
  /** Use uppercase tracking-wide styling for section labels */
  sectionLabel?: boolean;
}

const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  (
    { className, label, helperText, error, options, placeholder, id, sectionLabel, ...props },
    ref
  ) => {
    const selectId = id || React.useId();

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={selectId}
            className={cn(
              "mb-1.5 block font-medium",
              sectionLabel
                ? "text-xs uppercase tracking-wide text-gray-500"
                : "text-sm text-gray-600"
            )}
          >
            {label}
          </label>
        )}
        <div className="relative">
          <select
            id={selectId}
            className={cn(
              "flex h-11 w-full appearance-none rounded-md border bg-white px-4 py-3 pr-10 text-sm text-gray-800 transition-all duration-200",
              "focus:outline-none focus:border-2 focus:border-gold-500 focus:shadow-[0px_0px_0px_3px_rgba(180,154,94,0.2)]",
              "disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-400",
              error
                ? "border-error-500 focus:border-error-500 focus:shadow-[0px_0px_0px_3px_rgba(214,69,69,0.2)]"
                : "border-gray-300 hover:border-gray-400",
              className
            )}
            ref={ref}
            aria-invalid={!!error}
            aria-describedby={
              error ? `${selectId}-error` : helperText ? `${selectId}-helper` : undefined
            }
            {...props}
          >
            {placeholder && (
              <option value="" disabled>
                {placeholder}
              </option>
            )}
            {options.map((option) => (
              <option
                key={option.value}
                value={option.value}
                disabled={option.disabled}
              >
                {option.label}
              </option>
            ))}
          </select>
          <ChevronDown className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-gray-400" />
        </div>
        {error && (
          <p id={`${selectId}-error`} className="mt-1.5 text-sm text-error-500">
            {error}
          </p>
        )}
        {helperText && !error && (
          <p id={`${selectId}-helper`} className="mt-1.5 text-sm text-gray-500">
            {helperText}
          </p>
        )}
      </div>
    );
  }
);
Select.displayName = "Select";

export { Select };
