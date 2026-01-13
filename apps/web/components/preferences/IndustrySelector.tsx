"use client";

import * as React from "react";
import { Ship, Home, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

interface IndustrySelectorProps {
  value: "yacht" | "household" | "both" | null;
  onChange: (value: "yacht" | "household" | "both") => void;
}

const options = [
  {
    value: "yacht" as const,
    label: "Yacht Crew",
    description: "Motor yachts, sailing yachts, and superyachts",
    icon: Ship,
    color: "navy",
  },
  {
    value: "household" as const,
    label: "Private Household",
    description: "Estates, villas, chalets, and city residences",
    icon: Home,
    color: "gold",
  },
  {
    value: "both" as const,
    label: "Open to Both",
    description: "Flexible for yacht or household opportunities",
    icon: Sparkles,
    color: "success",
  },
];

export function IndustrySelector({ value, onChange }: IndustrySelectorProps) {
  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="text-center">
        <h2 className="text-lg font-semibold text-navy-900 sm:text-xl">What type of role are you looking for?</h2>
        <p className="mt-1 text-sm text-gray-600 sm:text-base">
          This helps us show you the most relevant opportunities
        </p>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4">
        {options.map((option) => {
          const isSelected = value === option.value;
          const Icon = option.icon;

          return (
            <button
              key={option.value}
              onClick={() => onChange(option.value)}
              className={cn(
                "group relative flex flex-col items-center rounded-xl border-2 p-4 text-center transition-all sm:p-6",
                "hover:border-navy-300 hover:bg-navy-50/50",
                isSelected
                  ? option.color === "navy"
                    ? "border-navy-600 bg-navy-50"
                    : option.color === "gold"
                      ? "border-gold-500 bg-gold-50"
                      : "border-success-500 bg-success-50"
                  : "border-gray-200 bg-white"
              )}
            >
              {/* Selection indicator */}
              {isSelected && (
                <div
                  className={cn(
                    "absolute right-3 top-3 flex size-6 items-center justify-center rounded-full",
                    option.color === "navy"
                      ? "bg-navy-600"
                      : option.color === "gold"
                        ? "bg-gold-500"
                        : "bg-success-500"
                  )}
                >
                  <svg
                    className="size-4 text-white"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={3}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              )}

              {/* Icon */}
              <div
                className={cn(
                  "mb-3 flex size-12 items-center justify-center rounded-full transition-colors sm:mb-4 sm:size-16",
                  isSelected
                    ? option.color === "navy"
                      ? "bg-navy-100"
                      : option.color === "gold"
                        ? "bg-gold-100"
                        : "bg-success-100"
                    : "bg-gray-100 group-hover:bg-navy-100"
                )}
              >
                <Icon
                  className={cn(
                    "size-6 sm:size-8",
                    isSelected
                      ? option.color === "navy"
                        ? "text-navy-600"
                        : option.color === "gold"
                          ? "text-gold-600"
                          : "text-success-600"
                      : "text-gray-400 group-hover:text-navy-500"
                  )}
                />
              </div>

              {/* Text */}
              <h3
                className={cn(
                  "mb-1 text-sm font-semibold sm:text-base",
                  isSelected ? "text-navy-900" : "text-gray-700"
                )}
              >
                {option.label}
              </h3>
              <p className="text-xs text-gray-500 sm:text-sm">{option.description}</p>
            </button>
          );
        })}
      </div>
    </div>
  );
}
