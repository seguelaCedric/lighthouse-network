"use client";

import Link from "next/link";
import { ChevronRight, Home } from "lucide-react";
import { cn } from "@/lib/utils";

export interface BreadcrumbItem {
  label: string;
  href?: string; // undefined for current page (non-clickable)
}

interface DashboardBreadcrumbsProps {
  items: BreadcrumbItem[];
  className?: string;
}

/**
 * Dashboard Breadcrumbs Component
 * Provides context for deep navigation in the dashboard
 * Shows hierarchical path: Dashboard > Content > Blog Posts > Edit Post
 */
export function DashboardBreadcrumbs({ items, className }: DashboardBreadcrumbsProps) {
  return (
    <nav
      aria-label="Breadcrumb"
      className={cn("flex items-center gap-2 text-sm text-gray-600 mb-4", className)}
    >
      {/* Home/Dashboard Link */}
      <Link
        href="/dashboard"
        className="flex items-center text-gray-500 hover:text-navy-800 transition-colors"
        aria-label="Dashboard"
      >
        <Home className="h-4 w-4" />
      </Link>

      {items.map((item, index) => {
        const isLast = index === items.length - 1;

        return (
          <div key={index} className="flex items-center gap-2">
            {/* Separator */}
            <ChevronRight className="h-4 w-4 text-gray-400" aria-hidden="true" />

            {/* Breadcrumb item */}
            {isLast || !item.href ? (
              // Current page (non-clickable)
              <span className="font-medium text-navy-800 truncate max-w-[200px]" aria-current="page">
                {item.label}
              </span>
            ) : (
              // Clickable link
              <Link
                href={item.href}
                className="text-gray-600 hover:text-navy-800 transition-colors truncate max-w-[150px]"
              >
                {item.label}
              </Link>
            )}
          </div>
        );
      })}
    </nav>
  );
}

/**
 * Helper function to generate breadcrumbs for blog posts
 */
export function getBlogBreadcrumbs(postTitle?: string): BreadcrumbItem[] {
  const items: BreadcrumbItem[] = [
    { label: "Content", href: "/dashboard/seo-pages/blog" },
    { label: "Blog Posts", href: "/dashboard/seo-pages/blog" },
  ];

  if (postTitle) {
    items.push({ label: postTitle });
  }

  return items;
}

/**
 * Helper function to generate breadcrumbs for landing pages
 */
export function getLandingPageBreadcrumbs(pageTitle?: string): BreadcrumbItem[] {
  const items: BreadcrumbItem[] = [
    { label: "Content", href: "/dashboard/seo-pages/blog" },
    { label: "Landing Pages", href: "/dashboard/seo-pages/landing-pages" },
  ];

  if (pageTitle) {
    items.push({ label: pageTitle });
  }

  return items;
}

/**
 * Helper function for suggestions page
 */
export function getSuggestionsBreadcrumbs(): BreadcrumbItem[] {
  return [
    { label: "Content", href: "/dashboard/seo-pages/blog" },
    { label: "Content Suggestions" },
  ];
}

/**
 * Helper function for scheduled content
 */
export function getScheduledBreadcrumbs(): BreadcrumbItem[] {
  return [
    { label: "Content", href: "/dashboard/seo-pages/blog" },
    { label: "Scheduled Content" },
  ];
}

/**
 * Helper function for bulk operations
 */
export function getBulkOperationsBreadcrumbs(): BreadcrumbItem[] {
  return [
    { label: "Content", href: "/dashboard/seo-pages/blog" },
    { label: "Bulk Operations" },
  ];
}
