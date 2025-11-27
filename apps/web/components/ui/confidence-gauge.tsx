"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export interface ConfidenceGaugeProps {
  value: number;
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
  className?: string;
}

const sizeConfig = {
  sm: { diameter: 64, strokeWidth: 6, fontSize: "text-sm", labelSize: "text-xs" },
  md: { diameter: 96, strokeWidth: 8, fontSize: "text-xl", labelSize: "text-xs" },
  lg: { diameter: 128, strokeWidth: 10, fontSize: "text-2xl", labelSize: "text-sm" },
};

const ConfidenceGauge = React.forwardRef<HTMLDivElement, ConfidenceGaugeProps>(
  ({ value, size = "md", showLabel = true, className }, ref) => {
    const config = sizeConfig[size];
    const radius = (config.diameter - config.strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;
    const progress = Math.min(100, Math.max(0, value));
    const offset = circumference - (progress / 100) * circumference;

    const getColor = (val: number) => {
      if (val >= 80) return { stroke: "stroke-success-500", text: "text-success-600", bg: "bg-success-50" };
      if (val >= 60) return { stroke: "stroke-warning-500", text: "text-warning-600", bg: "bg-warning-50" };
      return { stroke: "stroke-error-500", text: "text-error-600", bg: "bg-error-50" };
    };

    const colors = getColor(progress);

    return (
      <div ref={ref} className={cn("flex flex-col items-center gap-2", className)}>
        <div className="relative" style={{ width: config.diameter, height: config.diameter }}>
          <svg
            className="transform -rotate-90"
            width={config.diameter}
            height={config.diameter}
          >
            {/* Background circle */}
            <circle
              cx={config.diameter / 2}
              cy={config.diameter / 2}
              r={radius}
              fill="none"
              stroke="currentColor"
              strokeWidth={config.strokeWidth}
              className="text-gray-200"
            />
            {/* Progress circle */}
            <circle
              cx={config.diameter / 2}
              cy={config.diameter / 2}
              r={radius}
              fill="none"
              strokeWidth={config.strokeWidth}
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={offset}
              className={cn(colors.stroke, "transition-all duration-500")}
            />
          </svg>
          {/* Center value */}
          <div className="absolute inset-0 flex items-center justify-center">
            <span className={cn("font-bold", config.fontSize, colors.text)}>
              {Math.round(progress)}%
            </span>
          </div>
        </div>
        {showLabel && (
          <span className={cn("font-medium text-gray-600", config.labelSize)}>
            Confidence
          </span>
        )}
      </div>
    );
  }
);
ConfidenceGauge.displayName = "ConfidenceGauge";

export { ConfidenceGauge };
