"use client";

import * as React from "react";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { cn } from "@/lib/utils";

export type TrendDirection = "up" | "down" | "neutral";

export interface StatCardProps {
  icon: React.ReactNode;
  value: string | number;
  label: string;
  trend?: {
    value: number;
    direction: TrendDirection;
    label?: string;
  };
  className?: string;
}

const trendConfig: Record<
  TrendDirection,
  { icon: React.ElementType; className: string }
> = {
  up: {
    icon: TrendingUp,
    className: "text-success-600 bg-success-50",
  },
  down: {
    icon: TrendingDown,
    className: "text-error-600 bg-error-50",
  },
  neutral: {
    icon: Minus,
    className: "text-gray-600 bg-gray-100",
  },
};

const StatCard = React.forwardRef<HTMLDivElement, StatCardProps>(
  ({ icon, value, label, trend, className }, ref) => {
    const TrendIcon = trend ? trendConfig[trend.direction].icon : null;

    return (
      <div
        ref={ref}
        className={cn(
          "rounded-lg border border-gray-300/60 bg-white p-6 shadow-[0px_2px_4px_rgba(26,24,22,0.06)] transition-shadow duration-250 ease-out hover:shadow-[0px_4px_8px_rgba(26,24,22,0.08)]",
          className
        )}
      >
        <div className="mb-4 flex items-center justify-between">
          <div className="flex size-10 items-center justify-center rounded-lg bg-gold-100 text-gold-600">
            {icon}
          </div>
          {trend && TrendIcon && (
            <div
              className={cn(
                "flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium",
                trendConfig[trend.direction].className
              )}
            >
              <TrendIcon className="size-3" />
              <span>
                {trend.direction !== "neutral" && (trend.direction === "up" ? "+" : "")}
                {trend.value}%
              </span>
            </div>
          )}
        </div>

        <div>
          <p className="text-3xl font-bold text-navy-800">{value}</p>
          <p className="mt-1 text-sm text-[#7D796F] font-inter">{label}</p>
        </div>

        {trend?.label && (
          <p className="mt-2 text-xs text-[#7D796F] font-inter">{trend.label}</p>
        )}
      </div>
    );
  }
);
StatCard.displayName = "StatCard";

export { StatCard };
