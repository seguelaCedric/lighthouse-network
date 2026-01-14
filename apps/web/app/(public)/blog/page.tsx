import { createClient } from "@/lib/supabase/server";
import { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { PublicHeader } from "@/components/pricing/PublicHeader";
import { PublicFooter } from "@/components/pricing/PublicFooter";
import { ResourceCard } from "@/components/resources/ResourceCard";
import { Anchor, Home, BookOpen } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Resource,
  Industry,
  filterByIndustry,
  getIndustryLabel,
} from "@/lib/resources/resource-helpers";

export const metadata: Metadata = {
  title: "Blog | Lighthouse Careers",
  description: "Expert insights on hiring yacht crew and private household staff",
};

export const revalidate = 3600; // Revalidate every hour

interface BlogPageProps {
  searchParams: Promise<{ industry?: string }>;
}

const INDUSTRY_OPTIONS = [
  { value: "all", label: "All Resources", icon: BookOpen },
  { value: "yacht", label: "Yacht Crew", icon: Anchor },
  { value: "household", label: "Private Staff", icon: Home },
] as const;

function IndustryFilter({ currentIndustry }: { currentIndustry: Industry | "all" }) {
  return (
    <div className="flex flex-wrap items-center justify-center gap-2">
      {INDUSTRY_OPTIONS.map((option) => {
        const Icon = option.icon;
        const isActive = currentIndustry === option.value;
        const href =
          option.value === "all" ? "/blog" : `/blog?industry=${option.value}`;

        return (
          <Link
            key={option.value}
            href={href}
            className={cn(
              "flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-colors",
              isActive
                ? "bg-navy-900 text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200 hover:text-gray-900"
            )}
          >
            <Icon className="h-4 w-4" />
            {option.label}
          </Link>
        );
      })}
    </div>
  );
}

export default async function BlogPage({ searchParams }: BlogPageProps) {
  const { industry } = await searchParams;
  const currentIndustry: Industry | "all" =
    industry === "yacht" || industry === "household" ? industry : "all";

  const supabase = await createClient();

  const { data: posts, error } = await supabase
    .from("blog_posts")
    .select(
      `
      id,
      title,
      slug,
      excerpt,
      content_type,
      target_audience,
      target_position,
      published_at,
      view_count,
      content
    `
    )
    .eq("status", "published")
    .order("published_at", { ascending: false });

  if (error) {
    console.error("Blog posts fetch error:", error);
    return notFound();
  }

  // Map to Resource type
  const allResources: Resource[] = (posts || []).map((post) => ({
    id: post.id,
    title: post.title,
    slug: post.slug,
    excerpt: post.excerpt,
    content_type: post.content_type,
    target_audience: post.target_audience,
    target_position: post.target_position,
    published_at: post.published_at,
    view_count: post.view_count,
    content_length: post.content?.length || 0,
  }));

  // Filter by industry if specified
  const filteredResources = filterByIndustry(allResources, currentIndustry);

  // Get page title based on filter
  const pageTitle =
    currentIndustry === "all"
      ? "All Resources"
      : `${getIndustryLabel(currentIndustry)} Resources`;

  const pageDescription =
    currentIndustry === "yacht"
      ? "Hiring guides, career advice, and industry insights for yacht professionals"
      : currentIndustry === "household"
        ? "Expert guidance for hiring and careers in private household and estate service"
        : "Expert insights on hiring yacht crew and private household staff";

  return (
    <div className="min-h-screen bg-white">
      <PublicHeader />

      <main className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="font-serif text-4xl font-semibold text-navy-900 sm:text-5xl">
            {pageTitle}
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-gray-600">
            {pageDescription}
          </p>
        </div>

        {/* Industry Filter */}
        <div className="mb-12">
          <Suspense fallback={<div className="h-10" />}>
            <IndustryFilter currentIndustry={currentIndustry} />
          </Suspense>
        </div>

        {/* Back to Resources link */}
        <div className="mb-8">
          <Link
            href="/resources"
            className="inline-flex items-center gap-2 text-sm font-medium text-gold-600 hover:text-gold-700"
          >
            <span>&larr;</span>
            Back to Resources Hub
          </Link>
        </div>

        {/* Resource Grid */}
        {!filteredResources || filteredResources.length === 0 ? (
          <div className="rounded-xl border border-gray-200 bg-gray-50 py-16 text-center">
            <p className="text-gray-600">
              No resources available
              {currentIndustry !== "all" && ` for ${getIndustryLabel(currentIndustry)}`} yet.
            </p>
            {currentIndustry !== "all" && (
              <Link
                href="/blog"
                className="mt-4 inline-block text-sm font-medium text-gold-600 hover:text-gold-700"
              >
                View all resources &rarr;
              </Link>
            )}
          </div>
        ) : (
          <>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {filteredResources.map((resource) => (
                <ResourceCard key={resource.id} resource={resource} />
              ))}
            </div>

            {/* Results count */}
            <div className="mt-8 text-center text-sm text-gray-500">
              Showing {filteredResources.length}{" "}
              {filteredResources.length === 1 ? "resource" : "resources"}
              {currentIndustry !== "all" && (
                <>
                  {" "}
                  &middot;{" "}
                  <Link href="/blog" className="text-gold-600 hover:text-gold-700">
                    View all {allResources.length} resources
                  </Link>
                </>
              )}
            </div>
          </>
        )}
      </main>

      <PublicFooter />
    </div>
  );
}
