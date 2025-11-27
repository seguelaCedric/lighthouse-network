"use client";

import * as React from "react";
import { X, ChevronDown, Check } from "lucide-react";
import { cn } from "@/lib/utils";

export interface MultiSelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface MultiSelectProps {
  label?: string;
  helperText?: string;
  error?: string;
  options: MultiSelectOption[];
  value: string[];
  onChange: (value: string[]) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  id?: string;
}

const MultiSelect = React.forwardRef<HTMLDivElement, MultiSelectProps>(
  (
    {
      label,
      helperText,
      error,
      options,
      value,
      onChange,
      placeholder = "Select options...",
      disabled,
      className,
      id,
    },
    ref
  ) => {
    const [isOpen, setIsOpen] = React.useState(false);
    const containerRef = React.useRef<HTMLDivElement>(null);
    const selectId = id || React.useId();

    React.useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
        if (
          containerRef.current &&
          !containerRef.current.contains(event.target as Node)
        ) {
          setIsOpen(false);
        }
      };
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleToggle = (optionValue: string) => {
      if (value.includes(optionValue)) {
        onChange(value.filter((v) => v !== optionValue));
      } else {
        onChange([...value, optionValue]);
      }
    };

    const handleRemove = (optionValue: string, e: React.MouseEvent) => {
      e.stopPropagation();
      onChange(value.filter((v) => v !== optionValue));
    };

    const selectedLabels = value
      .map((v) => options.find((o) => o.value === v)?.label)
      .filter(Boolean);

    return (
      <div className="w-full" ref={ref}>
        {label && (
          <label
            htmlFor={selectId}
            className="mb-1.5 block text-sm font-medium text-gray-600"
          >
            {label}
          </label>
        )}
        <div ref={containerRef} className="relative">
          <div
            id={selectId}
            role="combobox"
            aria-expanded={isOpen}
            aria-haspopup="listbox"
            aria-invalid={!!error}
            aria-describedby={
              error ? `${selectId}-error` : helperText ? `${selectId}-helper` : undefined
            }
            tabIndex={disabled ? -1 : 0}
            onClick={() => !disabled && setIsOpen(!isOpen)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                !disabled && setIsOpen(!isOpen);
              }
            }}
            className={cn(
              "flex min-h-[44px] w-full cursor-pointer flex-wrap items-center gap-1.5 rounded-md border bg-white px-4 py-3 pr-10 text-sm text-gray-800 transition-all duration-200",
              "focus:outline-none focus:border-2 focus:border-gold-500 focus:shadow-[0px_0px_0px_3px_rgba(180,154,94,0.2)]",
              disabled && "cursor-not-allowed bg-gray-50 text-gray-400",
              error
                ? "border-error-500 focus:border-error-500 focus:shadow-[0px_0px_0px_3px_rgba(214,69,69,0.2)]"
                : "border-gray-300 hover:border-gray-400",
              className
            )}
          >
            {selectedLabels.length > 0 ? (
              selectedLabels.map((label, index) => (
                <span
                  key={value[index]}
                  className="inline-flex items-center gap-1 rounded-md bg-gold-100 px-2 py-0.5 text-xs font-medium text-gold-800"
                >
                  {label}
                  <button
                    type="button"
                    onClick={(e) => handleRemove(value[index], e)}
                    className="rounded-sm hover:bg-gold-200 focus:outline-none"
                    disabled={disabled}
                  >
                    <X className="size-3" />
                  </button>
                </span>
              ))
            ) : (
              <span className="text-gray-400">{placeholder}</span>
            )}
            <ChevronDown
              className={cn(
                "absolute right-3 top-1/2 size-4 -translate-y-1/2 text-gray-400 transition-transform duration-200",
                isOpen && "rotate-180"
              )}
            />
          </div>
          {isOpen && (
            <ul
              role="listbox"
              aria-multiselectable="true"
              className="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-lg border border-gray-200 bg-white py-1 shadow-lg shadow-gray-200/50"
            >
              {options.map((option) => {
                const isSelected = value.includes(option.value);
                return (
                  <li
                    key={option.value}
                    role="option"
                    aria-selected={isSelected}
                    aria-disabled={option.disabled}
                    onClick={() => !option.disabled && handleToggle(option.value)}
                    className={cn(
                      "flex cursor-pointer items-center gap-2 px-3 py-2 text-sm transition-colors",
                      isSelected
                        ? "bg-gold-50 text-navy-900"
                        : "text-navy-700 hover:bg-gray-50",
                      option.disabled && "cursor-not-allowed opacity-50"
                    )}
                  >
                    <span
                      className={cn(
                        "flex size-4 items-center justify-center rounded border",
                        isSelected
                          ? "border-gold-500 bg-gold-500 text-white"
                          : "border-gray-300"
                      )}
                    >
                      {isSelected && <Check className="size-3" />}
                    </span>
                    {option.label}
                  </li>
                );
              })}
            </ul>
          )}
        </div>
        {error && (
          <p id={`${selectId}-error`} className="mt-1.5 text-sm text-error-500">
            {error}
          </p>
        )}
        {helperText && !error && (
          <p id={`${selectId}-helper`} className="mt-1.5 text-sm text-gray-500">
            {helperText}
          </p>
        )}
      </div>
    );
  }
);
MultiSelect.displayName = "MultiSelect";

export { MultiSelect };
