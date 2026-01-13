"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { FileText, Layout, Lightbulb, Calendar, Archive, Settings } from "lucide-react";
import { cn } from "@/lib/utils";

interface Tab {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  description?: string;
}

const CONTENT_TABS: Tab[] = [
  {
    label: "Blog Posts",
    href: "/dashboard/seo-pages/blog",
    icon: FileText,
    description: "Manage blog content and articles",
  },
  {
    label: "Landing Pages",
    href: "/dashboard/seo-pages/landing-pages",
    icon: Layout,
    description: "Manage SEO landing pages",
  },
  {
    label: "Suggestions",
    href: "/dashboard/seo-pages/blog/suggestions",
    icon: Lightbulb,
    description: "AI-powered content ideas",
  },
  {
    label: "Scheduled",
    href: "/dashboard/seo-pages/blog/scheduled",
    icon: Calendar,
    description: "Scheduled content",
  },
  {
    label: "Bulk Operations",
    href: "/dashboard/seo-pages/blog/bulk",
    icon: Archive,
    description: "Bulk content management",
  },
  {
    label: "SEO Tools",
    href: "/dashboard/seo-pages/tools",
    icon: Settings,
    description: "Content freshness and SEO settings",
  },
];

interface ContentLayoutProps {
  children: React.ReactNode;
  title?: React.ReactNode;
  description?: string;
  actions?: React.ReactNode;
}

/**
 * Unified Content Hub Layout
 * Provides consistent navigation tabs across blog posts and landing pages
 * Makes content management more discoverable with prominent tab navigation
 */
export function ContentLayout({ children, title, description, actions }: ContentLayoutProps) {
  const pathname = usePathname();

  // Determine active tab based on current path
  const activeTab = CONTENT_TABS.find((tab) => {
    if (tab.href === "/dashboard/seo-pages/blog") {
      // Match /dashboard/seo-pages/blog exactly, or with /new or /[id]
      return (
        pathname === tab.href ||
        pathname.startsWith("/dashboard/seo-pages/blog/") &&
        !pathname.includes("/suggestions") &&
        !pathname.includes("/scheduled") &&
        !pathname.includes("/bulk")
      );
    }
    return pathname === tab.href || pathname.startsWith(tab.href + "/");
  });

  return (
    <div className="space-y-6">
      {/* Tab Navigation */}
      <div className="border-b border-gray-200 bg-white">
        <div className="flex items-center justify-between px-6 pt-6">
          {/* Title Section */}
          <div>
            {title && <h1 className="text-2xl font-semibold text-navy-900">{title}</h1>}
            {description && <p className="mt-1 text-sm text-gray-600">{description}</p>}
          </div>

          {/* Actions */}
          {actions && <div className="flex items-center gap-2">{actions}</div>}
        </div>

        {/* Tabs */}
        <nav className="flex gap-1 px-6 mt-6" aria-label="Content sections">
          {CONTENT_TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab?.href === tab.href;

            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={cn(
                  "group flex items-center gap-2 rounded-t-lg px-4 py-3 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-gray-50 text-burgundy-700 border-b-2 border-burgundy-700"
                    : "text-gray-600 hover:text-navy-800 hover:bg-gray-50"
                )}
                aria-current={isActive ? "page" : undefined}
                title={tab.description}
              >
                <Icon className={cn("h-4 w-4", isActive ? "text-burgundy-700" : "text-gray-400 group-hover:text-navy-800")} />
                {tab.label}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Page Content */}
      <div className="px-6">{children}</div>
    </div>
  );
}
