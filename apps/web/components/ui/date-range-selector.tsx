"use client";

import * as React from "react";
import { Calendar, ChevronDown, Check } from "lucide-react";
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
  isAfter,
  isBefore,
} from "date-fns";
import { cn } from "@/lib/utils";
import {
  DateRangePreset,
  DateRangeValue,
  PRESET_LABELS,
  getPresetDateRange,
  formatDateRangeShort,
} from "@/lib/utils/date-range";

export interface DateRangeSelectorProps {
  value: DateRangeValue;
  onChange: (value: DateRangeValue) => void;
  className?: string;
}

const PRESETS: DateRangePreset[] = [
  "last_7_days",
  "last_30_days",
  "this_month",
  "last_month",
  "this_quarter",
  "this_year",
  "all_time",
];

export function DateRangeSelector({
  value,
  onChange,
  className,
}: DateRangeSelectorProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [showCustom, setShowCustom] = React.useState(value.preset === "custom");
  const [customFrom, setCustomFrom] = React.useState<Date | null>(
    value.preset === "custom" ? value.from : null
  );
  const [customTo, setCustomTo] = React.useState<Date | null>(
    value.preset === "custom" ? value.to : null
  );
  const [viewMonth, setViewMonth] = React.useState(new Date());
  const [selectingStart, setSelectingStart] = React.useState(true);
  const containerRef = React.useRef<HTMLDivElement>(null);

  // Close on click outside
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

  // Close on escape
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsOpen(false);
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handlePresetClick = (preset: DateRangePreset) => {
    if (preset === "custom") {
      setShowCustom(true);
      setSelectingStart(true);
      return;
    }

    const range = getPresetDateRange(preset);
    onChange({
      from: range.from,
      to: range.to,
      preset,
    });
    setShowCustom(false);
    setIsOpen(false);
  };

  const handleDateClick = (date: Date) => {
    if (selectingStart) {
      setCustomFrom(date);
      setCustomTo(null);
      setSelectingStart(false);
    } else {
      // Ensure from is before to
      if (customFrom && isBefore(date, customFrom)) {
        setCustomFrom(date);
        setCustomTo(customFrom);
      } else {
        setCustomTo(date);
      }
      setSelectingStart(true);

      // Apply the custom range
      const from = customFrom && isBefore(date, customFrom) ? date : customFrom;
      const to = customFrom && isBefore(date, customFrom) ? customFrom : date;

      onChange({
        from,
        to,
        preset: "custom",
      });
      setIsOpen(false);
    }
  };

  const isDateInRange = (date: Date) => {
    if (!customFrom) return false;
    if (!customTo) return isSameDay(date, customFrom);
    return (
      (isAfter(date, customFrom) || isSameDay(date, customFrom)) &&
      (isBefore(date, customTo) || isSameDay(date, customTo))
    );
  };

  const monthStart = startOfMonth(viewMonth);
  const monthEnd = endOfMonth(viewMonth);
  const calendarStart = startOfWeek(monthStart);
  const calendarEnd = endOfWeek(monthEnd);
  const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd });
  const weekDays = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "flex h-10 items-center gap-2 rounded-lg border bg-white px-3 text-sm transition-colors",
          "hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-gold-500/20 focus:border-gold-500",
          isOpen ? "border-gold-500 ring-2 ring-gold-500/20" : "border-gray-300"
        )}
      >
        <Calendar className="size-4 text-gray-500" />
        <span className="text-navy-900 font-medium">
          {formatDateRangeShort(value)}
        </span>
        <ChevronDown
          className={cn(
            "size-4 text-gray-400 transition-transform",
            isOpen && "rotate-180"
          )}
        />
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute right-0 z-50 mt-2 rounded-xl border border-gray-200 bg-white shadow-lg">
          <div className="flex">
            {/* Presets */}
            <div className="w-44 border-r border-gray-100 p-2">
              <p className="px-2 py-1.5 text-xs font-medium uppercase tracking-wide text-gray-500">
                Quick select
              </p>
              {PRESETS.map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => handlePresetClick(preset)}
                  className={cn(
                    "flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm transition-colors",
                    value.preset === preset
                      ? "bg-navy-100 text-navy-900 font-medium"
                      : "text-gray-700 hover:bg-gray-50"
                  )}
                >
                  {PRESET_LABELS[preset]}
                  {value.preset === preset && (
                    <Check className="size-4 text-navy-600" />
                  )}
                </button>
              ))}
              <div className="my-2 border-t border-gray-100" />
              <button
                type="button"
                onClick={() => handlePresetClick("custom")}
                className={cn(
                  "flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm transition-colors",
                  showCustom || value.preset === "custom"
                    ? "bg-gold-100 text-gold-800 font-medium"
                    : "text-gray-700 hover:bg-gray-50"
                )}
              >
                Custom range
                {value.preset === "custom" && (
                  <Check className="size-4 text-gold-600" />
                )}
              </button>
            </div>

            {/* Calendar */}
            {showCustom && (
              <div className="w-72 p-4">
                <p className="mb-3 text-xs font-medium text-gray-500">
                  {selectingStart ? "Select start date" : "Select end date"}
                </p>

                {/* Month Navigation */}
                <div className="mb-3 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => setViewMonth(subMonths(viewMonth, 1))}
                    className="rounded-md p-1 hover:bg-gray-100"
                  >
                    <ChevronDown className="size-5 rotate-90 text-gray-600" />
                  </button>
                  <span className="font-medium text-navy-900">
                    {format(viewMonth, "MMMM yyyy")}
                  </span>
                  <button
                    type="button"
                    onClick={() => setViewMonth(addMonths(viewMonth, 1))}
                    className="rounded-md p-1 hover:bg-gray-100"
                  >
                    <ChevronDown className="size-5 -rotate-90 text-gray-600" />
                  </button>
                </div>

                {/* Week Days */}
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

                {/* Days */}
                <div className="grid grid-cols-7 gap-1">
                  {days.map((day) => {
                    const isSelected =
                      (customFrom && isSameDay(day, customFrom)) ||
                      (customTo && isSameDay(day, customTo));
                    const isInRange = isDateInRange(day);
                    const isCurrentMonth = isSameMonth(day, viewMonth);
                    const isTodayDate = isToday(day);

                    return (
                      <button
                        key={day.toISOString()}
                        type="button"
                        onClick={() => handleDateClick(day)}
                        className={cn(
                          "flex size-8 items-center justify-center rounded-md text-sm transition-colors",
                          isSelected
                            ? "bg-gold-500 font-medium text-navy-900"
                            : isInRange
                            ? "bg-gold-100 text-navy-800"
                            : isCurrentMonth
                            ? "text-navy-900 hover:bg-gray-100"
                            : "text-gray-400",
                          isTodayDate && !isSelected && "ring-1 ring-gold-500"
                        )}
                      >
                        {format(day, "d")}
                      </button>
                    );
                  })}
                </div>

                {/* Selected Range Display */}
                {(customFrom || customTo) && (
                  <div className="mt-3 flex items-center justify-between border-t border-gray-100 pt-3 text-xs text-gray-600">
                    <span>
                      {customFrom ? format(customFrom, "MMM d, yyyy") : "Start"}{" "}
                      - {customTo ? format(customTo, "MMM d, yyyy") : "End"}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setCustomFrom(null);
                        setCustomTo(null);
                        setSelectingStart(true);
                      }}
                      className="text-gray-500 hover:text-gray-700"
                    >
                      Clear
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
