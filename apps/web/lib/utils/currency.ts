/**
 * Currency formatting utilities
 *
 * Uses the native Intl.NumberFormat API to properly format currencies
 * with correct symbols based on the currency code (EUR, USD, GBP, etc.)
 */

/**
 * Get the currency symbol for a given currency code
 */
export function getCurrencySymbol(currency: string): string {
  try {
    // Use Intl.NumberFormat to get the proper symbol
    const formatter = new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency.toUpperCase(),
      currencyDisplay: "narrowSymbol",
    });
    // Extract just the symbol by formatting 0 and removing the number
    const parts = formatter.formatToParts(0);
    const symbolPart = parts.find((part) => part.type === "currency");
    return symbolPart?.value || currency;
  } catch {
    // Fallback for invalid currency codes
    return currency;
  }
}

/**
 * Format a currency amount with proper symbol and locale formatting
 */
export function formatCurrency(
  amount: number,
  currency: string = "EUR"
): string {
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency.toUpperCase(),
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  } catch {
    // Fallback for invalid currency codes
    return `${currency} ${amount.toLocaleString("en-US")}`;
  }
}

/**
 * Format a currency amount in compact form (e.g., €50k instead of €50,000)
 */
export function formatCurrencyCompact(
  amount: number,
  currency: string = "EUR"
): string {
  const symbol = getCurrencySymbol(currency);
  if (amount >= 1000) {
    return `${symbol}${Math.round(amount / 1000)}k`;
  }
  return `${symbol}${amount.toLocaleString("en-US")}`;
}

/**
 * Get the period label suffix for salary display
 */
export function getSalaryPeriodLabel(
  period: string,
  style: "short" | "long" = "short"
): string {
  const labels: Record<string, { short: string; long: string }> = {
    hourly: { short: "/hr", long: " per hour" },
    daily: { short: "/day", long: " per day" },
    weekly: { short: "/wk", long: " per week" },
    monthly: { short: "/mo", long: " per month" },
    month: { short: "/mo", long: " per month" },
    yearly: { short: "/yr", long: " per year" },
    year: { short: "/yr", long: " per year" },
  };

  const normalized = period?.toLowerCase() || "month";
  return labels[normalized]?.[style] || labels.month[style];
}

/**
 * Format a salary range with proper currency and period
 * Handles all display cases: range, min only, max only, or competitive
 */
export function formatSalaryRange(
  min: number | null | undefined,
  max: number | null | undefined,
  currency: string = "EUR",
  period: string = "month",
  options: {
    style?: "full" | "compact";
    periodStyle?: "short" | "long";
    showPeriod?: boolean;
  } = {}
): string {
  const {
    style = "full",
    periodStyle = "short",
    showPeriod = true,
  } = options;

  const periodLabel = showPeriod ? getSalaryPeriodLabel(period, periodStyle) : "";

  // No salary info
  if (!min && !max) {
    return "Competitive";
  }

  const formatFn = style === "compact" ? formatCurrencyCompact : formatCurrency;

  // Both min and max
  if (min && max) {
    if (min === max) {
      return `${formatFn(min, currency)}${periodLabel}`;
    }
    // For compact style, only show symbol once if they're the same currency
    if (style === "compact") {
      const symbol = getCurrencySymbol(currency);
      return `${symbol}${Math.round(min / 1000)}k - ${symbol}${Math.round(max / 1000)}k${periodLabel}`;
    }
    return `${formatFn(min, currency)} - ${formatFn(max, currency)}${periodLabel}`;
  }

  // Min only
  if (min) {
    return `From ${formatFn(min, currency)}${periodLabel}`;
  }

  // Max only
  if (max) {
    return `Up to ${formatFn(max, currency)}${periodLabel}`;
  }

  return "Competitive";
}
