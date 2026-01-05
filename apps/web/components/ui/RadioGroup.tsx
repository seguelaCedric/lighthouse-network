"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface Option {
  value: string;
  label: string;
}

interface RadioGroupProps {
  name: string;
  value: string;
  onChange: (value: string) => void;
  options: Option[];
  className?: string;
  disabled?: boolean;
}

export function RadioGroup({
  name,
  value,
  onChange,
  options,
  className,
  disabled,
}: RadioGroupProps) {
  return (
    <div className={cn("flex flex-wrap gap-4", className)}>
      {options.map((option) => (
        <label
          key={option.value}
          className={cn(
            "flex cursor-pointer items-center gap-2 text-sm",
            disabled && "cursor-not-allowed opacity-50"
          )}
        >
          <input
            type="radio"
            name={name}
            value={option.value}
            checked={value === option.value}
            onChange={(e) => onChange(e.target.value)}
            disabled={disabled}
            className={cn(
              "h-4 w-4 border-gray-300 text-navy-600",
              "focus:ring-navy-500"
            )}
          />
          <span className="text-gray-700">{option.label}</span>
        </label>
      ))}
    </div>
  );
}
