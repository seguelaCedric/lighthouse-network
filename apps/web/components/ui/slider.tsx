"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface SliderProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'onChange' | 'defaultValue'> {
  value?: number[];
  defaultValue?: number[];
  min?: number;
  max?: number;
  step?: number;
  onValueChange?: (value: number[]) => void;
  disabled?: boolean;
}

const Slider = React.forwardRef<HTMLDivElement, SliderProps>(
  (
    {
      className,
      value: controlledValue,
      defaultValue = [0],
      min = 0,
      max = 100,
      step = 1,
      onValueChange,
      disabled = false,
      ...props
    },
    ref
  ) => {
    const [internalValue, setInternalValue] = React.useState(defaultValue);
    const value = controlledValue ?? internalValue;
    const currentValue = value[0] ?? 0;

    const percentage = ((currentValue - min) / (max - min)) * 100;

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = [Number(e.target.value)];
      setInternalValue(newValue);
      onValueChange?.(newValue);
    };

    return (
      <div
        ref={ref}
        className={cn("relative flex w-full touch-none select-none items-center", className)}
        {...props}
      >
        <div className="relative h-2 w-full grow overflow-hidden rounded-full bg-gray-100">
          <div
            className="absolute h-full bg-navy-900"
            style={{ width: `${percentage}%` }}
          />
        </div>
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={currentValue}
          onChange={handleChange}
          disabled={disabled}
          className={cn(
            "absolute inset-0 h-full w-full cursor-pointer opacity-0",
            disabled && "cursor-not-allowed"
          )}
        />
        <div
          className="absolute h-5 w-5 rounded-full border-2 border-navy-900 bg-white ring-offset-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy-500 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50"
          style={{ left: `calc(${percentage}% - 10px)` }}
        />
      </div>
    );
  }
);
Slider.displayName = "Slider";

export { Slider };
