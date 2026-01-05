"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface RangeSliderProps {
  min: number;
  max: number;
  value: [number, number];
  onChange: (value: [number, number]) => void;
  unit?: string;
  step?: number;
  className?: string;
  disabled?: boolean;
}

export function RangeSlider({
  min,
  max,
  value,
  onChange,
  unit = "",
  step = 1,
  className,
  disabled,
}: RangeSliderProps) {
  const [localValue, setLocalValue] = React.useState(value);

  React.useEffect(() => {
    setLocalValue(value);
  }, [value]);

  const handleMinChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newMin = Math.min(Number(e.target.value), localValue[1] - step);
    setLocalValue([newMin, localValue[1]]);
    onChange([newMin, localValue[1]]);
  };

  const handleMaxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newMax = Math.max(Number(e.target.value), localValue[0] + step);
    setLocalValue([localValue[0], newMax]);
    onChange([localValue[0], newMax]);
  };

  const minPercent = ((localValue[0] - min) / (max - min)) * 100;
  const maxPercent = ((localValue[1] - min) / (max - min)) * 100;

  return (
    <div className={cn("space-y-4", className)}>
      <div className="flex items-center justify-between text-sm text-gray-600">
        <span>
          {localValue[0]}
          {unit}
        </span>
        <span>
          {localValue[1]}
          {unit}
        </span>
      </div>

      <div className="relative h-2">
        {/* Track background */}
        <div className="absolute inset-0 rounded-full bg-gray-200" />

        {/* Active track */}
        <div
          className="absolute h-2 rounded-full bg-navy-500"
          style={{
            left: `${minPercent}%`,
            width: `${maxPercent - minPercent}%`,
          }}
        />

        {/* Min slider */}
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={localValue[0]}
          onChange={handleMinChange}
          disabled={disabled}
          className={cn(
            "pointer-events-none absolute w-full appearance-none bg-transparent",
            "[&::-webkit-slider-thumb]:pointer-events-auto",
            "[&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4",
            "[&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full",
            "[&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-navy-500",
            "[&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:cursor-pointer",
            "[&::-webkit-slider-thumb]:shadow-sm",
            "[&::-moz-range-thumb]:pointer-events-auto",
            "[&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:w-4",
            "[&::-moz-range-thumb]:appearance-none [&::-moz-range-thumb]:rounded-full",
            "[&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-navy-500",
            "[&::-moz-range-thumb]:bg-white [&::-moz-range-thumb]:cursor-pointer",
            disabled && "opacity-50"
          )}
        />

        {/* Max slider */}
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={localValue[1]}
          onChange={handleMaxChange}
          disabled={disabled}
          className={cn(
            "pointer-events-none absolute w-full appearance-none bg-transparent",
            "[&::-webkit-slider-thumb]:pointer-events-auto",
            "[&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4",
            "[&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full",
            "[&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-navy-500",
            "[&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:cursor-pointer",
            "[&::-webkit-slider-thumb]:shadow-sm",
            "[&::-moz-range-thumb]:pointer-events-auto",
            "[&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:w-4",
            "[&::-moz-range-thumb]:appearance-none [&::-moz-range-thumb]:rounded-full",
            "[&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-navy-500",
            "[&::-moz-range-thumb]:bg-white [&::-moz-range-thumb]:cursor-pointer",
            disabled && "opacity-50"
          )}
        />
      </div>

      <div className="flex items-center justify-between text-xs text-gray-400">
        <span>
          {min}
          {unit}
        </span>
        <span>
          {max}
          {unit}
        </span>
      </div>
    </div>
  );
}
