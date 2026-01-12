"use client";

import Link from "next/link";
import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface RelatedPage {
  id: string;
  original_url_path: string;
  position: string;
  position_slug: string;
  city: string | null;
  state: string | null;
  country: string;
}

interface LateralNavigationProps {
  currentPage: {
    position: string;
    position_slug: string;
    city: string | null;
    state: string | null;
    country: string;
  };
  relatedPositions?: RelatedPage[];
  relatedLocations?: RelatedPage[];
}

/**
 * Lateral Navigation Component
 * Provides quick navigation to sibling pages (other positions in same location, same position in other locations)
 * Placed above the hero section for immediate visibility
 */
export function LateralNavigation({
  currentPage,
  relatedPositions = [],
  relatedLocations = [],
}: LateralNavigationProps) {
  const [showAllPositions, setShowAllPositions] = useState(false);
  const [showAllLocations, setShowAllLocations] = useState(false);

  // Don't show if no related pages
  if (relatedPositions.length === 0 && relatedLocations.length === 0) {
    return null;
  }

  // Get location name for display
  const locationName = currentPage.city || currentPage.state || currentPage.country;

  // Limit displayed items (show first 3, then "+X more" button)
  const maxVisible = 3;
  const visiblePositions = showAllPositions
    ? relatedPositions
    : relatedPositions.slice(0, maxVisible);
  const visibleLocations = showAllLocations
    ? relatedLocations
    : relatedLocations.slice(0, maxVisible);

  const remainingPositions = relatedPositions.length - maxVisible;
  const remainingLocations = relatedLocations.length - maxVisible;

  return (
    <nav className="border-b bg-gray-50" aria-label="Related pages">
      <div className="mx-auto max-w-6xl px-4 py-3 sm:px-6">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          {/* Related Positions (same location, different roles) */}
          {relatedPositions.length > 0 && (
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm text-gray-600 whitespace-nowrap">
                Other positions in {locationName}:
              </span>
              <div className="flex flex-wrap gap-1">
                {visiblePositions.map((page) => (
                  <Link
                    key={page.id}
                    href={`/${page.original_url_path}`}
                    className="inline-flex items-center rounded-md bg-white border border-gray-200 px-3 py-1 text-sm font-medium text-navy-800 hover:border-burgundy-700 hover:bg-burgundy-50 transition-colors"
                  >
                    {page.position}
                  </Link>
                ))}
                {!showAllPositions && remainingPositions > 0 && (
                  <button
                    onClick={() => setShowAllPositions(true)}
                    className="inline-flex items-center gap-1 rounded-md bg-white border border-gray-200 px-3 py-1 text-sm font-medium text-burgundy-700 hover:bg-burgundy-50 transition-colors"
                  >
                    +{remainingPositions} more
                    <ChevronDown className="h-3 w-3" />
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Related Locations (same position, different locations) */}
          {relatedLocations.length > 0 && (
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm text-gray-600 whitespace-nowrap">
                Hire {currentPage.position} in:
              </span>
              <div className="flex flex-wrap gap-1">
                {visibleLocations.map((page) => {
                  const locationLabel = page.city || page.state || page.country;
                  return (
                    <Link
                      key={page.id}
                      href={`/${page.original_url_path}`}
                      className="inline-flex items-center rounded-md bg-white border border-gray-200 px-3 py-1 text-sm font-medium text-navy-800 hover:border-burgundy-700 hover:bg-burgundy-50 transition-colors"
                    >
                      {locationLabel}
                    </Link>
                  );
                })}
                {!showAllLocations && remainingLocations > 0 && (
                  <button
                    onClick={() => setShowAllLocations(true)}
                    className="inline-flex items-center gap-1 rounded-md bg-white border border-gray-200 px-3 py-1 text-sm font-medium text-burgundy-700 hover:bg-burgundy-50 transition-colors"
                  >
                    +{remainingLocations} more
                    <ChevronDown className="h-3 w-3" />
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
