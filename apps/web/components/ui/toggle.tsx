"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export interface ToggleProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "type" | "onChange"> {
  label?: string;
  description?: string;
  /** Size variant */
  size?: "sm" | "md" | "lg";
  /** Controlled checked state */
  checked?: boolean;
  /** Change handler */
  onChange?: (checked: boolean) => void;
}

const Toggle = React.forwardRef<HTMLInputElement, ToggleProps>(
  ({ className, label, description, id, size = "md", checked, onChange, disabled, ...props }, ref) => {
    const toggleId = id || React.useId();
    const [isChecked, setIsChecked] = React.useState(checked ?? false);

    // Sync with controlled prop
    React.useEffect(() => {
      if (checked !== undefined) {
        setIsChecked(checked);
      }
    }, [checked]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const newChecked = e.target.checked;
      if (checked === undefined) {
        setIsChecked(newChecked);
      }
      onChange?.(newChecked);
    };

    const sizeClasses = {
      sm: {
        track: "h-5 w-9",
        knob: "size-3.5",
        knobTranslate: isChecked ? "translate-x-4" : "translate-x-0.5",
      },
      md: {
        track: "h-6 w-11",
        knob: "size-4",
        knobTranslate: isChecked ? "translate-x-5" : "translate-x-0.5",
      },
      lg: {
        track: "h-7 w-14",
        knob: "size-5",
        knobTranslate: isChecked ? "translate-x-7" : "translate-x-0.5",
      },
    };

    const sizes = sizeClasses[size];

    return (
      <div className={cn("flex items-start gap-3", disabled && "opacity-50")}>
        <label
          htmlFor={toggleId}
          className={cn(
            "relative inline-flex cursor-pointer items-center",
            disabled && "cursor-not-allowed"
          )}
        >
          <input
            type="checkbox"
            role="switch"
            id={toggleId}
            ref={ref}
            checked={isChecked}
            onChange={handleChange}
            disabled={disabled}
            className="sr-only"
            {...props}
          />
          {/* Track */}
          <div
            className={cn(
              "relative rounded-full transition-all duration-200",
              "focus-within:ring-2 focus-within:ring-gold-500/20 focus-within:ring-offset-2",
              // Off state
              !isChecked && "bg-gray-200",
              // On state - gold gradient
              isChecked && "bg-gradient-to-r from-gold-400 to-gold-500",
              sizes.track,
              className
            )}
          >
            {/* Knob */}
            <div
              className={cn(
                "absolute top-1/2 -translate-y-1/2 rounded-full bg-white shadow-md transition-transform duration-200",
                sizes.knob,
                sizes.knobTranslate
              )}
            />
          </div>
        </label>
        {(label || description) && (
          <div className="flex flex-col">
            {label && (
              <label
                htmlFor={toggleId}
                className={cn(
                  "cursor-pointer text-sm font-medium text-gray-800",
                  disabled && "cursor-not-allowed"
                )}
              >
                {label}
              </label>
            )}
            {description && (
              <p className="text-sm text-gray-500">{description}</p>
            )}
          </div>
        )}
      </div>
    );
  }
);
Toggle.displayName = "Toggle";

export { Toggle };
