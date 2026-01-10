import {
  startOfDay,
  endOfDay,
  subDays,
  startOfMonth,
  endOfMonth,
  subMonths,
  startOfQuarter,
  startOfYear,
  format,
  parseISO,
  isValid,
} from "date-fns";

export type DateRangePreset =
  | "last_7_days"
  | "last_30_days"
  | "this_month"
  | "last_month"
  | "this_quarter"
  | "this_year"
  | "all_time"
  | "custom";

export interface DateRangeValue {
  from: Date | null;
  to: Date | null;
  preset: DateRangePreset;
}

export const PRESET_LABELS: Record<DateRangePreset, string> = {
  last_7_days: "Last 7 days",
  last_30_days: "Last 30 days",
  this_month: "This month",
  last_month: "Last month",
  this_quarter: "This quarter",
  this_year: "This year",
  all_time: "All time",
  custom: "Custom range",
};

/**
 * Calculate the date range for a given preset
 */
export function getPresetDateRange(preset: DateRangePreset): { from: Date | null; to: Date | null } {
  const today = new Date();
  const todayEnd = endOfDay(today);

  switch (preset) {
    case "last_7_days":
      return {
        from: startOfDay(subDays(today, 6)),
        to: todayEnd,
      };
    case "last_30_days":
      return {
        from: startOfDay(subDays(today, 29)),
        to: todayEnd,
      };
    case "this_month":
      return {
        from: startOfMonth(today),
        to: todayEnd,
      };
    case "last_month":
      const lastMonth = subMonths(today, 1);
      return {
        from: startOfMonth(lastMonth),
        to: endOfMonth(lastMonth),
      };
    case "this_quarter":
      return {
        from: startOfQuarter(today),
        to: todayEnd,
      };
    case "this_year":
      return {
        from: startOfYear(today),
        to: todayEnd,
      };
    case "all_time":
      return {
        from: null,
        to: null,
      };
    case "custom":
      // Custom returns null - caller should provide their own dates
      return {
        from: null,
        to: null,
      };
    default:
      return {
        from: null,
        to: null,
      };
  }
}

/**
 * Parse URL search params into a DateRangeValue
 */
export function parseDateRangeParams(searchParams: {
  from?: string;
  to?: string;
  preset?: string;
}): DateRangeValue {
  const { from, to, preset } = searchParams;

  // If a valid preset is provided, use it
  if (preset && preset in PRESET_LABELS) {
    const typedPreset = preset as DateRangePreset;

    if (typedPreset === "custom" && from && to) {
      const fromDate = parseISO(from);
      const toDate = parseISO(to);

      if (isValid(fromDate) && isValid(toDate)) {
        return {
          from: startOfDay(fromDate),
          to: endOfDay(toDate),
          preset: "custom",
        };
      }
    }

    const range = getPresetDateRange(typedPreset);
    return {
      ...range,
      preset: typedPreset,
    };
  }

  // If from/to dates provided without preset, treat as custom
  if (from || to) {
    const fromDate = from ? parseISO(from) : null;
    const toDate = to ? parseISO(to) : null;

    return {
      from: fromDate && isValid(fromDate) ? startOfDay(fromDate) : null,
      to: toDate && isValid(toDate) ? endOfDay(toDate) : null,
      preset: "custom",
    };
  }

  // Default to all time
  return {
    from: null,
    to: null,
    preset: "all_time",
  };
}

/**
 * Convert a DateRangeValue to URL search params
 */
export function toDateRangeParams(value: DateRangeValue): {
  from?: string;
  to?: string;
  preset: string;
} {
  const params: { from?: string; to?: string; preset: string } = {
    preset: value.preset,
  };

  if (value.preset === "custom") {
    if (value.from) {
      params.from = format(value.from, "yyyy-MM-dd");
    }
    if (value.to) {
      params.to = format(value.to, "yyyy-MM-dd");
    }
  }

  return params;
}

/**
 * Format a DateRangeValue for display
 */
export function formatDateRangeDisplay(value: DateRangeValue): string {
  if (value.preset !== "custom") {
    return PRESET_LABELS[value.preset];
  }

  if (!value.from && !value.to) {
    return "Select dates";
  }

  const fromStr = value.from ? format(value.from, "MMM d, yyyy") : "Start";
  const toStr = value.to ? format(value.to, "MMM d, yyyy") : "End";

  return `${fromStr} - ${toStr}`;
}

/**
 * Get a short display label for the current range (for compact display)
 */
export function formatDateRangeShort(value: DateRangeValue): string {
  if (value.preset !== "custom") {
    return PRESET_LABELS[value.preset];
  }

  if (!value.from && !value.to) {
    return "Custom";
  }

  const fromStr = value.from ? format(value.from, "MMM d") : "";
  const toStr = value.to ? format(value.to, "MMM d") : "";

  if (fromStr && toStr) {
    return `${fromStr} - ${toStr}`;
  }

  return fromStr || toStr || "Custom";
}
