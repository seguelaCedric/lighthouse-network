"use client";

import * as React from "react";
import { ChevronDown, Search, Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface Option {
  readonly value: string;
  readonly label: string;
}

interface SearchableSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: readonly Option[] | Option[];
  placeholder?: string;
  searchPlaceholder?: string;
  className?: string;
  disabled?: boolean;
}

export function SearchableSelect({
  value,
  onChange,
  options,
  placeholder = "Select...",
  searchPlaceholder = "Type to search...",
  className,
  disabled,
}: SearchableSelectProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState("");
  const containerRef = React.useRef<HTMLDivElement>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);
  const listRef = React.useRef<HTMLUListElement>(null);
  const [highlightedIndex, setHighlightedIndex] = React.useState(0);

  // Filter options based on search query
  const filteredOptions = React.useMemo(() => {
    if (!searchQuery.trim()) return options;
    const query = searchQuery.toLowerCase();
    return options.filter(
      (option) =>
        option.label.toLowerCase().includes(query) ||
        option.value.toLowerCase().includes(query)
    );
  }, [options, searchQuery]);

  // Get the selected option's label
  const selectedLabel = React.useMemo(() => {
    const selected = options.find((o) => o.value === value);
    return selected?.label || "";
  }, [options, value]);

  // Close dropdown when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
        setSearchQuery("");
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Focus input when dropdown opens
  React.useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  // Reset highlighted index when filtered options change
  React.useEffect(() => {
    setHighlightedIndex(0);
  }, [filteredOptions.length]);

  // Scroll highlighted item into view
  React.useEffect(() => {
    if (isOpen && listRef.current) {
      const highlightedItem = listRef.current.children[highlightedIndex] as HTMLElement;
      if (highlightedItem) {
        highlightedItem.scrollIntoView({ block: "nearest" });
      }
    }
  }, [highlightedIndex, isOpen]);

  const handleSelect = (optionValue: string) => {
    onChange(optionValue);
    setIsOpen(false);
    setSearchQuery("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) {
      if (e.key === "Enter" || e.key === " " || e.key === "ArrowDown") {
        e.preventDefault();
        setIsOpen(true);
      }
      return;
    }

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setHighlightedIndex((prev) =>
          prev < filteredOptions.length - 1 ? prev + 1 : prev
        );
        break;
      case "ArrowUp":
        e.preventDefault();
        setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : prev));
        break;
      case "Enter":
        e.preventDefault();
        if (filteredOptions[highlightedIndex]) {
          handleSelect(filteredOptions[highlightedIndex].value);
        }
        break;
      case "Escape":
        e.preventDefault();
        setIsOpen(false);
        setSearchQuery("");
        break;
      case "Tab":
        setIsOpen(false);
        setSearchQuery("");
        break;
    }
  };

  return (
    <div ref={containerRef} className="relative w-full">
      {/* Trigger button */}
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        className={cn(
          "flex w-full items-center justify-between rounded-md border border-gray-300 bg-white px-3 py-2 text-left text-sm",
          "focus:border-navy-500 focus:outline-none focus:ring-1 focus:ring-navy-500",
          "disabled:bg-gray-100 disabled:text-gray-500 disabled:cursor-not-allowed",
          isOpen && "border-navy-500 ring-1 ring-navy-500",
          className
        )}
      >
        <span className={cn(!value && "text-gray-400")}>
          {selectedLabel || placeholder}
        </span>
        <ChevronDown
          className={cn(
            "size-4 text-gray-400 transition-transform duration-200",
            isOpen && "rotate-180"
          )}
        />
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute z-50 mt-1 w-full rounded-md border border-gray-200 bg-white shadow-lg">
          {/* Search input */}
          <div className="border-b border-gray-100 p-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-gray-400" />
              <input
                ref={inputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={searchPlaceholder}
                className="w-full rounded-md border border-gray-200 bg-gray-50 py-1.5 pl-8 pr-3 text-sm placeholder:text-gray-400 focus:border-navy-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-navy-500"
              />
            </div>
          </div>

          {/* Options list */}
          <ul
            ref={listRef}
            className="max-h-60 overflow-auto py-1"
            role="listbox"
          >
            {filteredOptions.length === 0 ? (
              <li className="px-3 py-2 text-sm text-gray-500">
                No options found
              </li>
            ) : (
              filteredOptions.map((option, index) => {
                const isSelected = option.value === value;
                const isHighlighted = index === highlightedIndex;
                return (
                  <li
                    key={option.value}
                    role="option"
                    aria-selected={isSelected}
                    onClick={() => handleSelect(option.value)}
                    onMouseEnter={() => setHighlightedIndex(index)}
                    className={cn(
                      "flex cursor-pointer items-center justify-between px-3 py-2 text-sm transition-colors",
                      isHighlighted && "bg-gray-50",
                      isSelected && "bg-navy-50 text-navy-900 font-medium"
                    )}
                  >
                    {option.label}
                    {isSelected && (
                      <Check className="size-4 text-navy-600" />
                    )}
                  </li>
                );
              })
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
