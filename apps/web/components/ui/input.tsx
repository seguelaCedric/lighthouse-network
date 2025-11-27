"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  helperText?: string;
  error?: string;
  /** Use uppercase tracking-wide styling for section labels */
  sectionLabel?: boolean;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, label, helperText, error, id, sectionLabel, ...props }, ref) => {
    const inputId = id || React.useId();

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={inputId}
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
        <input
          type={type}
          id={inputId}
          className={cn(
            "flex h-11 w-full rounded-md border bg-white px-4 py-3 text-sm text-gray-800 placeholder:text-gray-400 transition-all duration-200",
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
            error ? `${inputId}-error` : helperText ? `${inputId}-helper` : undefined
          }
          {...props}
        />
        {error && (
          <p id={`${inputId}-error`} className="mt-1.5 text-sm text-error-500">
            {error}
          </p>
        )}
        {helperText && !error && (
          <p id={`${inputId}-helper`} className="mt-1.5 text-sm text-gray-500">
            {helperText}
          </p>
        )}
      </div>
    );
  }
);
Input.displayName = "Input";

export { Input };
