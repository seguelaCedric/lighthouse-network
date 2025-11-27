"use client";

import * as React from "react";
import { Calendar, ChevronLeft, ChevronRight } from "lucide-react";
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameDay,
  isSameMonth,
  addMonths,
  subMonths,
  isToday,
  startOfWeek,
  endOfWeek,
} from "date-fns";
import { cn } from "@/lib/utils";

export interface DatePickerProps {
  label?: string;
  helperText?: string;
  error?: string;
  value?: Date | null;
  onChange: (date: Date | null) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  id?: string;
  minDate?: Date;
  maxDate?: Date;
}

const DatePicker = React.forwardRef<HTMLDivElement, DatePickerProps>(
  (
    {
      label,
      helperText,
      error,
      value,
      onChange,
      placeholder = "Select date...",
      disabled,
      className,
      id,
      minDate,
      maxDate,
    },
    ref
  ) => {
    const [isOpen, setIsOpen] = React.useState(false);
    const [viewDate, setViewDate] = React.useState(value || new Date());
    const containerRef = React.useRef<HTMLDivElement>(null);
    const pickerId = id || React.useId();

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

    const monthStart = startOfMonth(viewDate);
    const monthEnd = endOfMonth(viewDate);
    const calendarStart = startOfWeek(monthStart);
    const calendarEnd = endOfWeek(monthEnd);
    const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

    const isDateDisabled = (date: Date) => {
      if (minDate && date < minDate) return true;
      if (maxDate && date > maxDate) return true;
      return false;
    };

    const handleDateSelect = (date: Date) => {
      if (!isDateDisabled(date)) {
        onChange(date);
        setIsOpen(false);
      }
    };

    const weekDays = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

    return (
      <div className="w-full" ref={ref}>
        {label && (
          <label
            htmlFor={pickerId}
            className="mb-1.5 block text-sm font-medium text-navy-700"
          >
            {label}
          </label>
        )}
        <div ref={containerRef} className="relative">
          <div
            id={pickerId}
            role="combobox"
            aria-expanded={isOpen}
            aria-haspopup="dialog"
            aria-invalid={!!error}
            aria-describedby={
              error ? `${pickerId}-error` : helperText ? `${pickerId}-helper` : undefined
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
              "flex h-10 w-full cursor-pointer items-center gap-2 rounded-lg border bg-white px-3 py-2 text-sm transition-colors duration-200",
              "focus:outline-none focus:ring-2 focus:ring-offset-0",
              disabled && "cursor-not-allowed bg-gray-50 text-gray-400",
              error
                ? "border-error-500 focus:border-error-500 focus:ring-error-500/20"
                : "border-gray-300 hover:border-gray-400 focus:border-gold-500 focus:ring-gold-500/20",
              className
            )}
          >
            <Calendar className="size-4 text-gray-400" />
            {value ? (
              <span className="text-navy-900">{format(value, "MMM d, yyyy")}</span>
            ) : (
              <span className="text-gray-400">{placeholder}</span>
            )}
          </div>
          {isOpen && (
            <div
              role="dialog"
              aria-modal="true"
              aria-label="Date picker"
              className="absolute z-50 mt-1 w-72 rounded-lg border border-gray-200 bg-white p-3 shadow-lg"
            >
              <div className="mb-3 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setViewDate(subMonths(viewDate, 1))}
                  className="rounded-md p-1 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gold-500"
                >
                  <ChevronLeft className="size-5 text-gray-600" />
                </button>
                <span className="font-medium text-navy-900">
                  {format(viewDate, "MMMM yyyy")}
                </span>
                <button
                  type="button"
                  onClick={() => setViewDate(addMonths(viewDate, 1))}
                  className="rounded-md p-1 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gold-500"
                >
                  <ChevronRight className="size-5 text-gray-600" />
                </button>
              </div>
              <div className="mb-2 grid grid-cols-7 gap-1">
                {weekDays.map((day) => (
                  <div
                    key={day}
                    className="text-center text-xs font-medium text-gray-500"
                  >
                    {day}
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-1">
                {days.map((day) => {
                  const isSelected = value && isSameDay(day, value);
                  const isCurrentMonth = isSameMonth(day, viewDate);
                  const isDisabled = isDateDisabled(day);
                  const isTodayDate = isToday(day);

                  return (
                    <button
                      key={day.toISOString()}
                      type="button"
                      onClick={() => handleDateSelect(day)}
                      disabled={isDisabled}
                      className={cn(
                        "flex size-8 items-center justify-center rounded-md text-sm transition-colors",
                        isSelected
                          ? "bg-gold-500 font-medium text-navy-900"
                          : isCurrentMonth
                            ? "text-navy-900 hover:bg-gray-100"
                            : "text-gray-400",
                        isTodayDate && !isSelected && "ring-1 ring-gold-500",
                        isDisabled && "cursor-not-allowed opacity-50 hover:bg-transparent"
                      )}
                    >
                      {format(day, "d")}
                    </button>
                  );
                })}
              </div>
              <div className="mt-3 flex justify-between border-t border-gray-100 pt-3">
                <button
                  type="button"
                  onClick={() => {
                    onChange(null);
                    setIsOpen(false);
                  }}
                  className="text-sm text-gray-500 hover:text-gray-700"
                >
                  Clear
                </button>
                <button
                  type="button"
                  onClick={() => handleDateSelect(new Date())}
                  className="text-sm font-medium text-gold-600 hover:text-gold-700"
                >
                  Today
                </button>
              </div>
            </div>
          )}
        </div>
        {error && (
          <p id={`${pickerId}-error`} className="mt-1.5 text-sm text-error-500">
            {error}
          </p>
        )}
        {helperText && !error && (
          <p id={`${pickerId}-helper`} className="mt-1.5 text-sm text-gray-500">
            {helperText}
          </p>
        )}
      </div>
    );
  }
);
DatePicker.displayName = "DatePicker";

export { DatePicker };
