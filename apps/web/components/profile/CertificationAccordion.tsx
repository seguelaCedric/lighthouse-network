"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { ChevronDown } from "lucide-react";

interface CertificationAccordionProps {
  /** Category title */
  title: string;
  /** Number of selected items in this category */
  selectedCount: number;
  /** Total items in category */
  totalCount: number;
  /** Whether accordion is expanded */
  isExpanded: boolean;
  /** Toggle expansion */
  onToggle: () => void;
  /** Content to render when expanded */
  children: React.ReactNode;
  /** Additional class names */
  className?: string;
}

export function CertificationAccordion({
  title,
  selectedCount,
  totalCount,
  isExpanded,
  onToggle,
  children,
  className,
}: CertificationAccordionProps) {
  return (
    <div
      className={cn(
        "rounded-lg border border-gray-200 bg-white overflow-hidden",
        className
      )}
    >
      {/* Header - clickable */}
      <button
        type="button"
        onClick={onToggle}
        className={cn(
          "w-full flex items-center justify-between p-4 text-left transition-colors",
          "hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-gold-500/20",
          isExpanded && "border-b border-gray-100 bg-gray-50/50"
        )}
      >
        <div className="flex items-center gap-3">
          <h4 className="text-sm font-medium text-gray-900">{title}</h4>
          {selectedCount > 0 && (
            <span className="inline-flex items-center rounded-full bg-gold-100 px-2 py-0.5 text-xs font-medium text-gold-800">
              {selectedCount} selected
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-400">{totalCount} items</span>
          <ChevronDown
            className={cn(
              "h-4 w-4 text-gray-400 transition-transform duration-200",
              isExpanded && "rotate-180"
            )}
          />
        </div>
      </button>

      {/* Content - collapsible */}
      <div
        className={cn(
          "grid transition-all duration-200 ease-out",
          isExpanded ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
        )}
      >
        <div className="overflow-hidden">
          <div className="p-4 space-y-3">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}

// Hook to manage multiple accordions - allows multiple open
export function useAccordionState(initialCategories: string[]) {
  const [expanded, setExpanded] = React.useState<Set<string>>(new Set());

  const toggle = React.useCallback((category: string) => {
    setExpanded(prev => {
      const next = new Set(prev);
      if (next.has(category)) {
        next.delete(category);
      } else {
        next.add(category);
      }
      return next;
    });
  }, []);

  const isExpanded = React.useCallback((category: string) => {
    return expanded.has(category);
  }, [expanded]);

  const expandAll = React.useCallback(() => {
    setExpanded(new Set(initialCategories));
  }, [initialCategories]);

  const collapseAll = React.useCallback(() => {
    setExpanded(new Set());
  }, []);

  return { toggle, isExpanded, expandAll, collapseAll };
}
