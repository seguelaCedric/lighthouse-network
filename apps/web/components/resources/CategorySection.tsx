"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Resource, ContentType, filterByContentTypes } from "@/lib/resources/resource-helpers";
import { ResourceCard } from "./ResourceCard";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

interface Tab {
  id: string;
  label: string;
  contentTypes: ContentType[];
}

interface CategorySectionProps {
  title: string;
  subtitle: string;
  tabs: Tab[];
  resources: Resource[];
  viewAllHref?: string;
  backgroundClass?: string;
}

export function CategorySection({
  title,
  subtitle,
  tabs,
  resources,
  viewAllHref,
  backgroundClass = "bg-white",
}: CategorySectionProps) {
  const [activeTab, setActiveTab] = useState(tabs[0]?.id || "");

  // Get resources for the active tab
  const activeTabConfig = tabs.find((t) => t.id === activeTab);
  const filteredResources = activeTabConfig
    ? filterByContentTypes(resources, activeTabConfig.contentTypes)
    : [];

  const displayedResources = filteredResources.slice(0, 6);
  const hasMore = filteredResources.length > 6;

  if (resources.length === 0) {
    return null;
  }

  return (
    <section className={cn("py-16 sm:py-20", backgroundClass)}>
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="mb-8 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <h2 className="font-serif text-2xl font-semibold text-navy-900 sm:text-3xl">
              {title}
            </h2>
            <p className="mt-2 text-gray-600">{subtitle}</p>
          </div>

          {viewAllHref && (
            <Link
              href={viewAllHref}
              className="flex items-center gap-2 text-sm font-medium text-gold-600 hover:text-gold-700"
            >
              View all
              <ArrowRight className="h-4 w-4" />
            </Link>
          )}
        </div>

        {tabs.length > 1 && (
          <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-8">
            <TabsList className="flex-wrap">
              {tabs.map((tab) => {
                const tabResources = filterByContentTypes(resources, tab.contentTypes);
                return (
                  <TabsTrigger key={tab.id} value={tab.id}>
                    {tab.label}
                    <span className="ml-1.5 text-xs text-gray-400">
                      ({tabResources.length})
                    </span>
                  </TabsTrigger>
                );
              })}
            </TabsList>
          </Tabs>
        )}

        {displayedResources.length > 0 ? (
          <>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {displayedResources.map((resource) => (
                <ResourceCard key={resource.id} resource={resource} />
              ))}
            </div>

            {hasMore && viewAllHref && (
              <div className="mt-8 text-center">
                <Link
                  href={viewAllHref}
                  className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-6 py-3 text-sm font-medium text-navy-900 transition-colors hover:border-gold-300 hover:bg-gold-50"
                >
                  View all {title.toLowerCase()}
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            )}
          </>
        ) : (
          <div className="rounded-xl border border-gray-200 bg-gray-50 py-12 text-center">
            <p className="text-gray-500">No resources available in this category yet.</p>
          </div>
        )}
      </div>
    </section>
  );
}
