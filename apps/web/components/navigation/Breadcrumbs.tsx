"use client";

import Link from "next/link";
import { ChevronRight, Home } from "lucide-react";
import { cn } from "@/lib/utils";

export interface BreadcrumbItem {
  label: string;
  href?: string; // undefined for current page (non-clickable)
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
  className?: string;
}

/**
 * Breadcrumbs component with schema.org structured data
 * Provides hierarchical navigation and SEO benefits
 */
export function Breadcrumbs({ items, className }: BreadcrumbsProps) {
  // Generate structured data for SEO
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.label,
      ...(item.href && {
        item: `${process.env.NEXT_PUBLIC_SITE_URL || "https://lighthouse-careers.com"}${item.href}`,
      }),
    })),
  };

  return (
    <>
      {/* Structured data for search engines */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />

      {/* Visual breadcrumbs */}
      <nav
        aria-label="Breadcrumb"
        className={cn("border-b border-gray-100 bg-gray-50/50", className)}
      >
        <div className="mx-auto max-w-6xl px-4 py-3 sm:px-6">
          <ol className="flex flex-wrap items-center gap-2 text-sm">
            {/* Home icon link */}
            <li>
              <Link
                href="/"
                className="flex items-center text-gray-600 hover:text-navy-800 transition-colors"
                aria-label="Home"
              >
                <Home className="h-4 w-4" />
              </Link>
            </li>

            {items.map((item, index) => {
              const isLast = index === items.length - 1;

              return (
                <li key={index} className="flex items-center gap-2">
                  {/* Separator */}
                  <ChevronRight className="h-4 w-4 text-gray-400" aria-hidden="true" />

                  {/* Breadcrumb item */}
                  {isLast || !item.href ? (
                    // Current page (non-clickable)
                    <span
                      className="font-medium text-navy-800 truncate max-w-[200px] sm:max-w-none"
                      aria-current="page"
                    >
                      {item.label}
                    </span>
                  ) : (
                    // Clickable link
                    <Link
                      href={item.href}
                      className="text-gray-600 hover:text-navy-800 transition-colors truncate max-w-[150px] sm:max-w-none"
                    >
                      {item.label}
                    </Link>
                  )}
                </li>
              );
            })}
          </ol>
        </div>
      </nav>
    </>
  );
}
