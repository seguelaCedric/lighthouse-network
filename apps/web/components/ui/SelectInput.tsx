"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface Option {
  readonly value: string;
  readonly label: string;
}

interface SelectInputProps {
  value: string;
  onChange: (value: string) => void;
  options: readonly Option[] | Option[];
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

export function SelectInput({
  value,
  onChange,
  options,
  placeholder,
  className,
  disabled,
}: SelectInputProps) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
      className={cn(
        "block w-full rounded-md border border-gray-300 px-3 py-2 text-sm",
        "focus:border-navy-500 focus:outline-none focus:ring-1 focus:ring-navy-500",
        "disabled:bg-gray-100 disabled:text-gray-500",
        className
      )}
    >
      {placeholder && (
        <option value="" disabled>
          {placeholder}
        </option>
      )}
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
}
