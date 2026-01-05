"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Toggle } from "./toggle";
import { TextInput } from "./TextInput";

export interface ToggleCardProps {
  /** Card title */
  title: string;
  /** Optional description */
  description?: string;
  /** Optional hint text below description */
  hint?: string;
  /** Controlled checked state */
  checked: boolean;
  /** Change handler for toggle */
  onChange: (checked: boolean) => void;
  /** Whether to show expiry date input when checked */
  showExpiry?: boolean;
  /** Expiry date value (YYYY-MM-DD format) */
  expiryDate?: string;
  /** Change handler for expiry date */
  onExpiryChange?: (date: string) => void;
  /** Expiry date label */
  expiryLabel?: string;
  /** Whether to show custom name input when checked */
  showCustomName?: boolean;
  /** Custom name value */
  customName?: string;
  /** Change handler for custom name */
  onCustomNameChange?: (name: string) => void;
  /** Custom name label */
  customNameLabel?: string;
  /** Custom name placeholder */
  customNamePlaceholder?: string;
  /** Whether the card is disabled */
  disabled?: boolean;
  /** Additional class names */
  className?: string;
}

export function ToggleCard({
  title,
  description,
  hint,
  checked,
  onChange,
  showExpiry = false,
  expiryDate = "",
  onExpiryChange,
  expiryLabel = "Expiry Date",
  showCustomName = false,
  customName = "",
  onCustomNameChange,
  customNameLabel = "Name",
  customNamePlaceholder = "Enter name",
  disabled = false,
  className,
}: ToggleCardProps) {
  return (
    <div
      className={cn(
        "rounded-lg border bg-white p-4 transition-all duration-200",
        checked ? "border-gold-300 bg-gold-50/30" : "border-gray-200",
        disabled && "opacity-50",
        className
      )}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-medium text-gray-900">{title}</h4>
          {description && (
            <p className="mt-0.5 text-sm text-gray-500">{description}</p>
          )}
          {hint && (
            <p className="mt-1 text-xs text-gray-400">{hint}</p>
          )}
        </div>
        <Toggle
          checked={checked}
          onChange={onChange}
          disabled={disabled}
          size="md"
        />
      </div>

      {/* Custom name input - shows when checked and showCustomName is true */}
      {checked && showCustomName && (
        <div className="mt-4 pt-3 border-t border-gray-100">
          <label className="block text-xs font-medium text-gray-600 mb-1.5">
            {customNameLabel}
          </label>
          <TextInput
            type="text"
            value={customName}
            onChange={onCustomNameChange || (() => {})}
            placeholder={customNamePlaceholder}
            disabled={disabled}
          />
        </div>
      )}

      {/* Expiry date input - shows when checked and showExpiry is true */}
      {checked && showExpiry && (
        <div className={cn(
          "mt-4 pt-3 border-t border-gray-100",
          checked && showCustomName && "mt-3 pt-3"
        )}>
          <label className="block text-xs font-medium text-gray-600 mb-1.5">
            {expiryLabel}
          </label>
          <TextInput
            type="date"
            value={expiryDate}
            onChange={onExpiryChange || (() => {})}
            disabled={disabled}
            className="max-w-[200px]"
          />
        </div>
      )}
    </div>
  );
}
