"use client";

import * as React from "react";
import { X, Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface Option {
  value: string;
  label: string;
}

interface MultiSelectProps {
  value: string[];
  onChange: (value: string[]) => void;
  options: readonly Option[] | Option[];
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

export function MultiSelect({
  value,
  onChange,
  options,
  placeholder = "Select options...",
  className,
  disabled,
}: MultiSelectProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const containerRef = React.useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const toggleOption = (optionValue: string) => {
    if (value.includes(optionValue)) {
      onChange(value.filter((v) => v !== optionValue));
    } else {
      onChange([...value, optionValue]);
    }
  };

  const removeOption = (optionValue: string, e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(value.filter((v) => v !== optionValue));
  };

  const selectedLabels = value
    .map((v) => options.find((o) => o.value === v)?.label)
    .filter(Boolean);

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      <div
        onClick={() => !disabled && setIsOpen(!isOpen)}
        className={cn(
          "min-h-[38px] w-full rounded-md border border-gray-300 px-3 py-2 text-sm",
          "flex flex-wrap items-center gap-1 cursor-pointer",
          "focus-within:border-navy-500 focus-within:ring-1 focus-within:ring-navy-500",
          disabled && "bg-gray-100 cursor-not-allowed"
        )}
      >
        {selectedLabels.length === 0 ? (
          <span className="text-gray-400">{placeholder}</span>
        ) : (
          selectedLabels.map((label, i) => (
            <span
              key={value[i]}
              className="inline-flex items-center gap-1 rounded-full bg-navy-100 px-2 py-0.5 text-xs text-navy-700"
            >
              {label}
              <button
                type="button"
                onClick={(e) => removeOption(value[i], e)}
                className="hover:text-navy-900"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          ))
        )}
      </div>

      {isOpen && !disabled && (
        <div className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md border border-gray-200 bg-white shadow-lg">
          {options.map((option) => (
            <div
              key={option.value}
              onClick={() => toggleOption(option.value)}
              className={cn(
                "flex cursor-pointer items-center justify-between px-3 py-2 text-sm hover:bg-gray-100",
                value.includes(option.value) && "bg-navy-50"
              )}
            >
              <span>{option.label}</span>
              {value.includes(option.value) && (
                <Check className="h-4 w-4 text-navy-600" />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
