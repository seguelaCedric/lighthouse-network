"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Checkbox } from "@/components/ui/checkbox";
import { TextInput } from "@/components/ui/TextInput";

interface CertificationCheckboxProps {
  /** Unique identifier */
  id: string;
  /** Display label */
  label: string;
  /** Whether this certification is selected */
  checked: boolean;
  /** Toggle handler */
  onToggle: (checked: boolean) => void;
  /** Optional expiry date */
  expiryDate?: string;
  /** Expiry date change handler */
  onExpiryChange?: (date: string) => void;
  /** Whether this allows a custom name (for "Other" type certs) */
  allowCustomName?: boolean;
  /** Custom name value */
  customName?: string;
  /** Custom name change handler */
  onCustomNameChange?: (name: string) => void;
  /** Placeholder for custom name input */
  customNamePlaceholder?: string;
  /** Whether to show expiry by default */
  showExpiryWhenChecked?: boolean;
  /** Additional class names */
  className?: string;
}

export function CertificationCheckbox({
  id,
  label,
  checked,
  onToggle,
  expiryDate = "",
  onExpiryChange,
  allowCustomName = false,
  customName = "",
  onCustomNameChange,
  customNamePlaceholder = "Enter certification name",
  showExpiryWhenChecked = true,
  className,
}: CertificationCheckboxProps) {
  const checkboxId = `cert-${id}`;

  return (
    <div
      className={cn(
        "rounded-md transition-colors",
        checked && "bg-gold-50/50",
        className
      )}
    >
      {/* Main checkbox row */}
      <div className="flex items-start gap-3 p-2">
        <Checkbox
          id={checkboxId}
          checked={checked}
          onChange={onToggle}
        />
        <label
          htmlFor={checkboxId}
          className={cn(
            "flex-1 cursor-pointer text-sm leading-tight",
            checked ? "text-gray-900 font-medium" : "text-gray-700"
          )}
        >
          {label}
        </label>
      </div>

      {/* Expanded content when checked */}
      {checked && (allowCustomName || showExpiryWhenChecked) && (
        <div className="pl-8 pr-2 pb-2 space-y-2">
          {/* Custom name input for "Other" type */}
          {allowCustomName && (
            <div>
              <label className="block text-xs text-gray-500 mb-1">
                Certification Name
              </label>
              <TextInput
                value={customName}
                onChange={onCustomNameChange || (() => {})}
                placeholder={customNamePlaceholder}
                className="text-sm"
              />
            </div>
          )}

          {/* Expiry date input */}
          {showExpiryWhenChecked && (
            <div>
              <label className="block text-xs text-gray-500 mb-1">
                Expiry Date (optional)
              </label>
              <TextInput
                type="date"
                value={expiryDate}
                onChange={onExpiryChange || (() => {})}
                className="text-sm max-w-[180px]"
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
