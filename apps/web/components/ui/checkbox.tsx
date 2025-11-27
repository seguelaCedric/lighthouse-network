"use client";

import * as React from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

export interface CheckboxProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "type" | "onChange"> {
  label?: string;
  description?: string;
  /** Controlled checked state */
  checked?: boolean;
  /** Change handler */
  onChange?: (checked: boolean) => void;
}

const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, label, description, id, checked, onChange, disabled, ...props }, ref) => {
    const checkboxId = id || React.useId();
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

    return (
      <div className={cn("flex items-start gap-3", disabled && "opacity-50")}>
        <label
          htmlFor={checkboxId}
          className={cn(
            "relative inline-flex cursor-pointer items-center",
            disabled && "cursor-not-allowed"
          )}
        >
          <input
            type="checkbox"
            id={checkboxId}
            ref={ref}
            checked={isChecked}
            onChange={handleChange}
            disabled={disabled}
            className="sr-only"
            {...props}
          />
          <div
            className={cn(
              "flex size-5 items-center justify-center rounded border-2 transition-all duration-200",
              "focus-within:ring-2 focus-within:ring-gold-500/20 focus-within:ring-offset-1",
              isChecked
                ? "border-gold-500 bg-gold-500"
                : "border-gray-300 bg-white hover:border-gray-400",
              className
            )}
          >
            <Check
              className={cn(
                "size-3.5 text-white transition-opacity duration-200",
                isChecked ? "opacity-100" : "opacity-0"
              )}
              strokeWidth={3}
            />
          </div>
        </label>
        {(label || description) && (
          <div className="flex flex-col">
            {label && (
              <label
                htmlFor={checkboxId}
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
Checkbox.displayName = "Checkbox";

export { Checkbox };
