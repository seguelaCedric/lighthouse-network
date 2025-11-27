"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  helperText?: string;
  error?: string;
  /** Use uppercase tracking-wide styling for section labels */
  sectionLabel?: boolean;
}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, label, helperText, error, id, sectionLabel, ...props }, ref) => {
    const textareaId = id || React.useId();

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={textareaId}
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
        <textarea
          id={textareaId}
          className={cn(
            "flex min-h-[100px] w-full rounded-md border bg-white px-4 py-3 text-sm text-gray-800 placeholder:text-gray-400 transition-all duration-200 resize-y",
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
            error ? `${textareaId}-error` : helperText ? `${textareaId}-helper` : undefined
          }
          {...props}
        />
        {error && (
          <p id={`${textareaId}-error`} className="mt-1.5 text-sm text-error-500">
            {error}
          </p>
        )}
        {helperText && !error && (
          <p id={`${textareaId}-helper`} className="mt-1.5 text-sm text-gray-500">
            {helperText}
          </p>
        )}
      </div>
    );
  }
);
Textarea.displayName = "Textarea";

export { Textarea };
