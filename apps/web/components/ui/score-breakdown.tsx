"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export interface ScoreSegment {
  id: string;
  label: string;
  value: number;
  maxValue: number;
  color: string;
}

export interface ScoreBreakdownProps {
  segments: ScoreSegment[];
  totalScore: number;
  maxScore?: number;
  showLegend?: boolean;
  showValues?: boolean;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const sizeConfig = {
  sm: {
    barHeight: "h-2",
    legendDot: "size-2",
    legendText: "text-xs",
    valueText: "text-xs",
    totalText: "text-lg",
  },
  md: {
    barHeight: "h-3",
    legendDot: "size-2.5",
    legendText: "text-sm",
    valueText: "text-sm",
    totalText: "text-xl",
  },
  lg: {
    barHeight: "h-4",
    legendDot: "size-3",
    legendText: "text-sm",
    valueText: "text-base",
    totalText: "text-2xl",
  },
};

const ScoreBreakdown = React.forwardRef<HTMLDivElement, ScoreBreakdownProps>(
  (
    {
      segments,
      totalScore,
      maxScore = 100,
      showLegend = true,
      showValues = true,
      size = "md",
      className,
    },
    ref
  ) => {
    const sizes = sizeConfig[size];
    const percentage = (totalScore / maxScore) * 100;

    // Calculate percentage widths for each segment
    const segmentWidths = segments.map((segment) => ({
      ...segment,
      percentage: (segment.value / maxScore) * 100,
    }));

    return (
      <div ref={ref} className={cn("w-full", className)}>
        {/* Total Score */}
        <div className="mb-3 flex items-baseline justify-between">
          <div className="flex items-baseline gap-1">
            <span className={cn("font-bold text-navy-900", sizes.totalText)}>
              {totalScore}
            </span>
            <span className="text-gray-400">/ {maxScore}</span>
          </div>
          <span className={cn("font-medium text-gray-600", sizes.valueText)}>
            {percentage.toFixed(0)}%
          </span>
        </div>

        {/* Progress Bar */}
        <div
          className={cn(
            "w-full overflow-hidden rounded-full bg-gray-100",
            sizes.barHeight
          )}
        >
          <div className="flex h-full">
            {segmentWidths.map((segment, index) => (
              <div
                key={segment.id}
                className={cn(
                  "h-full transition-all duration-500",
                  index === 0 && "rounded-l-full",
                  index === segmentWidths.length - 1 &&
                    segment.percentage + segmentWidths.slice(0, index).reduce((sum, s) => sum + s.percentage, 0) >= 100 &&
                    "rounded-r-full"
                )}
                style={{
                  width: `${segment.percentage}%`,
                  backgroundColor: segment.color,
                }}
                title={`${segment.label}: ${segment.value}/${segment.maxValue}`}
              />
            ))}
          </div>
        </div>

        {/* Legend */}
        {showLegend && (
          <div className="mt-4 grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:gap-4">
            {segments.map((segment) => (
              <div key={segment.id} className="flex items-center gap-2">
                <div
                  className={cn("rounded-full", sizes.legendDot)}
                  style={{ backgroundColor: segment.color }}
                />
                <span className={cn("text-gray-600", sizes.legendText)}>
                  {segment.label}
                </span>
                {showValues && (
                  <span className={cn("font-medium text-navy-900", sizes.legendText)}>
                    {segment.value}
                    <span className="text-gray-400">/{segment.maxValue}</span>
                  </span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }
);
ScoreBreakdown.displayName = "ScoreBreakdown";

export { ScoreBreakdown };
