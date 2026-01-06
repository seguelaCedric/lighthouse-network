/**
 * Job-related utility functions
 * These are pure utility functions that don't need server actions
 */

/**
 * Normalized region groups for consistent filtering
 */
export const REGION_GROUPS: Record<string, { label: string; keywords: string[] }> = {
  mediterranean: {
    label: "Mediterranean",
    keywords: ["med", "mediterranean", "italy", "france", "spain", "greece", "croatia", "monaco", "sardinia", "sicily", "cote d'azur", "riviera", "balearic", "ibiza", "mallorca", "adriatic"],
  },
  caribbean: {
    label: "Caribbean",
    keywords: ["caribbean", "bahamas", "antigua", "st martin", "st barts", "virgin islands", "bvi", "usvi", "turks", "caicos", "cayman", "jamaica", "barbados", "grenada", "st lucia"],
  },
  usa_east: {
    label: "USA East Coast",
    keywords: ["florida", "miami", "fort lauderdale", "palm beach", "new england", "newport", "new york", "east coast", "chesapeake"],
  },
  usa_west: {
    label: "USA West Coast",
    keywords: ["california", "san diego", "los angeles", "san francisco", "seattle", "pacific northwest", "west coast", "alaska"],
  },
  middle_east: {
    label: "Middle East",
    keywords: ["dubai", "abu dhabi", "uae", "qatar", "saudi", "oman", "middle east", "gulf", "arabian"],
  },
  asia_pacific: {
    label: "Asia Pacific",
    keywords: ["asia", "thailand", "indonesia", "bali", "singapore", "hong kong", "japan", "philippines", "malaysia", "maldives", "seychelles", "indian ocean", "pacific", "australia", "new zealand"],
  },
  northern_europe: {
    label: "Northern Europe",
    keywords: ["uk", "united kingdom", "london", "south of england", "scandinavia", "norway", "sweden", "denmark", "netherlands", "germany", "baltic"],
  },
  worldwide: {
    label: "Worldwide / Various",
    keywords: ["worldwide", "global", "various", "international", "itinerary", "rotating", "flexible"],
  },
};

/**
 * Normalize a region string to a region group key
 */
export function normalizeRegion(region: string | null): string | null {
  if (!region) return null;
  const lower = region.toLowerCase();

  for (const [key, group] of Object.entries(REGION_GROUPS)) {
    if (group.keywords.some(kw => lower.includes(kw))) {
      return key;
    }
  }

  return null; // Couldn't categorize
}

/**
 * Check if a job is land-based (vs yacht-based)
 */
export function isLandBasedJob(title: string, positionCategory?: string | null): boolean {
  const lower = `${title} ${positionCategory || ""}`.toLowerCase();
  return lower.includes("land based") ||
         lower.includes("land-based") ||
         lower.includes("private estate") ||
         lower.includes("estate manager") ||
         lower.includes("property manager") ||
         lower.includes("household") ||
         lower.includes("house manager") ||
         lower.includes("housekeeper") ||
         lower.includes("butler") ||
         lower.includes("nanny") ||
         lower.includes("private residence") ||
         lower.includes("private chef") ||
         lower.includes("domestic") ||
         lower.includes("family office") ||
         lower.includes("chalet") ||
         lower.includes("villa");
}
