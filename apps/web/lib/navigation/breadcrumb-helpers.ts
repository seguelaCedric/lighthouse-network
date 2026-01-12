import type { BreadcrumbItem } from "@/components/navigation/Breadcrumbs";
import { formatPositionLabel, formatLocationLabel } from "./nav-data";

/**
 * Generate breadcrumbs for blog index page
 */
export function getBlogIndexBreadcrumbs(): BreadcrumbItem[] {
  return [{ label: "Blog" }];
}

/**
 * Generate breadcrumbs for individual blog post
 */
export function getBlogPostBreadcrumbs(postTitle: string): BreadcrumbItem[] {
  return [
    { label: "Blog", href: "/blog" },
    { label: postTitle },
  ];
}

/**
 * Generate breadcrumbs for hire hub page
 */
export function getHireHubBreadcrumbs(): BreadcrumbItem[] {
  return [{ label: "Hire Staff" }];
}

/**
 * Generate breadcrumbs for position hub page (e.g., /hire-a-captain)
 */
export function getPositionHubBreadcrumbs(positionSlug: string): BreadcrumbItem[] {
  const positionLabel = formatPositionLabel(positionSlug);
  return [
    { label: "Hire Staff", href: "/hire" },
    { label: `Hire ${positionLabel}` },
  ];
}

/**
 * Generate breadcrumbs for location hub page (e.g., /hire-in-london)
 */
export function getLocationHubBreadcrumbs(locationSlug: string): BreadcrumbItem[] {
  const locationLabel = formatLocationLabel(locationSlug);
  return [
    { label: "Hire Staff", href: "/hire" },
    { label: `Hire in ${locationLabel}` },
  ];
}

/**
 * Generate breadcrumbs for individual landing page
 * Example: /hire/hire-a-captain/monaco
 */
export function getLandingPageBreadcrumbs(
  positionSlug: string,
  position: string,
  city: string | null,
  state: string | null,
  country: string
): BreadcrumbItem[] {
  const positionLabel = position; // Use full position name from database

  // Build location string
  let locationLabel = "";
  if (city) {
    locationLabel = city;
  } else if (state) {
    locationLabel = state;
  } else {
    locationLabel = country;
  }

  return [
    { label: "Hire Staff", href: "/hire" },
    { label: `Hire ${positionLabel}`, href: `/hire-a-${positionSlug}` },
    { label: `Hire ${positionLabel} in ${locationLabel}` },
  ];
}

/**
 * Generate breadcrumbs based on pathname (fallback for catch-all routes)
 */
export function getBreadcrumbsFromPath(pathname: string): BreadcrumbItem[] {
  const segments = pathname.split("/").filter(Boolean);
  const breadcrumbs: BreadcrumbItem[] = [];

  let currentPath = "";
  segments.forEach((segment, index) => {
    currentPath += `/${segment}`;
    const isLast = index === segments.length - 1;

    // Format segment for display
    const label = segment
      .replace(/-/g, " ")
      .replace(/\b\w/g, (l) => l.toUpperCase());

    breadcrumbs.push({
      label,
      href: isLast ? undefined : currentPath,
    });
  });

  return breadcrumbs;
}
