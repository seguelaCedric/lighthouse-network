"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface TextInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: string;
  className?: string;
  disabled?: boolean;
  prefix?: React.ReactNode;
}

export function TextInput({
  value,
  onChange,
  placeholder,
  type = "text",
  className,
  disabled,
  prefix,
}: TextInputProps) {
  if (prefix) {
    return (
      <div className="relative">
        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
          {prefix}
        </div>
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          disabled={disabled}
          className={cn(
            "block w-full rounded-md border border-gray-300 py-2 pl-10 pr-3 text-sm min-w-0",
            "focus:border-navy-500 focus:outline-none focus:ring-1 focus:ring-navy-500",
            "disabled:bg-gray-100 disabled:text-gray-500",
            className
          )}
        />
      </div>
    );
  }

  return (
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      disabled={disabled}
      className={cn(
        "block w-full rounded-md border border-gray-300 px-3 py-2 text-sm min-w-0",
        "focus:border-navy-500 focus:outline-none focus:ring-1 focus:ring-navy-500",
        "disabled:bg-gray-100 disabled:text-gray-500",
        className
      )}
    />
  );
}
